# Regras do projeto

Ordem de prioridade quando houver conflito:
1. **[ANTI-PATTERNS.md](ANTI-PATTERNS.md)**: regras do cliente. O site falha se violar qualquer uma.
2. **[frontend-design/SKILL.md](frontend-design/SKILL.md)**: skill de design (Anthropic, Apache 2.0).
   Processo: plano de design (cores, tipo, layout, princípios) → revisão contra o briefing → código → autocrítica.
3. Este arquivo.

Onde a skill e as referências do cliente divergem, vale o que o cliente pediu.
Exemplo: a skill chama "fundo quase preto + um verde-limão" de padrão genérico, mas a referência
Matchday escolhida pelo cliente usa exatamente o verde-limão.

## Conteúdo
- Textos em **PT-BR**, tom direto e próximo do jogador. Nada de CAPS LOCK em blocos de texto.
- Nunca prometer contratação. Manter o aviso: "A Futfácil não garante contratação".
- Números e afirmações (ex.: "+300 clubes") só se o cliente confirmar.
- Texto provisório leva a marcação `[Confirmar]`.

## Design
- Fonte única: **Archivo**. Títulos com `wdth` 118–125, labels com `wdth` 75.
- Cores, espaçamentos e raios **só via tokens** (`assets/css/tokens.css`). Nada de cor solta no CSS.
- Accent verde-limão apenas em CTA, destaques e estados ativos.
- Raios: botões, badges e chips de 4 a 8px; cards de 4 a 12px. Nada de pílula nem círculo em botão.
- Não colocar eyebrow em cima de todo título; usar só onde ajuda a orientar.
- Não juntar informações com ponto do meio ("A · B"); usar vírgula. Não anexar "→" em texto de link.
- Animação automática com moderação: um momento orquestrado vale mais que fade em toda seção.
- Mobile first: tudo funciona a partir de 360px de largura, sem scroll horizontal.

## Código
- HTML semântico; `aria-*` em menus, dropdowns e overlays; navegação completa por teclado.
- Respeitar `prefers-reduced-motion`: sem animação e sem smooth scroll.
- CSS organizado por arquivo: `tokens` → `base` → `components` → `header` → `sections`.
- Comportamentos ajustáveis ficam no `CONFIG` do `main.js`.
- Bibliotecas externas com versão fixa (ex.: `lenis@1.1.13`).
- Antes de criar componente novo, ver se já existe um em `components.css`.

## Fluxo
1. Mudou o escopo → atualizar `spec/`.
2. Terminou uma etapa → atualizar `state/STATE.md`.
3. Nova referência visual → registrar em `spec/README.md` (seção "Referências visuais").
