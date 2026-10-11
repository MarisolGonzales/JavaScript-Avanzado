// Ejecuta las pruebas unitarias SIN navegador (Node + esbuild + Jasmine).
//   npm run test:logic
// Las mismas pruebas corren en Chrome con:  npm test
import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const specs = [];
(function buscar(dir) {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) buscar(p); else if (n.endsWith('.spec.ts')) specs.push(p);
  }
})(join(raiz, 'src'));

const salida = join(raiz, 'node_modules', '.cache', 'specs');
rmSync(salida, { recursive: true, force: true }); // evita ejecutar compilados viejos de specs borrados
mkdirSync(salida, { recursive: true });

await build({
  entryPoints: specs,
  outdir: salida,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outExtension: { '.js': '.mjs' },
  target: 'node20',
  tsconfig: join(raiz, 'tsconfig.json'),
  logLevel: 'error',
  // Angular en modo JIT necesita el compilador cargado antes que los servicios.
  banner: { js: "import '@angular/compiler';\nimport { createRequire as __cr } from 'node:module';\nconst require = __cr(import.meta.url);" },
  external: ['jasmine-core', 'jasmine']
});

const Jasmine = require('jasmine');
const j = new Jasmine({ projectBaseDir: raiz });
j.exitOnCompletion = false;
j.loadConfig({ spec_dir: 'node_modules/.cache/specs', spec_files: ['**/*.spec.mjs'], random: false });
const r = await j.execute();
process.exit(r.overallStatus === 'passed' ? 0 : 1);
