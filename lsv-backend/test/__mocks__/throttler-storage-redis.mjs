// Stub de @nest-lab/throttler-storage-redis para e2e: el paquete CJS requiere
// @nestjs/common (ESM) y Jest lanza un ciclo require(esm). El stub de
// @nestjs/throttler ignora el storage, así que solo hace falta la clase.
export class ThrottlerStorageRedisService {
  constructor(_options) {}
  async increment() {
    return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlock: 0 };
  }
}
