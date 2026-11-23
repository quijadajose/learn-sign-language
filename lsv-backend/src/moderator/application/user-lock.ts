/**
 * Serializa las operaciones de permisos de un mismo usuario dentro de este proceso.
 * Evita que asignar y revocar se pisen (rol y permisos desincronizados).
 * Con varias réplicas de la API haría falta un bloqueo en base de datos.
 */
const chains = new Map<string, Promise<unknown>>();

export function withUserLock<T>(
  userId: string,
  task: () => Promise<T>,
): Promise<T> {
  const previous = chains.get(userId) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(task);
  const tail = run.catch(() => undefined);
  chains.set(userId, tail);
  void tail.then(() => {
    if (chains.get(userId) === tail) chains.delete(userId);
  });
  return run;
}
