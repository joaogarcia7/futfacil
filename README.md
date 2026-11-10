# Futfácil: novo site (base)

Site estático em HTML/CSS/JS puro. Não precisa de build, é só abrir o `index.html` no navegador
(ou rodar `npx serve .` para testar como servidor).

## Estrutura

```
index.html                 página inicial (todas as seções)
assets/css/tokens.css      cores, fonte, espaçamentos, tamanhos (o "design system")
assets/css/base.css        reset, tipografia, utilitários, Lenis, reveal
assets/css/components.css  botões, chips, cards, marquee, FAQ
assets/css/header.css      header, dropdowns, busca (overlay) e menu lateral
assets/css/sections.css    hero, como funciona, vitrine, planos, clubes, CTA, footer
assets/js/main.js          scroll, header, reveal, abas do hero, vitrine
```

Para mudar a identidade visual, mexa só no `tokens.css`.

## Fonte

**Archivo** via Google Fonts, com os eixos de peso (100–900) e de largura (62–125%).
- Títulos usam `font-variation-settings: "wdth" 118` (mais largos, com cara de esporte).
- Eyebrows e labels usam `"wdth" 75` (condensados).

## O que foi copiado da referência (peleacademia.com)

A Pelé Academia é feita em **Astro** e usa **Lenis** para o smooth scroll. Não usa GSAP.

| Recurso | Referência | Aqui |
|---|---|---|
| Smooth scroll | Lenis, `duration: 2.5`, easing expo, só em telas >1024px | Igual, em `CONFIG.lenis` no `main.js` |
| Header | fixa, `#000000b8` + `blur(12px)`, some quando o footer aparece | Igual, e também some ao rolar para baixo e volta ao subir (`CONFIG.header`) |
| Tópicos da header | 4 links âncora (`/#historia`, …) + botão de CTA | Âncoras com rolagem suave descontando a altura da header, e o tópico da seção visível fica marcado (scrollspy) |
| Menu mobile | burger com painel que abre por baixo | Igual, fecha no Esc ou ao clicar num link, e trava o scroll enquanto está aberto |
| Botão principal | "shiny": brilho girando na borda com `@property` | `.btn--shiny` |
| Marquee | track duplicado, `translateX(-50%)`, pausa no hover | `.marquee` |
| Hero | slides com troca de texto a cada 5s | Abas "Sou jogador / Sou clube" (o site atende os dois públicos) |

Outros efeitos que acrescentei: texto do botão que rola para cima no hover (`.btn__label`) e
entrada dos elementos ao rolar a página (`data-reveal` / `data-reveal-group`).
Quem usa "reduzir movimento" no sistema fica sem animações e sem smooth scroll.

## Problemas do site atual que esta versão corrige

- O hero tinha três títulos competindo. Agora tem uma mensagem por público.
- Os clubes só encontravam o conteúdo deles no fim da página. Agora há uma aba no hero e um link na header.
- "Comece agora jogador" aparecia 4 vezes e um título se repetia. Agora cada CTA tem um texto próprio.
- Os preços não estavam na home. Agora aparecem, com o valor equivalente por mês.
- As fotos dos contratados não tinham nome nem clube. Agora têm legenda.
- A vitrine tinha cards de placeholder. Agora tem filtro por posição e uma mensagem quando a lista está vazia.

## A confirmar antes de publicar

- [ ] **Logo real.** No site atual o arquivo se chama `Sem-titulo.jpg`; aqui o logo é provisório.
- [ ] **Regra dos 30 dias grátis** e a relação dela com o plano Grátis.
- [ ] **Benefícios de cada plano.** As listas estão genéricas.
- [ ] **Plano Anual:** sai por ≈ R$ 18,33/mês, mais caro por mês que o Semestral (≈ R$ 16,65). Vale revisar o preço.
- [ ] Links de preço no site atual: todos apontam para `package/7`, mas os botões apontam para pacotes diferentes.
- [ ] Formas de pagamento (Pix, cartão, boleto?).
- [ ] Fotos reais: hero, contratados (com nome, clube e ano) e a área de clubes.
- [ ] Dados da vitrine: hoje é uma lista de exemplo em `PLAYERS` no `main.js`, depois virá da API/banco.
- [ ] WhatsApp/e-mail de contato e CNPJ no footer (passam confiança).
