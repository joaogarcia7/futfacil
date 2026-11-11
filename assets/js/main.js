/* ==========================================================================
   FUTFÁCIL: interações da home
   1. Smooth scroll (Lenis)        5. Busca (overlay)
   2. Âncoras com offset           6. Menu lateral
   3. Header (estado, scrollspy)   7. Reveal on scroll
   4. Dropdowns                    8. Hero em slides, 9. Vitrine (ficha de scout), 10. Contratados, 11. Clubes, 12. Busca do hero
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
    hideOnScrollDown: false,  // header fica sempre visível (pedido do cliente)
    hideOnFooter: false,      // não some quando o rodapé aparece
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
  { name: "Lucas Andrade", position: "Atacante", age: 19, city: "Campinas, SP", photo: "", stats: [88, 70, 84, 72, 74] },
  { name: "Rafael Souza",  position: "Goleiro",  age: 22, city: "Recife, PE",   photo: "", stats: [62, 68, 40, 80, 76] },
  { name: "Matheus Lima",  position: "Volante",  age: 20, city: "Goiânia, GO",  photo: "", stats: [70, 82, 60, 84, 78] },
  { name: "Diego Ferreira",position: "Zagueiro", age: 24, city: "Porto Alegre, RS", photo: "", stats: [66, 64, 48, 88, 70] },
  { name: "João Pedro",    position: "Meia",     age: 18, city: "Belo Horizonte, MG", photo: "", stats: [78, 86, 72, 64, 88] },
  { name: "Caio Martins",  position: "Lateral",  age: 21, city: "Salvador, BA", photo: "", stats: [86, 76, 58, 74, 70] },
  { name: "Vinícius Rocha",position: "Atacante", age: 23, city: "Curitiba, PR", photo: "", stats: [84, 68, 82, 76, 72] },
  { name: "Bruno Alves",   position: "Zagueiro", age: 19, city: "Fortaleza, CE", photo: "", stats: [64, 62, 46, 86, 66] },
];

const grid = document.querySelector("[data-players]");
const filters = document.querySelector("[data-filters]");

const initials = (name) => name.split(" ").map((p) => p[0]).slice(0, 2).join("");
const escapeHTML = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Ficha de scout: radar de 5 atributos (0 a 100), no estilo dos callouts */
const SCOUT_AXES = ["VEL", "PAS", "FIN", "FÍS", "VIS"];
function scoutSVG(values) {
  const R = 40, pt = (i, r) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / SCOUT_AXES.length;
    return [50 + Math.cos(a) * r, 50 + Math.sin(a) * r];
  };
  const poly = (r) => SCOUT_AXES.map((_, i) => pt(i, typeof r === "number" ? r : (r[i] / 100) * R).map((n) => n.toFixed(1)).join(",")).join(" ");
  const rings = [0.33, 0.66, 1].map((k) => `<polygon class="scout__ring" points="${poly(R * k)}"/>`).join("");
  const axes = SCOUT_AXES.map((_, i) => { const [x, y] = pt(i, R); return `<line class="scout__axis" x1="50" y1="50" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}"/>`; }).join("");
  const dots = values.map((v, i) => { const [x, y] = pt(i, (v / 100) * R); return `<rect class="scout__pt" x="${(x - 1.6).toFixed(1)}" y="${(y - 1.6).toFixed(1)}" width="3.2" height="3.2"/>`; }).join("");
  const labels = SCOUT_AXES.map((l, i) => {
    const [x, y] = pt(i, R + 9);
    return `<text class="scout__lbl" x="${x.toFixed(1)}" y="${(y + 3).toFixed(1)}" text-anchor="middle">${l} <tspan class="scout__val">${values[i]}</tspan></text>`;
  }).join("");
  return `<span class="scout" aria-hidden="true">
      <svg viewBox="-22 -8 144 114">${rings}${axes}<g class="scout__shape"><polygon points="${poly(values)}" fill="inherit" stroke="inherit"/>${dots}</g>${labels}</svg>
      <span class="scout__tag">Exemplo</span>
    </span>`;
}

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
            ${p.stats ? `<span class="player__hint" aria-hidden="true">Ver ficha</span>${scoutSVG(p.stats)}` : ""}
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

/* ---------- 10. Contratados: carrossel contínuo (passa sozinho, devagar) ----------
   Dados de EXEMPLO (aparece a etiqueta "Exemplo" em cada card).
   Troque pela lista real: nome, posição, clube, datas e foto. */
const HIRED = [
  // fotos em assets/img/atletas/ já vestidas com o uniforme: 01 Clássica (amarela) e 03 Faixa diagonal (azul)
  // look/kit = ilustração de reserva, usada só se a foto faltar
  { name: "Lucas Andrade",  age: 21, position: "Atacante", club: "Clube parceiro", created: "mar/2025", hired: "ago/2025",
    photo: "assets/img/atletas/atleta1.jpg", kit: "classica", look: { skin: "#e0ac69", hair: "#2a1a10", style: "wavy" } },
  { name: "Rafael Souza",   age: 22, position: "Zagueiro", club: "Clube parceiro", created: "jan/2025", hired: "jun/2025",
    photo: "assets/img/atletas/atleta2.jpg", kit: "diagonal", look: { skin: "#8d5524", hair: "#151515", style: "afro" } },
  { name: "Matheus Lima",   age: 20, position: "Volante",  club: "Clube parceiro", created: "nov/2024", hired: "abr/2025",
    photo: "assets/img/atletas/atleta3.jpg", kit: "classica", look: { skin: "#5c3a21", hair: "#101010", style: "buzz" } },
  { name: "Caio Martins",   age: 19, position: "Lateral",  club: "Clube parceiro", created: "mai/2025", hired: "out/2025",
    photo: "assets/img/atletas/atleta4.jpg", kit: "diagonal", look: { skin: "#f1c27d", hair: "#5a3a1e", style: "wavy" } },
  { name: "Diego Ferreira", age: 23, position: "Meia",     club: "Clube parceiro", created: "fev/2025", hired: "set/2025",
    photo: "assets/img/atletas/atleta5.jpg", kit: "classica", look: { skin: "#e0ac69", hair: "#2a1a10", style: "wavy", beard: true } },
];
const HIRED_IS_EXAMPLE = true; // mude pra false quando os dados forem reais

/* Ilustração flat do atleta vestindo o uniforme (sem rosto detalhado, de propósito).
   Uniformes = propostas 01 (Clássica) e 03 (Faixa diagonal) da página /uniformes. */
function athleteSVG(p, uid) {
  const L = p.look || {}, skin = L.skin || "#c68642", hair = L.hair || "#151515";
  const Y = "#ffc515", B = "#122b7e", BD = "#091547";
  const classic = p.kit !== "diagonal";
  const shirt = classic ? Y : B, trim = classic ? B : Y;
  const shade = (hex, k) => { // escurece/clareia a cor (k < 1 escurece)
    const n = parseInt(hex.slice(1), 16), ch = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
    return "#" + [ch(16), ch(8), ch(0)].map((v) => v.toString(16).padStart(2, "0")).join("");
  };
  const skinDark = shade(skin, 0.8);
  const HAIR = {
    fade: `<path d="M110 92 Q108 44 150 40 Q193 44 190 92 Q186 70 172 62 Q150 70 128 62 Q114 70 110 92Z" fill="${hair}"/>
           <path d="M112 92 Q112 80 116 72" stroke="${hair}" stroke-width="3" opacity=".5" fill="none"/>
           <path d="M188 92 Q188 80 184 72" stroke="${hair}" stroke-width="3" opacity=".5" fill="none"/>`,
    buzz: `<path d="M111 94 Q110 46 150 44 Q190 46 189 94 Q184 66 150 62 Q116 66 111 94Z" fill="${hair}" opacity=".88"/>`,
    afro: [[150,54,30],[124,64,20],[176,64,20],[113,84,14],[187,84,14],[137,48,18],[163,48,18]]
            .map(([x,y,r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${hair}"/>`).join(""),
    wavy: `<path d="M108 98 Q104 48 146 40 Q196 38 192 90 Q184 74 174 72 Q166 58 150 64 Q136 56 124 70 Q114 76 108 98Z" fill="${hair}"/>`,
    sidepart: `<path d="M109 96 Q106 46 150 42 Q194 44 191 94 Q188 74 176 66 Q150 58 132 66 Q118 66 109 96Z" fill="${hair}"/>
               <path d="M132 64 Q150 52 180 58" stroke="${shade(hair, 1.4)}" stroke-width="2" fill="none" opacity=".6"/>`,
    twists: Array.from({ length: 11 }, (_, i) => {
              const ang = Math.PI * (1.05 + i * 0.09), x = 150 + Math.cos(ang) * 40, y = 82 + Math.sin(ang) * 44;
              return `<rect x="${(x - 5).toFixed(1)}" y="${(y - 14).toFixed(1)}" width="10" height="26" rx="5" fill="${hair}" transform="rotate(${((ang * 180 / Math.PI) + 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
            }).join("") + `<path d="M112 90 Q112 52 150 48 Q188 52 188 90 Q180 70 150 66 Q120 70 112 90Z" fill="${hair}"/>`,
  };
  const beard = L.beard ? `<path d="M114 106 Q118 148 150 150 Q182 148 186 106 Q178 132 150 134 Q122 132 114 106Z" fill="${hair}" opacity=".35"/>` : "";
  const sash = classic ? "" : `<polygon points="60,160 112,160 250,255 190,255" fill="${Y}"/>`;
  const piping = classic ? `<path d="M62 182 Q44 214 34 255 M238 182 Q256 214 266 255" stroke="${B}" stroke-width="7" fill="none"/>` : "";
  return `<svg class="hcard__art" viewBox="0 0 300 255" aria-hidden="true" preserveAspectRatio="xMidYMax slice">
    <defs>
      <clipPath id="bust-${uid}"><path d="M14 255 C24 196 76 172 150 170 C224 172 276 196 286 255Z"/></clipPath>
      <linearGradient id="fold-${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#000" stop-opacity=".25"/><stop offset=".35" stop-color="#fff" stop-opacity=".08"/>
        <stop offset=".65" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/>
      </linearGradient>
    </defs>
    <g transform="translate(150 255) scale(1.14) translate(-150 -255)">
    <!-- pescoço -->
    <path d="M128 118 L128 176 Q150 188 172 176 L172 118Z" fill="${skinDark}"/>
    <!-- camisa -->
    <g clip-path="url(#bust-${uid})">
      <rect width="300" height="255" fill="${shirt}"/>
      ${sash}${piping}
      <rect width="300" height="255" fill="url(#fold-${uid})"/>
    </g>
    <!-- gola -->
    <path d="M122 170 Q150 196 178 170" stroke="${trim}" stroke-width="10" fill="none" stroke-linecap="round"/>
    <!-- escudo no peito (lado esquerdo de quem veste) -->
    <image href="assets/img/escudo.png" x="184" y="196" width="34" height="35"/>
    <!-- cabeça -->
    <ellipse cx="110" cy="102" rx="7" ry="11" fill="${skinDark}"/>
    <ellipse cx="190" cy="102" rx="7" ry="11" fill="${skinDark}"/>
    <ellipse cx="150" cy="96" rx="40" ry="50" fill="${skin}"/>
    <path d="M150 146 Q126 144 116 120 Q128 140 150 141 Q172 140 184 120 Q174 144 150 146Z" fill="${skinDark}" opacity=".5"/>
    ${beard}
    ${HAIR[L.style] || HAIR.buzz}
    </g>
  </svg>`;
}

(() => {
  const root = document.querySelector("[data-hcarousel]");
  const stage = root?.querySelector("[data-hcarousel-stage]");
  if (!root || !stage) return;

  stage.innerHTML = HIRED.map((p, i) => `
    <li class="hcard" role="group" aria-roledescription="slide" aria-label="${i + 1} de ${HIRED.length}">
      <div class="hcard__photo">
        ${p.photo
          ? `<img src="${escapeHTML(p.photo)}" alt="${escapeHTML(p.name)}" loading="lazy" draggable="false">`
          : athleteSVG(p, i)}
        <span class="badge">${escapeHTML(p.position)}</span>
        ${HIRED_IS_EXAMPLE ? `<span class="hcard__tag">Exemplo</span>` : ""}
      </div>
      <div class="hcard__body">
        <h3 class="hcard__name">${escapeHTML(p.name)}</h3>
        <p class="hcard__club">${p.age ? p.age + " anos, contratado" : "Contratado"} pelo <strong>${escapeHTML(p.club)}</strong></p>
        <ol class="hcard__timeline">
          <li><span>Perfil criado</span><b>${escapeHTML(p.created)}</b></li>
          <li><span>Contratado</span><b>${escapeHTML(p.hired)}</b></li>
        </ol>
      </div>
    </li>`).join("");

  const cards = [...stage.children];
  const n = cards.length;

  // Carrossel contínuo: "pos" anda sem parar (em cards). O card mais perto do
  // centro cresce e fica opaco; os outros diminuem e ficam transparentes.
  const SPEED = 1 / 4.5;      // cards por segundo (um card a cada ~4,5s)
  const SLOW = 0.25;          // fração da velocidade com o mouse em cima
  const GAP = 1.04;           // distância entre cards (em larguras de card): > 1 = nunca se encostam
  let pos = 0, speedK = 1, targetK = 1, drag = 0, last = performance.now();
  let visible = false, raf = 0;

  // distância circular até o centro (depois do último vem o primeiro)
  const dist = (i, p) => { let d = i - p; d -= Math.round(d / n) * n; return d; };

  function render() {
    const w = cards[0].offsetWidth;
    const p = pos - drag;
    cards.forEach((card, i) => {
      const d = dist(i, p);
      const ad = Math.abs(d);
      const k = Math.min(ad, 1);
      card.style.setProperty("--x", `${d * w * GAP}px`);
      card.style.setProperty("--s", (1 - k * 0.14).toFixed(3));
      card.style.setProperty("--o", ad >= 1.7 ? "0" : Math.max(0, 1 - k * 0.72 - Math.max(0, ad - 1) * 0.4).toFixed(3));
      card.style.zIndex = String(100 - Math.round(ad * 10));
      const active = ad < 0.5;
      card.classList.toggle("is-active", active);
      card.setAttribute("aria-hidden", String(!active));
    });
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    speedK += (targetK - speedK) * 0.06;          // desacelera/acelera suave
    if (!dragging) pos = (pos + SPEED * speedK * dt) % n;
    render();
    if (visible) raf = requestAnimationFrame(frame);
  }
  const start = () => {
    if (reduceMotion || visible) return;
    visible = true; last = performance.now(); raf = requestAnimationFrame(frame);
  };
  const stop = () => { visible = false; cancelAnimationFrame(raf); };

  function fitHeight() {
    stage.style.setProperty("--stage-h", `${Math.max(...cards.map((c) => c.offsetHeight))}px`);
    render();
  }

  // mouse em cima: passa bem devagar (dá pra ler)
  root.addEventListener("mouseenter", () => { targetK = SLOW; });
  root.addEventListener("mouseleave", () => { targetK = 1; });

  // arrastar (dedo ou mouse)
  let startX = 0, dragging = false;
  stage.addEventListener("pointerdown", (e) => { dragging = true; startX = e.clientX; drag = 0; });
  addEventListener("pointermove", (e) => {
    if (!dragging) return;
    drag = (e.clientX - startX) / cards[0].offsetWidth / GAP;
    if (reduceMotion) render();
  });
  addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    pos = ((pos - drag) % n + n) % n;
    drag = 0;
    if (reduceMotion) { pos = Math.round(pos) % n; render(); }
  });

  // só anima com a seção na tela e a aba visível
  new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? start() : stop())).observe(root);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
  new ResizeObserver(fitHeight).observe(cards[0]);
  document.fonts?.ready.then(fitHeight);
  fitHeight();
})();

/* ---------- 11. Clubes: pinos caem no campo quando a seção aparece ---------- */
document.querySelectorAll("[data-pitch]").forEach((pitch) => {
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    pitch.classList.add("is-in");
    obs.disconnect();
  }, { threshold: 0.35 }).observe(pitch);
});

/* ---------- 12. Busca do hero: sugestões enquanto digita ----------
   Posições levam pra categoria real; cidades e nomes (dos dados de exemplo)
   viram termo de busca. Teclado: setas, Enter e Esc. */
(() => {
  const form = document.querySelector("[data-hsearch]");
  if (!form) return;
  const input = form.querySelector("[data-hsearch-input]");
  const list = form.querySelector("[data-hsearch-list]");
  const cat = form.querySelector("[data-hsearch-cat]");
  const POS = [
    { label: "Goleiros", id: 54 }, { label: "Zagueiros", id: 59 }, { label: "Laterais", id: 55 },
    { label: "Volantes", id: 58 }, { label: "Meias", id: 57 }, { label: "Atacantes", id: 52 },
  ];
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const cities = [...new Set(PLAYERS.map((p) => p.city))];
  let items = [], active = -1;

  const mark = (text, q) => {
    const i = norm(text).indexOf(norm(q));
    if (!q || i < 0) return escapeHTML(text);
    return escapeHTML(text.slice(0, i)) + "<mark>" + escapeHTML(text.slice(i, i + q.length)) + "</mark>" + escapeHTML(text.slice(i + q.length));
  };

  function open(show) {
    list.hidden = !show;
    input.setAttribute("aria-expanded", String(show));
  }

  function build() {
    const q = input.value.trim();
    const nq = norm(q);
    const match = (s) => !nq || norm(s).includes(nq);
    items = [
      ...POS.filter((p) => match(p.label)).map((p) => ({ type: "Posição", label: p.label, cat: p.id })),
      ...(nq ? cities.filter(match).map((c) => ({ type: "Cidade", label: c, s: c.split(",")[0] })) : []),
      ...(nq.length > 1 ? PLAYERS.filter((p) => match(p.name)).map((p) => ({ type: "Atleta", label: p.name, s: p.name })) : []),
    ].slice(0, 7);
    active = -1;
    list.innerHTML = items.map((it, i) =>
      `<li role="option" id="hs-opt-${i}" aria-selected="false" data-i="${i}"><span class="hsearch__label">${mark(it.label, q)}</span><span class="hsearch__type">${it.type}</span></li>`
    ).join("");
    open(items.length > 0);
  }

  function setActive(i) {
    active = (i + items.length) % items.length;
    [...list.children].forEach((li, k) => li.setAttribute("aria-selected", String(k === active)));
    input.setAttribute("aria-activedescendant", `hs-opt-${active}`);
  }

  function choose(it) {
    if (it.cat) { cat.value = it.cat; input.value = ""; }
    else { cat.value = ""; input.value = it.s; }
    open(false);
    form.submit();
  }

  input.addEventListener("focus", build);
  input.addEventListener("input", () => { cat.value = ""; build(); });
  input.addEventListener("keydown", (e) => {
    if (list.hidden || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(active + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive(active - 1); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(items[active]); }
    else if (e.key === "Escape") { e.stopPropagation(); open(false); }
  });
  list.addEventListener("mousedown", (e) => {
    const li = e.target.closest("li");
    if (li) { e.preventDefault(); choose(items[Number(li.dataset.i)]); }
  });
  document.addEventListener("click", (e) => { if (!form.contains(e.target)) open(false); });

  // placeholder "digitando" exemplos de busca (só com o campo vazio e sem foco)
  const EXAMPLES = ["Atacante em Campinas", "Goleiro, 22 anos", "Volante em Goiânia", "Lateral rápido"];
  if (!reduceMotion) {
    let ex = 0, ch = 0, dir = 1, wait = 0;
    setInterval(() => {
      if (document.activeElement === input || input.value) return;
      if (wait > 0) { wait--; return; }
      const word = EXAMPLES[ex];
      ch += dir;
      input.placeholder = word.slice(0, ch) + (ch < word.length || dir < 0 ? "|" : "");
      if (dir > 0 && ch >= word.length) { dir = -1; wait = 22; }
      else if (dir < 0 && ch <= 0) { dir = 1; ex = (ex + 1) % EXAMPLES.length; wait = 4; }
    }, 70);
  }
})();

/* Ano no footer */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
