# Sistema de Inspeção de Dormentes — Rumo

Sistema web em React para acompanhamento da condição de dormentes por trecho ferroviário.

## Funcionalidades

- Cadastro de múltiplos trechos.
- Registro de quantidade de dormentes por trecho.
- Grade de inspeção no estilo Excel: cada coluna é um dormente e cada linha é uma data de inspeção.
- Status por dormente: Bom, Regular e Inservível.
- Painel de desempenho do trecho.
- Gráficos de deterioração e velocidade de queda.
- Ranking dos piores trechos da companhia por índice de risco.
- Exportação para Excel `.xls`.
- Exportação para PDF usando a impressão do navegador.
- Salvamento local no navegador via `localStorage`.

## Rodar localmente

```bash
npm install
npm run dev
```

Depois acesse o endereço mostrado no terminal, normalmente:

```text
http://localhost:5173
```

## Gerar build de produção

```bash
npm run build
```

O site final será gerado na pasta `dist`.

## Publicar no GitHub Pages

Este projeto já vem com o workflow em `.github/workflows/deploy.yml`.

Passos:

1. Crie um repositório no GitHub.
2. Envie estes arquivos para o repositório.
3. No GitHub, vá em **Settings > Pages**.
4. Em **Build and deployment**, selecione **GitHub Actions**.
5. Faça um push para a branch `main`.
6. O GitHub Actions vai gerar o build e publicar o site.

## Observações importantes

- Os dados ficam salvos no navegador do usuário. Para uso corporativo real, o ideal é adicionar banco de dados, login e permissões.
- A exportação em PDF usa `window.print()`. O usuário deve escolher “Salvar como PDF” na tela de impressão.
- A exportação Excel gera um arquivo `.xls` compatível com Excel a partir de tabelas HTML.

## Fórmula de análise usada

O desempenho do trecho é calculado assim:

- Bom = 100 pontos
- Regular = 50 pontos
- Inservível = 0 pontos

O sistema calcula:

- desempenho médio atual;
- perda total desde a primeira inspeção;
- velocidade média de queda em pontos por dia;
- percentual de inservíveis;
- ranking de risco entre trechos.
