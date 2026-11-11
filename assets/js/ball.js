/* ==========================================================================
   FUTFÁCIL: bola 3D da seção "O perfil do jogador"

   - Three.js carregado só quando a seção chega perto da tela.
   - Usa as 6 fotos reais da bola (assets/img/bola-vistas.jpg). Enquanto a
     imagem carrega, ou se ela falhar, aparece a bola desenhada:
   - O desenho dos gomos é calculado no shader: cada ponto da esfera olha qual
     é o "centro de gomo" mais próximo (12 pentágonos + 20 hexágonos, como uma
     bola de futebol de verdade). Fica nítido em qualquer tamanho de tela.
   - Gira devagar, inclina seguindo o mouse e ganha giro com a rolagem.
   - "Reduzir movimento": desenha uma vez e fica parada.
   - Sem WebGL: o canvas some e a seção continua funcionando.
   ========================================================================== */
(() => {
  const canvas = document.querySelector("[data-ball]");
  if (!canvas) return;

  const THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  const COLORS = {
    panel: [0.95, 0.96, 0.98],   // gomos brancos
    pent:  [0.055, 0.13, 0.40],  // pentágonos azul da marca (#0e2165)
    seam:  [1.0, 0.773, 0.082],  // costuras amarelas (#ffc515)
  };
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function loadThree() {
    if (window.THREE) return Promise.resolve();
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = THREE_URL;
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  // Centros dos gomos: vértices do icosaedro (pentágonos) + centros das faces (hexágonos)
  function panelCenters() {
    const p = (1 + Math.sqrt(5)) / 2;
    const v = [
      [-1, p, 0], [1, p, 0], [-1, -p, 0], [1, -p, 0],
      [0, -1, p], [0, 1, p], [0, -1, -p], [0, 1, -p],
      [p, 0, -1], [p, 0, 1], [-p, 0, -1], [-p, 0, 1],
    ];
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const faces = [];
    for (let i = 0; i < 12; i++)
      for (let j = i + 1; j < 12; j++)
        for (let k = j + 1; k < 12; k++)
          if ([d2(v[i], v[j]), d2(v[j], v[k]), d2(v[i], v[k])].every((d) => Math.abs(d - 4) < 1e-6))
            faces.push([0, 1, 2].map((n) => v[i][n] + v[j][n] + v[k][n]));
    const norm = (a) => { const l = Math.hypot(...a); return a.map((x) => x / l); };
    return [...v.map(norm), ...faces.map(norm)]; // 12 + 20 = 32
  }

  const vertexShader = `
    varying vec3 vObj;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vPosV;
    void main() {
      vObj = normalize(position);
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vView = normalize(-mv.xyz);
      vPosV = mv.xyz;
      gl_Position = projectionMatrix * mv;
    }
  `;

  const fragmentShader = `
    uniform vec3 uCenters[32];
    uniform vec3 uPanel;
    uniform vec3 uPent;
    uniform vec3 uSeam;
    varying vec3 vObj;
    varying vec3 vNormal;
    varying vec3 vView;
    void main() {
      // gomo mais próximo e o segundo mais próximo
      float best = -2.0, second = -2.0; int idx = 0;
      for (int i = 0; i < 32; i++) {
        float d = dot(vObj, uCenters[i]);
        if (d > best) { second = best; best = d; idx = i; }
        else if (d > second) { second = d; }
      }
      float edge = best - second;                 // 0 na costura
      vec3 base = idx < 12 ? uPent : uPanel;
      float seamW = 0.011;
      float seam = 1.0 - smoothstep(seamW * 0.6, seamW, edge);
      // gomo levemente "estufado": escurece perto da costura
      float puff = mix(0.78, 1.0, smoothstep(0.0, 0.09, edge));
      vec3 col = mix(base * puff, uSeam, seam);

      // luz: principal de cima/esquerda + preenchimento + brilho especular discreto
      vec3 N = normalize(vNormal);
      vec3 L = normalize(vec3(-0.45, 0.75, 0.6));
      float diff = max(dot(N, L), 0.0);
      float fill = max(dot(N, normalize(vec3(0.6, -0.2, 0.5))), 0.0) * 0.25;
      vec3 H = normalize(L + vView);
      float spec = pow(max(dot(N, H), 0.0), 48.0) * 0.35 * (1.0 - seam);
      vec3 lit = col * (0.45 + diff * 0.65 + fill) + spec;
      gl_FragColor = vec4(lit, 1.0);
    }
  `;


  /* ---------- Bola com as fotos reais (6 vistas) ----------
     A imagem assets/img/bola-vistas.jpg tem as vistas lado a lado. Para cada
     vista: posição do círculo da bola na imagem (cx, cy, raio, em pixels) e
     de que lado ela foi fotografada (dir) com o "cima" da foto (up).
     Cada ponto da esfera pega a cor da foto que estava mais de frente pra ele;
     nas transições as fotos se misturam. A parte de baixo usa o topo espelhado. */
  const PHOTO = {
    src: "assets/img/bola-vistas.jpg",
    size: [1536, 1024],
    detail: 1,     // relevo do couro (poros + grão): 0 desliga, 1 completo
    sharpness: 30, // maior = transição mais curta entre uma foto e outra (evita costura duplicada)
    views: [
      { name: "frente",          cx: 291.6,  cy: 233.5, r: 216.5, dir: [0, 0, 1],  up: [0, 1, 0] },
      { name: "frontal-direita", cx: 787.5,  cy: 224.9, r: 204.9, dir: [1, 0, 1],  up: [0, 1, 0], weight: 0 },
      { name: "lado-direito",    cx: 1270.8, cy: 225.8, r: 209.8, dir: [1, 0, 0],  up: [0, 1, 0] },
      { name: "traseira",        cx: 280.8,  cy: 731.1, r: 217.1, dir: [0, 0, -1], up: [0, 1, 0] },
      { name: "lado-esquerdo",   cx: 786.6,  cy: 728.7, r: 213.7, dir: [-1, 0, 0], up: [0, 1, 0] },
      { name: "topo",            cx: 1271.7, cy: 728.9, r: 205.9, dir: [0, 1, 0],  up: [0, 0, -1] },
      { name: "baixo (topo espelhado)", cx: 1271.7, cy: 728.9, r: 205.9, dir: [0, -1, 0], up: [0, 0, 1], weight: .6 },
    ],
  };

  const photoFragment = `
    uniform sampler2D uTex;
    uniform vec3 uDir[7];
    uniform vec3 uUp[7];
    uniform vec4 uCirc[7];   // cx, cy, raio x, raio y (em coordenadas de textura)
    uniform float uWeight[7];
    uniform float uSharp;
    uniform float uDetail;   // 0 = sem relevo, 1 = relevo completo
    varying vec3 vObj;
    varying vec3 vNormal;
    varying vec3 vView;
    varying vec3 vPosV;

    // ---------- ruídos pro relevo do couro ----------
    vec3 hash3(vec3 p) {
      p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
      return fract(sin(p) * 43758.5453);
    }
    // distância ao "centro de célula" mais próximo (Worley): vira poros e grãos
    vec2 worley(vec3 p) {
      vec3 i = floor(p), fr = fract(p);
      float d = 8.0; float id = 0.0;
      for (int x = -1; x <= 1; x++)
      for (int y = -1; y <= 1; y++)
      for (int z = -1; z <= 1; z++) {
        vec3 g = vec3(float(x), float(y), float(z));
        vec3 o = hash3(i + g);
        vec3 r = g + o - fr;
        float dd = dot(r, r);
        if (dd < d) { d = dd; id = o.x; }
      }
      return vec2(sqrt(d), id);
    }
    // relevo: grão de couro (alto) + poros (buracos), com quanto de poro tem no ponto
    float leather(vec3 p, out float pore) {
      vec2 g = worley(p * 46.0);                           // grão "pedrinha" do couro sintético
      float pebble = 1.0 - smoothstep(0.0, 0.75, g.x);
      vec2 w = worley(p * 78.0 + 7.3);                     // poros: nem toda célula tem
      float r = mix(0.2, 0.32, fract(w.y * 13.7));
      float t = clamp(w.x / r, 0.0, 1.0);
      pore = (1.0 - t * t * (3.0 - 2.0 * t)) * step(0.55, w.y); // borda bem suave (covinha, não furo)
      pore *= pore;
      return pebble * 0.55 - pore * 0.6;
    }
    // normal perturbada a partir da altura (bump mapping por derivadas de tela)
    vec3 bumpNormal(vec3 N, vec3 pos, float h, float scale) {
      vec3 dpdx = dFdx(pos), dpdy = dFdy(pos);
      float dhdx = dFdx(h), dhdy = dFdy(h);
      vec3 r1 = cross(dpdy, N), r2 = cross(N, dpdx);
      float det = dot(dpdx, r1);
      vec3 grad = sign(det) * (dhdx * r1 + dhdy * r2);
      return normalize(abs(det) * N - grad * scale);
    }

    void main() {
      vec3 n = normalize(vObj);
      // 1º passo: qual foto está mais de frente pra este ponto
      float cmax = -1.0;
      for (int i = 0; i < 7; i++) {
        if (uWeight[i] > 0.0) cmax = max(cmax, dot(n, uDir[i]));
      }
      // 2º passo: mistura com peso relativo a essa foto (a melhor sempre pesa 1, nunca escurece)
      vec3 acc = vec3(0.0);
      float wsum = 0.0;
      for (int i = 0; i < 7; i++) {
        float c = dot(n, uDir[i]);
        if (c <= 0.0 || uWeight[i] <= 0.0) continue;
        vec3 right = normalize(cross(uUp[i], uDir[i]));
        vec2 p = vec2(dot(n, right), dot(n, uUp[i])) * 0.985; // fica longe da borda da foto
        vec2 uv = uCirc[i].xy + p * uCirc[i].zw;
        float w = exp(uSharp * (c - cmax)) * uWeight[i];
        acc += texture2D(uTex, uv).rgb * w;
        wsum += w;
      }
      vec3 col = acc / max(wsum, 1e-4);

      // ---- iluminação (dá volume; a bola não parece um adesivo 2D) ----
      // as fotos já vêm claras: baixa um pouco o branco pra não estourar
      col = pow(col, vec3(1.15)) * 0.9;

      vec3 N = normalize(vNormal);
      vec3 V = normalize(vView);

      // ---- relevo: poros + grão do couro ----
      // some aos poucos quando o detalhe fica menor que ~1 pixel (evita tremeluzir)
      float fw = length(fwidth(vObj)) * 78.0;
      float detail = uDetail * (1.0 - smoothstep(0.35, 0.9, fw));
      float pore = 0.0;
      float h = leather(n, pore) * detail;
      pore *= detail;
      N = bumpNormal(N, vPosV, h, 0.0035);
      col *= 1.0 - pore * 0.12;                          // sombrinha leve dentro do poro

      vec3 L = normalize(vec3(-0.5, 0.8, 0.55));      // refletor do estádio: cima/esquerda
      float ndl = dot(N, L);
      float key = clamp(ndl * 0.6 + 0.4, 0.0, 1.0);     // luz "enrolada": o lado escuro não fica preto
      key = key * key;
      float fill = max(dot(N, normalize(vec3(0.7, -0.15, 0.6))), 0.0) * 0.18; // rebatida fria da direita
      float bounce = max(-N.y, 0.0) * 0.14;            // luz azul que sobe do gramado
      float ao = mix(0.55, 1.0, smoothstep(-0.95, 0.1, N.y)); // escurece embaixo, perto do chão

      vec3 lightCol = vec3(1.0, 0.98, 0.94) * (0.28 + key * 0.95) + vec3(0.75, 0.85, 1.0) * fill;
      vec3 lit = col * lightCol * ao + col * vec3(0.3, 0.45, 1.0) * bounce;

      // brilho do couro: um reflexo largo e suave + um ponto mais forte
      vec3 H = normalize(L + V);
      float ndh = max(dot(N, H), 0.0);
      float glossy = 1.0 - pore * 0.6;                   // poro reflete menos
      lit += vec3(1.0) * (pow(ndh, 18.0) * 0.12 + pow(ndh, 120.0) * 0.45) * glossy;

      // verniz: segunda camada de reflexo, nítida, mais forte nas bordas (Fresnel)
      vec3 Ns = normalize(vNormal);                      // o verniz é liso, ignora os poros
      float ndhC = max(dot(Ns, H), 0.0);
      float fresC = 0.04 + 0.96 * pow(1.0 - max(dot(Ns, V), 0.0), 5.0);
      lit += vec3(1.0) * pow(ndhC, 260.0) * 0.55 * glossy;
      // reflexo do refletor secundário (direita/cima) correndo pela borda
      vec3 L2 = normalize(vec3(0.75, 0.45, 0.3));
      lit += vec3(0.85, 0.9, 1.0) * pow(max(dot(Ns, normalize(L2 + V)), 0.0), 90.0) * 0.18 * glossy;
      lit += vec3(0.7, 0.8, 1.0) * fresC * 0.22;

      // contraluz fina na borda (separa a bola do fundo escuro)
      float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
      float back = smoothstep(-0.2, 0.6, dot(N, normalize(vec3(0.6, 0.5, -0.4))));
      lit += vec3(0.85, 0.92, 1.0) * fres * back * 0.35;

      // escurece a borda que não recebe luz
      lit *= mix(0.72, 1.0, smoothstep(0.0, 0.45, dot(N, V)) );
      gl_FragColor = vec4(lit / (1.0 + lit * 0.12), 1.0); // compressão suave: nada estoura em branco chapado
    }
  `;

  function makePhotoMaterial(texture) {
    const [W, H] = PHOTO.size;
    const norm = (a) => { const l = Math.hypot(...a); return new THREE.Vector3(a[0] / l, a[1] / l, a[2] / l); };
    const views = PHOTO.views;
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: photoFragment,
      extensions: { derivatives: true }, // dFdx/fwidth no WebGL1
      uniforms: {
        uTex: { value: texture },
        uDir: { value: views.map((v) => norm(v.dir)) },
        uUp: { value: views.map((v) => norm(v.up)) },
        // textura com flipY: o eixo y da imagem fica invertido
        uCirc: { value: views.map((v) => new THREE.Vector4(v.cx / W, 1 - v.cy / H, v.r / W, v.r / H)) },
        uWeight: { value: views.map((v) => v.weight ?? 1) },
        uSharp: { value: PHOTO.sharpness },
        uDetail: { value: PHOTO.detail ?? 1 },
      },
    });
  }

  function start() {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
      canvas.style.display = "none";
      return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
    camera.position.set(0, 0, 4.1);

    const uniforms = {
      uCenters: { value: panelCenters().map((c) => new THREE.Vector3(...c)) },
      uPanel: { value: new THREE.Vector3(...COLORS.panel) },
      uPent: { value: new THREE.Vector3(...COLORS.pent) },
      uSeam: { value: new THREE.Vector3(...COLORS.seam) },
    };
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(1, 96, 96),
      new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
    );
    ball.rotation.set(0.25, 0.4, 0);
    scene.add(ball);

    // troca pela bola com as fotos assim que a imagem carregar
    // (a bola desenhada fica como reserva se a imagem falhar)
    new THREE.TextureLoader().load(PHOTO.src, (tex) => {
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      // sem mipmaps: evita o borrado onde uma foto encontra a outra
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if ("encoding" in tex) tex.encoding = THREE.sRGBEncoding;
      ball.material.dispose();
      ball.material = makePhotoMaterial(tex);
      renderer.render(scene, camera);
    });

    function resize() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera); // setSize apaga o canvas: redesenha na hora (importa com a bola parada)
    }
    resize();
    new ResizeObserver(resize).observe(canvas);

    // conferência: ?bolarot=0.3,1.2 trava a bola nessa rotação (x,y em radianos)
    const debugRot = new URLSearchParams(location.search).get("bolarot");
    if (debugRot) {
      const [rx, ry] = debugRot.split(",").map(Number);
      ball.rotation.set(rx || 0, ry || 0, 0);
      ball.userData.frozen = true;
    }
    if (reduceMotion || ball.userData.frozen) { renderer.render(scene, camera); return; }

    // inclinação seguindo o mouse (suavizada) + giro extra com a rolagem
    const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
    addEventListener("pointermove", (e) => {
      tilt.tx = (e.clientY / innerHeight - 0.5) * 0.5;
      tilt.ty = (e.clientX / innerWidth - 0.5) * 0.7;
    }, { passive: true });

    let lastScroll = scrollY, scrollSpin = 0, kick = 0;
    // passo com o mouse em cima: a bola gira um pouco na direção dele
    addEventListener("ball:kick", (e) => { kick += 0.07 * (e.detail || 1); });
    let visible = false, last = performance.now(), spin = 0;

    function frame(now) {
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const ds = scrollY - lastScroll;
      lastScroll = scrollY;
      scrollSpin += ds * 0.004;
      scrollSpin *= 0.92;                       // a rolagem dá um empurrão que vai parando

      spin += dt * 0.35 + scrollSpin * 0.2 + kick; // giro contínuo devagar
      kick *= 0.9;
      tilt.x += (tilt.tx - tilt.x) * 0.06;
      tilt.y += (tilt.ty - tilt.y) * 0.06;

      ball.rotation.x = 0.25 + tilt.x + scrollSpin * 0.5;
      ball.rotation.y = 0.4 + spin + tilt.y;
      renderer.render(scene, camera);
      requestAnimationFrame(frame);
    }

    // só anima enquanto a seção está na tela
    new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) { last = performance.now(); lastScroll = scrollY; requestAnimationFrame(frame); }
    }, { rootMargin: "100px" }).observe(canvas);
    renderer.render(scene, camera);
  }

  // carrega o Three.js quando a seção estiver a ~1 tela de distância
  const lazy = new IntersectionObserver((entries, obs) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    obs.disconnect();
    loadThree().then(start).catch(() => { canvas.style.display = "none"; });
  }, { rootMargin: "800px 0px" });
  lazy.observe(canvas);
})();

/* ==========================================================================
   Linhas ligando cada passo à bola (estilo "Sci-Fi Callout": dobra com mira e alvo quadrado)
   - Calculadas com a posição real dos textos e da bola; recalculam ao redimensionar.
   - Mouse ou foco num passo: a linha dele se desenha em amarelo, o anel pulsa
     e a bola dá um giro na direção do passo (evento "ball:kick").
   - Só no desktop (no celular os passos ficam empilhados embaixo da bola).
   ========================================================================== */
(() => {
  const stage = document.querySelector("[data-ball-stage]");
  const svg = stage?.querySelector("[data-ball-links]");
  const canvas = stage?.querySelector("[data-ball]");
  if (!svg || !canvas) return;

  const NS = "http://www.w3.org/2000/svg";
  const feats = [...stage.querySelectorAll(".feat")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = matchMedia("(min-width: 960px)");
  let links = [];
  let active = -1;

  const make = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    parent?.appendChild(n);
    return n;
  };

  function build() {
    svg.replaceChildren();
    links = [];
    if (!desktop.matches) return;

    const S = stage.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${S.width} ${S.height}`);
    const C = canvas.getBoundingClientRect();
    const cx = C.left + C.width / 2 - S.left;
    const cy = C.top + C.height / 2 - S.top;
    const R = (C.height / 2) * 0.93; // raio da bola na tela (câmera com fov 30 a 4.1 de distância)

    feats.forEach((f, i) => {
      const title = f.querySelector("h3").getBoundingClientRect();
      const icon = f.querySelector(".feat__icon").getBoundingClientRect();
      // fim real do texto (a caixa do parágrafo é mais larga que as linhas escritas)
      const textRight = Math.max(...[...f.querySelectorAll("h3, p")].map((n) => {
        const r = document.createRange(); r.selectNodeContents(n);
        return Math.max(...[...r.getClientRects()].map((q) => q.right));
      }));
      const isLeft = icon.left + 20 < C.left + C.width / 2;

      // começa no fim do texto (esquerda) ou antes do ícone (direita), na altura do título
      const y0 = title.top + title.height / 2 - S.top;
      const x0 = isLeft ? textRight - S.left + 22 : icon.left - S.left - 22;
      // callout sci-fi em "V": desce até a dobra (mira) e sobe até o alvo na borda da bola.
      // Cada linha usa a altura do próprio passo, então as dobras nunca se encontram.
      const Rt = R + 10;                                           // alvo encostado na borda
      const ey = Math.min(cy + Rt * 0.85, Math.max(cy - Rt * 0.85, y0 + 16));
      const ex = cx + (isLeft ? -1 : 1) * Math.sqrt(Rt * Rt - (ey - cy) ** 2);
      const kx = x0 + (ex - x0) * 0.5;
      const ky = Math.max(y0, ey) + 30;                            // a dobra fica abaixo dos dois pontas
      const dPath = `M ${x0} ${y0} L ${kx} ${ky} L ${ex} ${ey}`;

      const g = make("g", { class: "link" }, svg);
      const base = make("path", { class: "link__base", d: dPath, id: `ball-link-${i}` }, g);
      // a linha amarela já nasce "apagada" (sem animar), senão pisca acesa a cada recálculo
      const act = make("path", { class: "link__active", d: dPath });
      act.style.setProperty("--len", Math.ceil(base.getTotalLength()) + 1);
      act.style.transition = "none";
      g.appendChild(act);
      requestAnimationFrame(() => requestAnimationFrame(() => { act.style.transition = ""; }));

      // início: quadradinho cheio
      make("rect", { class: "link__node", x: x0 - 2.5, y: y0 - 2.5, width: 5, height: 5 }, g);

      // dobra: quadrado cheio + 4 cantoneiras em L em volta (a "mira")
      make("rect", { class: "link__joint", x: kx - 3.5, y: ky - 3.5, width: 7, height: 7 }, g);
      const ret = make("g", { class: "link__reticle" }, g);
      const o = 9, arm = 4; // distância das cantoneiras e tamanho do braço
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
        const px = kx + sx * o, py = ky + sy * o;
        make("path", { d: `M ${px} ${py - sy * arm} L ${px} ${py} L ${px - sx * arm} ${py}` }, ret);
      });

      // fim: alvo "selecionado" (quadrado vazado com quadrado cheio dentro)
      make("rect", { class: "link__pulse", x: ex - 7, y: ey - 7, width: 14, height: 14 }, g);
      make("rect", { class: "link__target", x: ex - 7, y: ey - 7, width: 14, height: 14 }, g);
      make("rect", { class: "link__core", x: ex - 2.5, y: ey - 2.5, width: 5, height: 5 }, g);

      // pulso de luz correndo do passo até a bola (um de cada vez)
      if (!reduce) {
        const dot = make("rect", { class: "link__dot", x: -2, y: -2, width: 4, height: 4, opacity: 0 }, g); // começa invisível
        const timing = { dur: "3.6s", begin: `${i * 1.2}s`, repeatCount: "indefinite" };
        const motion = make("animateMotion", { ...timing, calcMode: "spline", keyPoints: "0;1", keyTimes: "0;1", keySplines: ".45 0 .55 1" }, dot);
        const mp = make("mpath", {}, motion);
        mp.setAttribute("href", `#ball-link-${i}`);
        mp.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#ball-link-${i}`);
        make("animate", { ...timing, attributeName: "opacity", values: "0;1;1;0", keyTimes: "0;.12;.82;1" }, dot);
      }
      links.push({ g, isLeft });
    });
    if (active >= 0) setActive(active, true);
  }

  function setActive(i, on) {
    feats.forEach((f, k) => f.classList.toggle("is-on", on && k === i));
    links.forEach((l, k) => l.g.classList.toggle("is-on", on && k === i));
    active = on ? i : -1;
  }

  feats.forEach((f, i) => {
    const enter = () => {
      if (active === i) return;
      setActive(i, true);
      // giro curto na direção do passo
      window.dispatchEvent(new CustomEvent("ball:kick", { detail: links[i]?.isLeft === false ? -1 : 1 }));
    };
    const leave = () => setActive(i, false);
    f.addEventListener("mouseenter", enter);
    f.addEventListener("mouseleave", leave);
    f.addEventListener("focusin", enter);
    f.addEventListener("focusout", leave);
  });

  let raf = 0;
  const schedule = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(build); };
  new ResizeObserver(schedule).observe(stage);
  desktop.addEventListener("change", schedule);
  document.fonts?.ready.then(schedule);
  build();
})();

/* ==========================================================================
   Pixels de HUD no fundo da seção (discretos, mas vários)
   - Quadradinhos de 2 a 5px subindo devagar; ~1 em 8 é amarelo; alguns piscam.
   - De vez em quando uma marca de callout: mira "+" ou par de cantoneiras.
   - Só anima com a seção na tela; com "reduzir movimento" fica parado.
   ========================================================================== */
(() => {
  const cv = document.querySelector("[data-pixels]");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const YELLOW = "255, 197, 21", WHITE = "235, 242, 255";
  let W = 0, H = 0, dpr = 1, items = [], visible = false, last = 0;

  const rand = (a, b) => a + Math.random() * (b - a);

  function spawn(y) {
    const r = Math.random();
    const kind = r < 0.78 ? "px" : r < 0.9 ? "plus" : "corner"; // mais marcas de callout
    return {
      kind,
      x: rand(0, W),
      y: y ?? rand(0, H),
      s: kind === "px" ? (Math.random() < 0.7 ? rand(2, 3.5) : rand(3.5, 5)) : rand(9, 14),
      vy: -rand(4, 14),                          // sobe devagar (px/s)
      vx: rand(-2, 2),
      a: kind === "px" ? rand(0.3, 0.75) : rand(0.35, 0.6), // mais evidentes
      color: Math.random() < 0.2 ? YELLOW : WHITE,
      blink: Math.random() < 0.25 ? rand(1.5, 4) : 0, // período da piscada (s)
      phase: rand(0, Math.PI * 2),
    };
  }

  function resize() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(280, Math.max(110, (W * H) / 5500))); // mais pixels, proporcional à área
    items = Array.from({ length: count }, () => spawn());
    draw(0);
  }

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    for (const p of items) {
      let a = p.a;
      if (p.blink) a *= 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * (Math.PI * 2 / p.blink) + p.phase));
      // apaga perto do topo e do fundo da seção pra não "cortar" nas bordas
      a *= Math.min(1, p.y / 80, (H - p.y) / 80);
      if (a <= 0.01) continue;
      const x = Math.round(p.x), y = Math.round(p.y);
      ctx.fillStyle = ctx.strokeStyle = `rgba(${p.color}, ${a})`;
      if (p.kind === "px") {
        ctx.fillRect(x, y, p.s, p.s);
      } else if (p.kind === "plus") {
        const h = Math.round(p.s / 2);
        ctx.fillRect(x - h, y, p.s, 1.5);
        ctx.fillRect(x, y - h, 1.5, p.s);
      } else { // par de cantoneiras (canto sup. esq. e inf. dir.)
        const s = Math.round(p.s), arm = 5;
        ctx.fillRect(x, y, arm, 1.5); ctx.fillRect(x, y, 1.5, arm);
        ctx.fillRect(x + s - arm + 1.5, y + s, arm, 1.5); ctx.fillRect(x + s, y + s - arm + 1.5, 1.5, arm);
      }
    }
  }

  function frame(now) {
    if (!visible) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    for (const p of items) {
      p.y += p.vy * dt;
      p.x += p.vx * dt;
      if (p.y < -10) Object.assign(p, spawn(H + 5));
      if (p.x < -10) p.x = W + 5; else if (p.x > W + 10) p.x = -5;
    }
    draw(now);
    requestAnimationFrame(frame);
  }

  new ResizeObserver(resize).observe(cv);
  if (!reduce) {
    new IntersectionObserver(([e]) => {
      const was = visible;
      visible = e.isIntersecting;
      if (visible && !was) { last = performance.now(); requestAnimationFrame(frame); }
    }).observe(cv);
  }
})();
