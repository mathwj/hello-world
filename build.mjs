/* Inlines the stylesheet and the scripts into one self-contained page.
   node build.mjs  →  dist/border-control.html

   Note the lambda in the replace: a plain string replacement would let
   the regex engine eat the backslash escapes in the JavaScript source. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');

const css = read('./css/styles.css').trim();
const js = ['officer', 'voice', 'dialogue', 'app'].map(n => read(`./js/${n}.js`).trim());

let html = read('./index.html');

html = html.replace('<link rel="stylesheet" href="css/styles.css" />',
                    `<style>\n${css}\n</style>`);

html = html.replace(
  /<script src="js\/officer\.js"><\/script>\s*<script src="js\/voice\.js"><\/script>\s*<script src="js\/dialogue\.js"><\/script>\s*<script src="js\/app\.js"><\/script>/,
  () => js.map(s => `<script>\n${s}\n</script>`).join('\n'));

for (const leftover of ['css/styles.css', 'js/app.js', 'js/voice.js']) {
  if (html.includes(leftover)) throw new Error('failed to inline ' + leftover);
}
// escapes the regex replacement would have mangled
for (const probe of ["' \\n\\t'.includes(c)", '[.*+?^${}()|[\\]\\\\]']) {
  if (!html.includes(probe)) throw new Error('mangled escape: ' + probe);
}

mkdirSync(new URL('./dist/', import.meta.url), { recursive: true });
writeFileSync(new URL('./dist/border-control.html', import.meta.url), html);
console.log(`dist/border-control.html — ${(html.length / 1024).toFixed(1)} KB`);
