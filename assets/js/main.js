/* ==========================================================================
   FUTFÁCIL: interações da home
   1. Smooth scroll (Lenis)        5. Busca (overlay)
   2. Âncoras com offset           6. Menu lateral
   3. Header (estado, scrollspy)   7. Reveal on scroll
   4. Dropdowns                    8. Hero em slides, 9. Vitrine
   ========================================================================== */

const CONFIG = {
  // Mesmos valores da referência (peleacademia.com). Diminua `duration`
  // (ex.: 1.2) se achar o scroll "pesado" demais.
  lenis: {
    minWidth: 1024,           // só ativa smooth scroll em desktop
    duration: 2.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    wheelMultiplier: 1,
    touchMultiplier: 2,
  },
  header: {
    scrolledAfter: 40,        // px até a barra virar "pílula" flutuante
    hideOnScrollDown: true,   // some ao rolar pra baixo, volta ao subir
    hideOnFooter: true,       // comportamento da referência
    anchorOffset: 86,         // espaço deixado acima da seção ao clicar num link
  },
  hero: {
    slideMs: 5000,            // tempo de cada slide (igual à peleacademia.com)
  },
};

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
document.documentElement.classList.add("js");

/* ---------- 1. Lenis ---------- */
let lenis = null;
if (window.Lenis && !reduceMotion && innerWidth > CONFIG.lenis.minWidth) {
  lenis = new Lenis({
    duration: CONFIG.lenis.duration,
    easing: CONFIG.lenis.easing,
    orientation: "vertical",
    gestureOrientation: "vertical",
    smoothWheel: true,
    wheelMultiplier: CONFIG.lenis.wheelMultiplier,
    touchMultiplier: CONFIG.lenis.touchMultiplier,
  });
  const raf = (time) => { lenis.raf(time); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  window.lenis = lenis;
}

/* Trava/destrava o scroll da página (overlays abertos) */
let locks = 0;
function lockScroll(on) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  const locked = locks > 0;
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (lenis) locked ? lenis.stop() : lenis.start();
}

function scrollToTarget(target) {
  const offset = target === 0 ? 0 : CONFIG.header.anchorOffset;
  if (lenis) {
    lenis.scrollTo(target, { offset: -offset });
  } else {
    const top = target === 0 ? 0 : target.getBoundingClientRect().top + scrollY - offset;
    scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  }
}

/* ---------- 2. Âncoras ---------- */
document.addEventListener("click", (e) => {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const id = link.getAttribute("href");
  if (id === "#") { e.preventDefault(); return; } // link ainda sem destino (ex.: "Ver todos")
  const target = id === "#top" ? 0 : document.querySelector(id);
  if (target === null) return;
  e.preventDefault();
  closeAllDropdowns();
  closeOverlay(drawer); // destrava o scroll antes de rolar
  scrollToTarget(target);
  history.replaceState(null, "", id === "#" ? " " : id);
});

/* ---------- 3. Header ---------- */
const nav = document.querySelector("[data-nav]");
const footer = document.querySelector(".footer");
let footerVisible = false;
let lastY = scrollY;

// Scrollspy: tópicos com âncora na página (#top = Home, #planos…)
const spyLinks = [...nav.querySelectorAll(".nav__link[href^='#']")]
  .map((a) => ({ a, el: a.hash === "#top" ? document.getElementById("hero") : document.querySelector(a.hash) }))
  .filter((x) => x.el);

function updateSpy() {
  const line = innerHeight * 0.45;
  let current = spyLinks[0];
  spyLinks.forEach((x) => { if (x.el.getBoundingClientRect().top <= line) current = x; });
  // se a seção atual já terminou (ex.: passou dos planos), volta a não marcar nada além da Home
  if (current && current.el.getBoundingClientRect().bottom < line && current !== spyLinks[0]) current = null;
  spyLinks.forEach((x) => {
    const on = x === current;
    x.a.classList.toggle("is-active", on);
    on ? x.a.setAttribute("aria-current", "page") : x.a.removeAttribute("aria-current");
  });
}

function updateHeader() {
  const y = scrollY;
  nav.classList.toggle("is-scrolled", y > CONFIG.header.scrolledAfter);

  let hide = false;
  if (CONFIG.header.hideOnScrollDown) {
    hide = nav.classList.contains("is-hidden");          // mantém o estado em micro-movimentos
    if (y > lastY + 2 && y > innerHeight * 0.6) hide = true;  // descendo
    if (y < lastY - 2 || y <= innerHeight * 0.6) hide = false; // subindo ou perto do topo
  }
  if (CONFIG.header.hideOnFooter && footerVisible) hide = true;
  if (document.querySelector(".dd.is-open")) hide = false;

  nav.classList.toggle("is-hidden", hide);
  lastY = y;
  updateSpy();
}
if (lenis) lenis.on("scroll", updateHeader);
else addEventListener("scroll", updateHeader, { passive: true });
updateHeader();

if (footer && CONFIG.header.hideOnFooter) {
  new IntersectionObserver(([entry]) => {
    footerVisible = entry.isIntersecting && matchMedia("(min-width: 920px)").matches;
    updateHeader();
  }).observe(footer);
}

/* ---------- 4. Dropdowns ----------
   Desktop: abre no hover (com pequeno atraso pra fechar) e no clique.
   Teclado: Enter/Espaço abre, Esc fecha. */
const dropdowns = [...document.querySelectorAll("[data-dd]")];

function setDropdown(dd, open) {
  dd.classList.toggle("is-open", open);
  dd.querySelector(".dd__trigger").setAttribute("aria-expanded", String(open));
}
function closeAllDropdowns(except) {
  dropdowns.forEach((dd) => dd !== except && setDropdown(dd, false));
}

dropdowns.forEach((dd) => {
  const trigger = dd.querySelector(".dd__trigger");
  let timer;
  trigger.addEventListener("click", () => {
    const open = !dd.classList.contains("is-open");
    closeAllDropdowns(dd);
    setDropdown(dd, open);
  });
  if (finePointer) {
    dd.addEventListener("mouseenter", () => { clearTimeout(timer); closeAllDropdowns(dd); setDropdown(dd, true); });
    dd.addEventListener("mouseleave", () => { timer = setTimeout(() => setDropdown(dd, false), 160); });
  }
  dd.addEventListener("focusout", (e) => { if (!dd.contains(e.relatedTarget)) setDropdown(dd, false); });
});
document.addEventListener("click", (e) => { if (!e.target.closest("[data-dd]")) closeAllDropdowns(); });

/* ---------- 5 e 6. Overlays (busca e menu lateral) ---------- */
const search = document.getElementById("search");
const drawer = document.getElementById("drawer");
let lastFocus = null;

function openOverlay(el, focusEl) {
  if (!el || !el.hidden) return;
  closeAllDropdowns();
  lastFocus = document.activeElement;
  el.hidden = false;
  lockScroll(true);
  document.querySelectorAll(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute("aria-expanded", "true"));
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("is-open")));
  (focusEl || el.querySelector("input, button, a"))?.focus({ preventScroll: true });
}

function closeOverlay(el) {
  if (!el || el.hidden) return;
  el.classList.remove("is-open");
  lockScroll(false);
  document.querySelectorAll(`[aria-controls="${el.id}"]`).forEach((b) => b.setAttribute("aria-expanded", "false"));
  setTimeout(() => { el.hidden = true; }, reduceMotion ? 0 : 450);
  lastFocus?.focus?.({ preventScroll: true });
}

// mantém o Tab dentro do overlay aberto
function trapFocus(e, el) {
  const items = [...el.querySelectorAll("a[href], button, input, [tabindex]:not([tabindex='-1'])")].filter((x) => x.offsetParent);
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

document.querySelectorAll("[data-search-open]").forEach((b) =>
  b.addEventListener("click", () => openOverlay(search, search.querySelector("input[type=search]")))
);
search?.querySelectorAll("[data-search-close]").forEach((b) => b.addEventListener("click", () => closeOverlay(search)));

document.querySelectorAll("[data-drawer-open]").forEach((b) => b.addEventListener("click", () => openOverlay(drawer)));
drawer?.querySelectorAll("[data-drawer-close]").forEach((b) => b.addEventListener("click", () => closeOverlay(drawer)));

addEventListener("keydown", (e) => {
  const open = [search, drawer].find((el) => el && !el.hidden);
  if (e.key === "Escape") {
    if (open) { closeOverlay(open); return; }
    const dd = document.querySelector(".dd.is-open");
    if (dd) { setDropdown(dd, false); dd.querySelector(".dd__trigger").focus(); }
    return;
  }
  if (e.key === "Tab" && open) { trapFocus(e, open); return; }
  // atalho: "/" ou Ctrl/Cmd+K abre a busca
  const typing = e.target.closest?.("input, textarea, select, [contenteditable]");
  if (!open && !typing && (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"))) {
    e.preventDefault();
    openOverlay(search, search.querySelector("input[type=search]"));
  }
});

/* ---------- 7. Reveal on scroll ----------
   Use data-reveal em qualquer elemento. Em grupos, data-reveal-group no pai
   escalona os filhos automaticamente. */
document.querySelectorAll("[data-reveal-group]").forEach((group) => {
  [...group.children].forEach((child, i) => {
    child.setAttribute("data-reveal", "");
    child.style.setProperty("--reveal-i", i);
  });
});
const revealObserver = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-visible");
    obs.unobserve(entry.target);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
const observeReveals = (root = document) =>
  root.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((el) => revealObserver.observe(el));
observeReveals();

/* ---------- 8. Hero: slides Jogador / Clube ----------
   Foto, texto e aba trocam juntos. Mesmo ritmo da peleacademia.com:
   troca a cada 5s (setInterval de 5000ms) e transição de 1,1s.
   Pausa com o mouse ou o foco em cima do texto (dá tempo de ler e clicar),
   quando a aba do navegador está escondida e com "reduzir movimento" ligado. */
const SLIDE_MS = CONFIG.hero?.slideMs ?? 5000;
const heroEl = document.getElementById("hero");
const slideTabs = [...document.querySelectorAll(".hero__switch [role='tab']")];
const slideCopies = slideTabs.map((t) => document.getElementById(t.getAttribute("aria-controls")));
const slidePhotos = [...document.querySelectorAll("[data-hero-photo]")];
const switchEl = document.querySelector(".hero__switch");
let slideIndex = 0;
let slideTimer = null;

// mesma técnica da referência: o próximo volta pra direita sem animar, depois entra
function swapLayer(list, from, to) {
  const prev = list[from], next = list[to];
  if (!prev || !next || prev === next) return;
  next.classList.remove("is-active", "is-leaving");
  next.classList.add("no-anim");
  void next.offsetWidth;            // força o navegador a aplicar a posição inicial
  next.classList.remove("no-anim");
  prev.classList.remove("is-active");
  prev.classList.add("is-leaving");
  next.classList.add("is-active");
}

function goToSlide(to) {
  to = (to + slideTabs.length) % slideTabs.length;
  if (to === slideIndex) return;
  swapLayer(slideCopies, slideIndex, to);
  swapLayer(slidePhotos, slideIndex, to);
  slideTabs.forEach((t, i) => t.setAttribute("aria-selected", String(i === to)));
  slideCopies.forEach((copy, i) => { copy.inert = i !== to; }); // só o slide visível é clicável
  slideIndex = to;
}

// reinicia a barrinha de progresso embaixo da aba ativa
function restartProgress() {
  if (!switchEl) return;
  switchEl.classList.remove("is-playing");
  void switchEl.offsetWidth;
  switchEl.classList.add("is-playing");
}

function stopSlides() {
  clearInterval(slideTimer);
  slideTimer = null;
  switchEl?.classList.remove("is-playing");
}

function startSlides() {
  if (reduceMotion || slideTabs.length < 2 || document.hidden) return;
  stopSlides();
  switchEl?.style.setProperty("--slide-ms", SLIDE_MS + "ms");
  restartProgress();
  slideTimer = setInterval(() => { goToSlide(slideIndex + 1); restartProgress(); }, SLIDE_MS);
}

slideTabs.forEach((tab, i) => tab.addEventListener("click", () => { goToSlide(i); startSlides(); }));

// setas do teclado nas abas
switchEl?.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  goToSlide(slideIndex + (e.key === "ArrowRight" ? 1 : -1));
  slideTabs[slideIndex].focus();
  startSlides();
});

const heroInner = heroEl?.querySelector(".hero__inner");
heroInner?.addEventListener("mouseenter", stopSlides);
heroInner?.addEventListener("mouseleave", startSlides);
heroInner?.addEventListener("focusin", stopSlides);
heroInner?.addEventListener("focusout", (e) => { if (!heroInner.contains(e.relatedTarget)) startSlides(); });
document.addEventListener("visibilitychange", () => (document.hidden ? stopSlides() : startSlides()));
startSlides();

/* ---------- 9. Vitrine de jogadores ----------
   Dados de EXEMPLO. Depois virão da API/banco do site. */
const PLAYERS = [
  { name: "Lucas Andrade", position: "Atacante", age: 19, city: "Campinas, SP", photo: "" },
  { name: "Rafael Souza",  position: "Goleiro",  age: 22, city: "Recife, PE",   photo: "" },
  { name: "Matheus Lima",  position: "Volante",  age: 20, city: "Goiânia, GO",  photo: "" },
  { name: "Diego Ferreira",position: "Zagueiro", age: 24, city: "Porto Alegre, RS", photo: "" },
  { name: "João Pedro",    position: "Meia",     age: 18, city: "Belo Horizonte, MG", photo: "" },
  { name: "Caio Martins",  position: "Lateral",  age: 21, city: "Salvador, BA", photo: "" },
  { name: "Vinícius Rocha",position: "Atacante", age: 23, city: "Curitiba, PR", photo: "" },
  { name: "Bruno Alves",   position: "Zagueiro", age: 19, city: "Fortaleza, CE", photo: "" },
];

const grid = document.querySelector("[data-players]");
const filters = document.querySelector("[data-filters]");

const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderPlayers(position = "Todos") {
  if (!grid) return;
  // data-limit no container = só uma prévia (ex.: 4 atletas)
  const limit = Number(grid.dataset.limit) || Infinity;
  const list = (position === "Todos" ? PLAYERS : PLAYERS.filter((p) => p.position === position)).slice(0, limit);
  grid.innerHTML = list.length
    ? list.map((p, i) => `
        <a class="card player" href="https://futfacil.com.br/jogadores/" data-reveal style="--reveal-i:${i % 4}">
          <div class="player__photo">
            ${p.photo
              ? `<img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.name)}" loading="lazy">`
              : `<span class="player__initials" aria-hidden="true">${escapeHTML(initials(p.name))}</span>`}
            <span class="badge">${escapeHTML(p.position)}</span>
          </div>
          <div class="player__body">
            <span class="player__name">${escapeHTML(p.name)}</span>
            <span class="player__info">${p.age} anos, ${escapeHTML(p.city)}</span>
          </div>
        </a>`).join("")
    : `<p class="players__empty">Nenhum jogador nessa posição ainda. Que tal ser o primeiro?</p>`;
  observeReveals(grid);
}

if (filters) {
  const positions = ["Todos", ...new Set(PLAYERS.map((p) => p.position))];
  filters.innerHTML = positions
    .map((p, i) => `<button class="chip" type="button" aria-pressed="${i === 0}">${p}</button>`)
    .join("");
  filters.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    filters.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    renderPlayers(chip.textContent);
  });
}
renderPlayers();

/* Ano no footer */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
