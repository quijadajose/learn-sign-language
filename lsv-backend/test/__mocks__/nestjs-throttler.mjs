// Stub de @nestjs/throttler para tests unitarios: el paquete CJS requiere @nestjs/common
// (ESM) y Jest no soporta ese ciclo. Los tests unitarios no dependen del rate-limit real.
export const Throttle = () => () => undefined;
export const SkipThrottle = () => () => undefined;
export class ThrottlerGuard {
  canActivate() {
    return true;
  }
}
export class ThrottlerModule {
  static forRoot() {
    return { module: ThrottlerModule };
  }
  static forRootAsync() {
    return { module: ThrottlerModule };
  }
}
