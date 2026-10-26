/* ---------------------------------------------------------------------------
 * Builds the whole trainer as one self-contained HTML file for offline study:
 * dist-single/embedded-c-trainer.html. Open it straight from disk.
 *
 * The app, problems, plan, quiz, checker and styles are inlined. The compiler
 * worker is inlined too and runs from a blob URL. Only the ~28 MB clang
 * WebAssembly runtime is too large to inline, so it loads from jsDelivr on
 * first use (the browser caches it after that). Supabase sync is left out;
 * progress stays in the browser's local storage.
 * ------------------------------------------------------------------------- */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = new URL('.', import.meta.url);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const version = pkg.dependencies['@live-codes/clang-wasm'];   // pinned exactly, so the CDN copy matches
const CLANG_CDN = `https://cdn.jsdelivr.net/npm/@live-codes/clang-wasm@${version}/assets/`;
const OUT = new URL('dist-single/embedded-c-trainer.html', root);

/* Bundle one entry into a single script and return its code. */
async function bundle(entry, format, plugins = []) {
  const result = await build({
    root: fileURLToPath(root),
    configFile: false,
    logLevel: 'warn',
    plugins,
    define: { 'import.meta.env.VITE_CLANG_BASE_URL': JSON.stringify(CLANG_CDN) },
    build: {
      write: false,
      minify: true,
      modulePreload: false,
      rollupOptions: { input: fileURLToPath(new URL(entry, root)), output: { format, inlineDynamicImports: true } },
    },
  });
  return result.output.find((file) => file.type === 'chunk').code;
}

/* Swap the app's file-based worker for one built from the inlined source. */
const inlineWorker = (source) => ({
  name: 'inline-compiler-worker',
  transform(code, id) {
    if (!id.endsWith('/app.js')) return null;
    const from = "new Worker(new URL('./compiler-worker.js', import.meta.url), { type: 'module' })";
    if (!code.includes(from)) throw new Error('app.js no longer creates the worker the way build-single.mjs expects');
    // A replacer function, so $& and $' inside the worker source stay literal.
    return code.replace(from, () => `new Worker(URL.createObjectURL(new Blob([${JSON.stringify(source)}], { type: 'text/javascript' })))`);
  },
});

/* Inline text must not close the surrounding tag early. */
const safeIn = (tag, text) => text.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`);

/* Chrome refuses module workers from blob URLs on file:// pages, so the worker
   is a classic script; its import.meta.url becomes the classic equivalent. */
const worker = (await bundle('compiler-worker.js', 'iife')).replaceAll('import.meta.url', 'self.location.href');
if (worker.includes('import.meta')) throw new Error('the worker bundle still uses import.meta, which a classic worker cannot run');
const app = await bundle('app.js', 'iife', [inlineWorker(worker)]);
const css = await readFile(new URL('styles.css', root), 'utf8');

let html = await readFile(new URL('index.html', root), 'utf8');
for (const tag of ['<link rel="stylesheet" href="/styles.css">', '<script type="module" src="/app.js"></script>', '<script type="module" src="/supabase-trainer.js"></script>']) {
  if (!html.includes(tag)) throw new Error(`index.html no longer contains ${tag}`);
  html = html.replace(tag, '');
}
html = html.replace('</head>', () => `  <style>\n${safeIn('style', css)}\n  </style>\n  <script type="module">\n${safeIn('script', app)}\n  </script>\n</head>`);

await mkdir(new URL('.', OUT), { recursive: true });
await writeFile(OUT, html);
console.log(`Wrote ${fileURLToPath(OUT)} (${(html.length / 1024).toFixed(0)} KB). Compiler assets load from ${CLANG_CDN}`);
