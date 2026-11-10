# Spec: Futfácil

O que o site **deve ser**. Mudou o escopo? Atualize aqui primeiro.

## Produto
Plataforma que conecta **jogadores** (profissionais ou amadores, sem empresário ou sem clube)
a **clubes, agentes e olheiros** do futebol brasileiro.
- Jogador: cria perfil (posição, clubes, vídeos) e paga um plano para ficar visível.
- Clube/agente: busca atletas de graça, sem comissão. Pode contratar a formação de elenco.

## Públicos
1. Jogador: quer ser visto e contratado.
2. Clube / agente / olheiro: quer achar o jogador certo rápido.

## Referências visuais
- **peleacademia.com**: smooth scroll (Lenis), header fixa com blur, botão "shiny", marquee.
- **Matchday** (imagem enviada): só a estrutura. Header sobre o hero, botão "Entrar" em destaque,
  botões de busca e menu, cards com foto, seções claras. O hero é de tela inteira, sem card com margem.
  Cores e formas seguem a marca e o `regras/ANTI-PATTERNS.md` (sem pílula, sem círculo em botão).

## Identidade
- Cores: amarelo `#FFC515` (CTA, destaque) e azul `#122B7E` (marca, fundos escuros `#091547`). Seções em fundo claro `#F3F5FA`.
- Fonte: Archivo. Logo: `assets/img/logo-futfacil-branco.png` (fundo azul) e `logo-futfacil.png` (fundo claro).

## Páginas
| Página | Status |
|---|---|
| Home (`index.html`) | em construção |
| Jogadores (listagem + filtros) | a fazer |
| Perfil do jogador | a fazer |
| Clubes & Contratantes | a fazer |
| Planos | a fazer |
| Login / Criar conta | a fazer (hoje usa o site atual) |

## Home: seções
1. Header (ver abaixo)
2. Hero com abas "Sou jogador / Sou clube"
3. Faixa marquee de posições
4. Como funciona (3 passos)
5. Vitrine de jogadores com filtro
6. Contratados (prova social)
7. Planos
8. Para clubes
9. FAQ
10. CTA final
11. Footer

## Header (feita)
- Logo · Home · Jogadores ⌄ (mega menu com posições) · Clubes & Contratantes ⌄ · Planos · Mais ⌄
- Busca 🔍 (overlay; envia para a busca real do site atual) · Entrar · ☰ (menu lateral)
- No topo fica transparente, dentro do hero. Ao rolar, vira uma pílula flutuante.
- Some ao descer e volta ao subir. Também some quando o footer aparece.

## Integração com o site atual (WordPress + HivePress)
- Busca: `GET https://futfacil.com.br/?post_type=hp_listing&_category=ID&s=termo`
- Categorias: Goleiros 54 · Zagueiros 59 · Laterais 55 · Volantes 58 · Meias 57 · Atacantes 52
- Páginas de categoria: `/listing-category/{goleiros|zagueiros|laterais|volantes|meias|atacante}/`
- Planos (pacotes): Grátis 6 · Mensal 7 · Trimestral 10 · Semestral 11 · Anual 12
