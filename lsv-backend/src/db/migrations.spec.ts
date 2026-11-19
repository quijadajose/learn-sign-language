import { readdirSync } from 'fs';
import { join } from 'path';
import { migrations } from './migrations.js';

describe('migrations', () => {
  const dir = join(import.meta.dirname, 'migrations');
  const files = readdirSync(dir)
    .filter((f) => /^\d+-.+\.ts$/.test(f) && !f.endsWith('.spec.ts'))
    .sort();

  it('registers every migration file in the folder', () => {
    const registered = migrations.map((m) => m.name);
    // El nombre de la clase termina en el timestamp del archivo (convención de TypeORM).
    const expected = files.map((f) => {
      const [timestamp, name] = f.replace(/\.ts$/, '').split(/-(.+)/);
      return `${name}${timestamp}`;
    });
    expect(registered).toEqual(expected);
  });

  it('keeps migrations in chronological order', () => {
    const timestamps = migrations.map((m) =>
      Number(/(\d+)$/.exec(m.name)?.[1]),
    );
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });
});
