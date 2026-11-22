import * as tf from "@tensorflow/tfjs";
import {
  DYNAMIC_FEATURES_COUNT,
  FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
} from "./ml-feature-contract.generated";
import {
  UNSUPPORTED_SCHEMA_MESSAGE,
  isSupportedDynamicSchema,
  isSupportedStaticSchema,
} from "./signDetectionSchema";

export function resolveTrustedModelUrl(
  modelJsonUrl: string,
  backendBaseUrl: string,
  pageOrigin: string,
): string {
  if (!/^https?:\/\//i.test(modelJsonUrl)) {
    const base = backendBaseUrl.endsWith("/")
      ? backendBaseUrl.slice(0, -1)
      : backendBaseUrl;
    const path = modelJsonUrl.startsWith("/")
      ? modelJsonUrl
      : `/${modelJsonUrl}`;
    return `${base}${path}`;
  }
  const modelOrigin = new URL(modelJsonUrl).origin;
  const backendOrigin = new URL(backendBaseUrl, pageOrigin).origin;
  const page = new URL(pageOrigin).origin;
  if (modelOrigin !== backendOrigin && modelOrigin !== page) {
    throw new Error("Untrusted model URL");
  }
  return modelJsonUrl;
}

export async function loadTfModelFromUrl(
  modelJsonUrl: string,
  backendBaseUrl: string,
): Promise<{
  model: tf.LayersModel;
  sequenceLength: number;
  featuresCount: number;
  modelType: "static" | "dynamic";
}> {
  const pageOrigin =
    typeof window !== "undefined" ? window.location.origin : backendBaseUrl;
  const modelUrl = resolveTrustedModelUrl(
    modelJsonUrl,
    backendBaseUrl,
    pageOrigin,
  );

  const requestInit: RequestInit = {
    credentials: "include",
  };

  const response = await fetch(modelUrl, requestInit);
  if (!response.ok) {
    throw new Error(
      `No se pudo cargar el modelo (${response.status}): ${modelUrl}`,
    );
  }
  const modelJson = await response.json();

  let sequenceLength = 30;
  let featuresCount = FEATURES_COUNT;
  let modelType: "static" | "dynamic" = "dynamic";

  try {
    const layers =
      modelJson.modelTopology?.model_config?.config?.layers ||
      modelJson.modelTopology?.config?.layers;
    if (layers?.length > 0) {
      const shape =
        layers[0].config?.batch_input_shape ||
        layers[0].config?.batchInputShape ||
        layers[0].config?.shape;
      if (shape?.length === 2 && shape[1] !== null) {
        modelType = "static";
        sequenceLength = 1;
        featuresCount = shape[1];
      } else if (shape?.length >= 3) {
        modelType = "dynamic";
        if (shape[shape.length - 2] !== null) {
          sequenceLength = shape[shape.length - 2];
        }
        if (shape[shape.length - 1] !== null) {
          featuresCount = shape[shape.length - 1];
        }
      }
    }
  } catch {
    /* usar valores por defecto */
  }

  // Only same-origin / backend URLs reach here; cookie via credentials.
  const model = await tf.loadLayersModel(
    tf.io.browserHTTPRequest(modelUrl, {
      requestInit,
    }),
  );
  return { model, sequenceLength, featuresCount, modelType };
}

export type LessonModelPayload = {
  id: string;
  name?: string;
  modelJsonUrl: string;
  labels?: string[];
  modelType?: "static" | "dynamic";
  featuresCount?: number;
  featuresSchemaVersion?: string | null;
};

export type LessonModelsBundle = {
  static: LessonModelPayload | null;
  dynamic: LessonModelPayload | null;
};

export type LoadedLessonModels = {
  static: {
    model: tf.LayersModel;
    labels: string[];
    featuresCount: number;
  } | null;
  dynamic: {
    model: tf.LayersModel;
    labels: string[];
    sequenceLength: number;
    featuresCount: number;
  } | null;
};

/**
 * FE-08: si las etiquetas no coinciden con las salidas del modelo, las predicciones
 * se asignarían a la seña equivocada en silencio. Se rechaza el modelo en su lugar.
 */
function assertLabelsMatchModelOutput(
  model: unknown,
  labels: string[],
  kind: string,
): void {
  const outputs = (model as { outputs?: Array<{ shape?: (number | null)[] }> })
    .outputs;
  const shape = outputs?.[0]?.shape;
  const units = shape ? shape[shape.length - 1] : null;
  if (typeof units === "number" && labels.length !== units) {
    throw new Error(
      `Modelo ${kind} inconsistente: ${labels.length} etiquetas para ${units} salidas.`,
    );
  }
}

async function loadStaticLessonModel(
  payload: LessonModelPayload,
  backendBaseUrl: string,
): Promise<NonNullable<LoadedLessonModels["static"]>> {
  if (
    !isSupportedStaticSchema(payload.featuresSchemaVersion, payload.featuresCount)
  ) {
    throw new Error(UNSUPPORTED_SCHEMA_MESSAGE);
  }
  const loaded = await loadTfModelFromUrl(payload.modelJsonUrl, backendBaseUrl);
  const featuresCount = payload.featuresCount ?? loaded.featuresCount;
  if (featuresCount !== STATIC_FEATURES_COUNT) {
    loaded.model.dispose();
    throw new Error(
      `Modelo estático incompatible: se esperaban ${STATIC_FEATURES_COUNT} features, hay ${featuresCount}.`,
    );
  }
  assertLabelsMatchModelOutput(loaded.model, payload.labels || [], "estático");
  return {
    model: loaded.model,
    labels: payload.labels || [],
    featuresCount,
  };
}

async function loadDynamicLessonModel(
  payload: LessonModelPayload,
  backendBaseUrl: string,
): Promise<NonNullable<LoadedLessonModels["dynamic"]>> {
  if (
    !isSupportedDynamicSchema(payload.featuresSchemaVersion, payload.featuresCount)
  ) {
    throw new Error(UNSUPPORTED_SCHEMA_MESSAGE);
  }

  const loaded = await loadTfModelFromUrl(payload.modelJsonUrl, backendBaseUrl);
  const featuresCount = payload.featuresCount ?? loaded.featuresCount;
  if (featuresCount !== DYNAMIC_FEATURES_COUNT) {
    loaded.model.dispose();
    throw new Error(
      `Modelo dinámico incompatible: se esperaban ${DYNAMIC_FEATURES_COUNT} features, hay ${featuresCount}.`,
    );
  }
  assertLabelsMatchModelOutput(loaded.model, payload.labels || [], "dinámico");
  return {
    model: loaded.model,
    labels: payload.labels || [],
    sequenceLength: loaded.sequenceLength,
    featuresCount,
  };
}

export async function loadLessonModelsFromApi(
  payload: LessonModelsBundle,
  backendBaseUrl: string,
): Promise<LoadedLessonModels> {
  const result: LoadedLessonModels = { static: null, dynamic: null };

  const disposeLoaded = () => {
    result.static?.model.dispose();
    result.static = null;
    result.dynamic?.model.dispose();
    result.dynamic = null;
  };

  try {
    if (payload.static?.modelJsonUrl) {
      result.static = await loadStaticLessonModel(
        payload.static,
        backendBaseUrl,
      );
    }
    if (payload.dynamic?.modelJsonUrl) {
      result.dynamic = await loadDynamicLessonModel(
        payload.dynamic,
        backendBaseUrl,
      );
    }
    return result;
  } catch (error) {
    disposeLoaded();
    throw error;
  }
}
