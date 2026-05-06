# Sistema de Prospecção de Dormentes — Marcelo Dias / Rumo

Sistema web em React/Vite para registrar locais de trechos, acompanhar a piora de dormentes e gerar dashboard de apresentação gerencial.

## Fluxo principal

1. **Registro de trechos**: cadastre local, malha, equipamento, KM, material, classe, traçado, perda de bitola/suporte, junta/solda e quantidade de dormentes.
2. **Inspeção**: escolha o trecho cadastrado e registre, linha por linha, cada ida ao local. Cada coluna é um dormente. Cada linha possui botão **Editar/Bloquear** para evitar alteração acidental no celular.
3. **Dashboard**: filtre por trecho, data e condição; veja gráficos, ranking, clusters/malhas, marcações, piores dormentes e exporte Excel/PDF.
4. **Procedimentos**: consulta didática dos critérios Bom, Regular, Inservível, Ruína, Cluster/Malha, Taxa e marcações de prospecção.

## Funcionalidades

- Tema escuro padrão inspirado no azul escuro da Rumo.
- Alternância para tema claro.
- Cadastro de múltiplos trechos.
- Registro de dormentes como Bom, Regular, Inservível ou Ruína.
- Bloqueio de linhas de inspeção para evitar edição acidental.
- Cálculo de desempenho, taxa crítica, clusters/malhas, maior malha, marcações de 1 e 2 pinturas, regulares adjacentes e risco.
- Dashboard filtrável por trecho, período e condição.
- Exportação Excel e PDF de apresentação apenas no Dashboard.
- Salvamento local no navegador via `localStorage`.

## Publicar no GitHub Pages

Suba o conteúdo deste ZIP no repositório e configure **Settings > Pages > Source: GitHub Actions**.

Este pacote não inclui `node_modules/` nem `dist/`. O GitHub Actions instala dependências e gera o build automaticamente.
