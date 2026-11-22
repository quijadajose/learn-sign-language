// El plugin de @nestjs/swagger, con el build ESM (module nodenext), emite en los decoradores
// `require("<ruta>", { with: { "resolution-mode": "import" } })`. En un módulo ESM `require`
// no existe, y la API no arranca. Los archivos ESM de Nest ya definen `__require` con
// createRequire, así que se usa ese helper. Se aplica a la carpeta de salida indicada.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outDir = process.argv[2] ?? 'dist';
const PATTERN = /\brequire\((\"[^\"]+\"), \{ with: \{ "resolution-mode": "import" \} \}\)/g;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? walk(path) : path.endsWith('.js') ? [path] : [];
    }),
  );
  return files.flat();
}

let changed = 0;
for (const file of await walk(outDir)) {
  const source = await readFile(file, 'utf8');
  if (!PATTERN.test(source)) continue;
  PATTERN.lastIndex = 0;
  if (!/__require\s*=/.test(source)) {
    throw new Error(`${file}: usa require de resolution-mode pero no define __require`);
  }
  await writeFile(file, source.replace(PATTERN, '__require($1)'));
  changed += 1;
}
console.log(`fix-esm-require: ${changed} archivo(s) corregidos en ${outDir}`);
