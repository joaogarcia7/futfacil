# State: onde estamos

Atualizar ao fim de cada sessão de trabalho.

**Última atualização:** 2026-11-10

## Feito
- [x] Base estática HTML/CSS/JS, sem build
- [x] Design tokens (`assets/css/tokens.css`), fonte Archivo
- [x] Smooth scroll com Lenis (mesma configuração da Pelé Academia)
- [x] Reveal on scroll, marquee, botões (texto que rola)
- [x] Regras do cliente (anti-patterns) e skill frontend-design em `regras/`; código auditado e corrigido
- [x] Home: todas as seções em versão inicial (tema escuro)
- [x] Header no estilo Matchday: dropdowns, mega menu, busca funcional, menu lateral
- [x] Hero de tela inteira (sem card flutuante), troca Jogador/Clube pequena abaixo dos botões
- [x] Paleta amarelo + azul da marca, logo real na header, drawer e footer
- [x] Hero em slides (5s, transição 1,1s, igual à peleacademia.com): Neymar + "Jogador" (`hero-neymar.png`) e CR7 + "Clube ou agente" (`hero-cr7.png`). Pausa com mouse/foco, aba escondida e "reduzir movimento"
- [x] Conteúdo do hero num container centralizado e no meio da tela; eyebrows sem linha
- [x] Marca-texto amarelo com pontas de pincel (`.mark`) na 1ª linha dos títulos: "Seu futebol" (jogador) e "Seu reforço" (clube)
- [x] Tipografia e botões na escala da peleacademia.com; header alinhada ao container
- [x] Bola 3D agora usa as 6 fotos reais (`assets/img/bola-vistas.png`, frente/lados/traseira/topo; baixo = topo espelhado; "frontal direita" desligada por não estar girada 45°). Teste de ângulo: `?bolarot=x,y`
- [x] "Como funciona" agora é a seção da bola (`#como-funciona`, 3 passos em volta da bola); seção antiga removida. Seção com altura da tela (100svh); gramado e fundo azuis escurecendo até as bordas; botão "Quero participar" logo abaixo do passo 2, alinhado aos números; passo 3 mais alto; pixels de HUD flutuando no fundo (canvas, quadradinhos 1-3px, alguns amarelos/piscando, miras "+" e cantoneiras); linhas "Sci-Fi Callout" ligando cada passo à bola (V com dobra em mira de cantoneiras, alvo quadrado selecionado na bola, cantoneiras de HUD nos passos; no hover tudo acende em amarelo, a mira gira 45°, o alvo pulsa e a bola gira na direção do passo); bola com iluminação 3D (luz principal, reflexo, contraluz, sombra embaixo) e relevo de couro no shader: grão, poros, verniz com Fresnel e 2º refletor (`PHOTO.detail` 0 a 1)
- [x] (antes) Seção "O perfil do jogador" com bola 3D (Three.js r128 sob demanda, `assets/js/ball.js`): gomos brancos, pentágonos azuis, costuras amarelas; sem glow; gramado em perspectiva (faixas de corte + linhas brancas) com a bola no círculo central

- [x] Ordem: hero, faixa, Atletas (2ª), Como funciona com bola (3ª). Atletas: prévia de 4 jogadores + "Ver todos" (sem destino ainda) e 3 cards brancos à direita; fundo com Ronaldinho fixo (background-attachment: fixed, troca de seção igual à peleacademia.com #historia). Seção da bola mais larga, bola maior, seção mais alta (125svh) terminando em degradê escuro

- [x] Contratados (`#contratados`): à esquerda título + carrossel contínuo e infinito (passa devagar, ~4,5s por card, sem setas; o do centro cresce, vizinhos transparentes; desacelera com o mouse; arrastar); à direita card escuro "Monte um perfil que contrata" com 3 itens e botões. Dados de EXEMPLO com etiqueta visível (`HIRED`, `HIRED_IS_EXAMPLE` no main.js)

- [x] Planos em azul (`.plans-sec.theme-dark`), 5 planos numa linha no desktop, selo "Mais escolhido" sobre a borda. Contratados e Planos com altura da tela (100svh) e conteúdo centralizado; cards do carrossel sem sobreposição (`GAP` no main.js)

- [x] Clubes (`#clubes`): campo em pé (SVG) com altura travada na do bloco de texto, 22 pinos redondos de tabuleiro: Futfácil amarelo 4-3-3 embaixo x adversário branco 4-4-2 em cima, goleiros com aro; cada pino leva à categoria da posição no site atual, sobe e mostra "Ver zagueiros" etc. no hover; os pinos caem um a um quando a seção aparece. Exceção de forma redonda registrada no ANTI-PATTERNS. Seção com altura da tela e campo limitado à altura disponível

- [x] Linguagem de HUD no resto do site: cantoneiras nos planos e no card "Monte um perfil", plano Semestral como alvo selecionado (mira de 4 cantos), números tabulares
- [x] Ficha de scout: radar de 5 atributos (VEL, PAS, FIN, FÍS, VIS) no hover dos cards de atleta, dados de EXEMPLO (`stats` em PLAYERS)
- [x] Busca no hero (slide Clube): sugestões de posição/cidade/atleta enquanto digita, teclado, placeholder digitando exemplos; envia pra busca real
- [x] Menos eyebrows (saíram Vitrine, Prova real, Dúvidas); links relativos apontando pro site atual
- [x] Fotos grandes em JPEG (5,6 MB → 674 KB no total)
- [x] Ícone da aba (favicon 16/32/192 + apple-touch-icon 180 em fundo branco) a partir de `fotossite/fotoguia.svg` (bola do escudo)
- [x] Botão principal: brilho "shine hover" (CSS puro, valores do componente shadcn); texto do botão não rola mais no hover

- [x] Contratados: 5 fotos reais (fotossite/atleta1-5.png) vestidas com o uniforme (1, 3, 5 = 01 Clássica; 2, 4 = 03 Faixa diagonal) em `assets/img/atletas/`; a ilustração vetorial ficou como reserva. (antes: ilustrações vetoriais dos 6 atletas (19 a 23 anos, aparências variadas) vestindo os uniformes 01 Clássica e 03 Faixa diagonal com o escudo; idade no card; etiqueta "Exemplo" no alto. Função `athleteSVG` no main.js (dados em `look` e `kit`)
- [x] Página de propostas de uniforme em `uniformes/` (10 modelos, frente e costas, download SVG)

## Em andamento / próximo
- [ ] Trocar HIRED pelos contratados reais (foto, nome, posição, clube, datas) e desligar HIRED_IS_EXAMPLE
- [ ] Configurar destino do botão "Ver todos os jogadores"
- [ ] Seções em fundo claro, como na Matchday
- [ ] Carrossel de cards com foto (estilo "The games everyone is talking about")

## Pendências do cliente
- [ ] Fotos dos atletas (atleta1-5): confirmar origem e autorização de uso de imagem antes de publicar
- [ ] Fotos da bola: refazer com giros exatos de 90° (e uma de baixo) pra sumir a linha de transição a 45°
- [ ] Direito de imagem das fotos do hero (Neymar e CR7, a do CR7 é foto de imprensa com patrocínios): ok para protótipo local, precisa de licença ou troca antes de publicar
- [ ] Logo em vetor de verdade (o SVG atual é um PNG 482x168 embutido)
- [ ] Fotos: hero, contratados (nome, clube e ano), clubes
- [ ] Regra dos 30 dias grátis
- [ ] Benefícios de cada plano
- [ ] Preço do plano Anual (≈ R$ 18,33/mês, mais caro por mês que o Semestral)
- [ ] Formas de pagamento, WhatsApp, e-mail, CNPJ

## Decisões tomadas
| Data | Decisão | Motivo |
|---|---|---|
| 2026-11-10 | HTML/CSS/JS puro | base rápida, sem dependências |
| 2026-11-10 | Fonte Archivo (eixo de largura) | pedido do cliente; títulos expandidos dão cara esportiva |
| 2026-11-10 | Paleta da marca: amarelo `#FFC515` + azul `#122B7E` | cores globais do site atual (Elementor); pedido do cliente |
| 2026-11-10 | Seções claras, hero/header/menus/footer em azul (`.theme-dark`) | estrutura da referência Matchday |
| 2026-11-10 | Logo: PNG extraído do SVG do cliente, versão branca sem slogan para fundo azul | o SVG enviado é um PNG embutido, texto preto |
| 2026-11-10 | Links internos apontam para futfacil.com.br | as páginas novas ainda não existem |

## Como rodar
```
npx serve . -l 5173
```
Depois abra http://localhost:5173
