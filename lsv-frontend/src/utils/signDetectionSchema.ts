import {
  FEATURES_SCHEMA_DYNAMIC,
  FEATURES_SCHEMA_STATIC,
  DYNAMIC_FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
} from "./ml-feature-contract.generated";

/**
 * Contrato de features soportado:
 * - static-v2: MLP 202D (1 frame) con pose escalado por ancho de hombros
 * - dynamic-v4: LSTM 340D; resample a T frames → deltas de manos y de brazos
 *   (en dynamic-v3 los deltas se sacaban antes del resample y dependían de
 *   los fps de la cámara)
 *
 * Se sigue capturando y guardando el frame completo de 258D; los 202D salen de
 * `selectPoseLandmarks`, que descarta los landmarks de pierna y los puntos de
 * mano gruesos del pose.
 *
 * Las versiones previas se rechazan en la carga: el escalado del pose cambia la
 * distribución de entrada de los dos modelos, así que un `static-v1` o un
 * `dynamic-v2` predeciría sobre features que nunca vio. No hay fallback por
 * `featuresCount`, porque un modelo sin versión explícita es anterior a este
 * bump por definición.
 */
export const UNSUPPORTED_SCHEMA_MESSAGE =
  "Este modelo usa un esquema de features anterior y ya no es compatible. " +
  "Reentrena el modelo para poder usarlo.";

export function isSupportedStaticSchema(
  featuresSchemaVersion?: string | null,
  featuresCount?: number | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_STATIC &&
    (featuresCount == null || featuresCount === STATIC_FEATURES_COUNT)
  );
}

export function isSupportedDynamicSchema(
  featuresSchemaVersion?: string | null,
  featuresCount?: number | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_DYNAMIC &&
    (featuresCount == null || featuresCount === DYNAMIC_FEATURES_COUNT)
  );
}

/**
 * Para los flujos que prueban un modelo sin saber de antemano si es estático o
 * dinámico: basta con que la versión sea una de las dos vigentes.
 */
export function isSupportedSchemaVersion(
  featuresSchemaVersion?: string | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_STATIC ||
    featuresSchemaVersion === FEATURES_SCHEMA_DYNAMIC
  );
}
