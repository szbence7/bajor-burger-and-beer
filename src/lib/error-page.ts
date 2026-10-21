// Last-resort HTML for errors thrown outside React rendering (see src/start.ts).
// Self-contained on purpose: it must work even when the app bundle or CSS fails.
// Colours mirror the theme tokens in src/styles.css.
export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="hu">
  <head>
    <meta charset="utf-8" />
    <title>Hoppá, valami félrecsúszott — Bajor Burger &amp; Beer</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <style>
      body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 1.5rem;
        background: #121110; color: #f5efe6; font: 16px/1.5 system-ui, -apple-system, sans-serif; text-align: center; }
      h1 { font: 900 2.5rem/1 Impact, "Arial Narrow", sans-serif; text-transform: uppercase; color: #d2ac66; margin: 0 0 1rem; }
      p { color: #a89f94; margin: 0 0 1.5rem; }
      a, button { display: inline-block; margin: 0.25rem; padding: 0.85rem 1.5rem; border-radius: 999px; border: 2px solid #d2ac66;
        font: 800 0.85rem/1 system-ui, sans-serif; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; text-decoration: none; }
      button { background: #d2ac66; color: #121110; }
      a { background: transparent; color: #d2ac66; }
    </style>
  </head>
  <body>
    <main>
      <h1>Hoppá, valami félrecsúszott</h1>
      <p>Az oldal most nem töltött be. Próbáld újra, vagy térj vissza a főoldalra.</p>
      <button onclick="location.reload()">Újra</button>
      <a href="/">Főoldal</a>
    </main>
  </body>
</html>`;
}
