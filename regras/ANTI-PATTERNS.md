# Anti-patterns obrigatórios

O site falha se contiver qualquer um destes itens.

- **Nada de glow**: sem sombras coloridas brilhantes, sem orbs de gradiente luminoso no fundo, sem text-shadow neon.
- **Nada de pills**: botões e badges com `border-radius` máximo de 8px. Proibido `rounded-full` em botões, tags e badges (exceção pedida pelo cliente: os pinos redondos de tabuleiro do campo da seção Clubes). Eyebrows de seção são texto uppercase pequeno com tracking largo, sem cápsula ao redor e **sem linha ao lado** (o cliente leu a linha como travessão).
- **Bordas discretas**: cards com raio entre 4px e 12px, nunca 2rem ou squircle exagerado.
- **Nunca usar travessão (—)** em nenhum texto do site. Substituir por vírgula, dois-pontos ou ponto final.
- Sem emojis no corpo do site.
- Sem sombras duras escuras (`rgba(0,0,0,0.3)`). Quando houver sombra, que seja ambiente, ampla e sutil.
- Sem grid simétrico de 3 colunas estilo Bootstrap sem respiro. Usar assimetria e espaço em branco generoso.

## Como verificar antes de entregar

```
grep -rn "—" index.html assets/js        # travessão em texto
grep -rn "999px\|50%;" assets/css        # pills e círculos em botões
grep -rn "radial-gradient" assets/css    # possíveis orbs de glow
grep -rn "rgba(0, 0, 0, \.[3-9]" assets/css  # sombras escuras duras
```
