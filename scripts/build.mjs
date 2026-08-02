// Assembles what ships in the VSIX:
//   extension.js      bundled host code, with dependency licences appended
//   dist/webview/     preview script and stylesheet, loaded by the webview
//
// The Cucumber parser is ESM only, so esbuild is what makes it loadable from
// the CommonJS entry point VS Code expects.
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await rm(resolve(root, 'extension.js'), { force: true });

// Host: runs in the extension process, with vscode provided by the editor.
await build({
  entryPoints: [resolve(root, 'src/extension.ts')],
  outfile: resolve(root, 'extension.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  // Attribution for everything pulled into the bundle, generated rather than
  // maintained by hand.
  legalComments: 'eof',
});

// Webview: runs in the browser context, loaded by a plain script tag.
await build({
  entryPoints: [resolve(root, 'src/webview/preview.ts')],
  outfile: resolve(dist, 'webview/preview.js'),
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  legalComments: 'eof',
});

await mkdir(resolve(dist, 'webview'), { recursive: true });
await cp(resolve(root, 'src/webview/styles.css'), resolve(dist, 'webview/styles.css'));

console.log('build: extension.js, dist/webview');
