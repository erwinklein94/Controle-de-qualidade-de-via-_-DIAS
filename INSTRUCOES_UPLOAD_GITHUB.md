# Como enviar a versão leve para o GitHub

Use este pacote em vez do ZIP antigo com `node_modules`.

## O que enviar

Envie estes arquivos e pastas:

- `.github/`
- `src/`
- `.gitignore`
- `index.html`
- `package.json`
- `package-lock.json`
- `vite.config.js`
- `README.md`

## O que NÃO enviar

Não envie:

- `node_modules/`
- `dist/`

Essas pastas são geradas automaticamente. Enviar `node_modules` deixa o projeto gigante, cria milhares de arquivos e ainda pode quebrar os comandos por causa de atalhos/symlinks perdidos no ZIP.

## Rodar no computador

```bash
npm install
npm run dev
```

## Gerar o site final

```bash
npm run build
```

## Publicar no GitHub Pages

1. Suba este pacote no repositório.
2. Vá em **Settings > Pages**.
3. Em **Build and deployment**, escolha **GitHub Actions**.
4. Faça push na branch `main`.
5. O GitHub Actions vai rodar `npm ci`, gerar o `dist` e publicar.
