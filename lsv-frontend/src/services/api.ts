import { BACKEND_BASE_URL } from "../config";
import i18n, { getUiLocale } from "../i18n";
import type {
  CustomTrainingFilters,
  LessonModelDto,
  LessonModelsBundleDto,
  PaginatedSignsDto,
  BulkCreateSignsResultDto,
  SaveLandmarksPayload,
  SignDto,
  SignRecordingDto,
} from "../types/signRecord";
import type { SignDetectionType } from "../utils/signDetection";

let handlingTokenExpiration = false;
let sessionActive = false;

export function markSessionActive(active: boolean) {
  sessionActive = active;
}

const handleTokenExpiration = () => {
  if (handlingTokenExpiration) return;
  handlingTokenExpiration = true;

  window.dispatchEvent(
    new CustomEvent("show-toast", {
      detail: {
        type: "error",
        message: i18n.t("api.sessionExpired"),
      },
    }),
  );
  // AuthProvider clears React + localStorage state; PrivateRoute navigates to /login.
  window.dispatchEvent(new Event("session-expired"));

  // Re-arm after sync listeners run (dedupes parallel 401s in the same burst).
  queueMicrotask(() => {
    handlingTokenExpiration = false;
  });
};

/**
 * Default payload for untyped ApiService calls.
 * Prefer specifying an explicit generic at the call site when possible.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UntypedApiPayload = any;

export interface ApiResponse<T = UntypedApiPayload> {
  data?: T;
  message?: string;
  success: boolean;
  status?: number;
}

/**
 * Desenvuelve el envelope típico del backend Nest:
 * `ApiResponse.data` puede ser `T` o `{ data: T, ... }`.
 */
export function unwrapApiData<T = unknown>(responseData: unknown): T {
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    (responseData as { data: unknown }).data !== undefined &&
    (responseData as { data: unknown }).data !== null
  ) {
    return (responseData as { data: T }).data;
  }
  return responseData as T;
}

/** Como unwrapApiData, pero siempre devuelve un array (`data` o `items`). */
export function unwrapApiList<T = unknown>(responseData: unknown): T[] {
  if (Array.isArray(responseData)) return responseData as T[];

  const value = unwrapApiData<unknown>(responseData);
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const obj = value as { data?: unknown; items?: unknown };
    if (Array.isArray(obj.data)) return obj.data as T[];
    if (Array.isArray(obj.items)) return obj.items as T[];
  }

  return [];
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export interface UploadConfig extends RequestConfig {
  onProgress?: (progress: number) => void;
}

export class ApiService {
  private static baseURL = BACKEND_BASE_URL;
  private static defaultTimeout = 10000;
  private static defaultRetries = 3;

  private static getLocaleHeaders(): Record<string, string> {
    return { "Accept-Language": getUiLocale() };
  }

  /** Mutating methods default to no retries to avoid duplicate side effects on timeout. */
  private static retriesForMethod(method: string, override?: number): number {
    if (override !== undefined) return override;
    const upper = method.toUpperCase();
    if (upper === "GET" || upper === "HEAD") return this.defaultRetries;
    return 0;
  }

  private static async handleResponse<T>(
    response: Response,
    endpoint: string,
  ): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get("content-type");
      let data: unknown;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      const dataMessage =
        data &&
        typeof data === "object" &&
        "message" in data
          ? (data as { message: unknown }).message
          : undefined;

      if (response.ok) {
        return {
          data: data as T,
          message:
            typeof dataMessage === "string"
              ? dataMessage
              : i18n.t("api.success"),
          success: true,
          status: response.status,
        };
      } else {
        const isAuthPublic = endpoint.startsWith("/auth/");
        if (response.status === 401 && sessionActive && !isAuthPublic) {
          handleTokenExpiration();
          return {
            message: i18n.t("api.sessionExpired"),
            success: false,
            status: response.status,
          };
        }

        let errorMessage: unknown =
          dataMessage ?? data ?? i18n.t("api.requestFailed");
        if (Array.isArray(errorMessage)) {
          errorMessage = errorMessage[0]; // Take the first error string if it's an array
        } else if (typeof errorMessage === "object" && errorMessage !== null) {
          errorMessage = JSON.stringify(errorMessage);
        }

        return {
          message: String(errorMessage),
          success: false,
          status: response.status,
        };
      }
    } catch (error) {
      return {
        message: i18n.t("api.unexpected"),
        success: false,
        status: response.status,
      };
    }
  }

  private static async makeRequest<T = UntypedApiPayload>(
    endpoint: string,
    method: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const {
      headers = {},
      timeout = this.defaultTimeout,
      retries,
    } = config;
    const maxRetries = this.retriesForMethod(method, retries);

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...this.getLocaleHeaders(),
      ...headers,
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
      credentials: "include",
    };

    if (body && !(body instanceof FormData)) {
      requestConfig.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      requestConfig.body = body;
      delete requestHeaders["Content-Type"];
    }

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response, endpoint);
      } catch (error) {
        if (attempt === maxRetries) {
          if (error instanceof Error && error.name === "AbortError") {
            return {
              message: "La petición ha excedido el tiempo límite",
              success: false,
            };
          }
          return {
            message: "Error de conexión",
            success: false,
          };
        }
        // Do not retry aborts/timeouts — the server may have already committed.
        if (error instanceof Error && error.name === "AbortError") {
          return {
            message: "La petición ha excedido el tiempo límite",
            success: false,
          };
        }
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1)),
        );
      }
    }

    return {
      message: "Error de conexión después de múltiples intentos",
      success: false,
    };
  }

  static async get<T = UntypedApiPayload>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, config);
  }

  static async post<T = UntypedApiPayload>(
    endpoint: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "POST", body, config);
  }

  static async put<T = UntypedApiPayload>(
    endpoint: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "PUT", body, config);
  }

  static async patch<T = UntypedApiPayload>(
    endpoint: string,
    body?: unknown,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "PATCH", body, config);
  }

  static async delete<T = UntypedApiPayload>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "DELETE", undefined, config);
  }

  static async upload<T = UntypedApiPayload>(
    endpoint: string,
    file: File,
    additionalData: Record<string, string | Blob> = {},
    config: UploadConfig = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const { onProgress, ...requestConfig } = config;
    void onProgress;

    return this.makeRequest<T>(endpoint, "POST", formData, {
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
      },
    });
  }

  static buildUrl(
    endpoint: string,
    params: object = {},
  ): string {
    const searchParams = new URLSearchParams();
    Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `${endpoint}?${queryString}` : endpoint;
  }
}

export const authApi = {
  resetPassword: (email: string) =>
    ApiService.post("/auth/password/reset", { email }),

  confirmPasswordReset: (newPassword: string, token: string) =>
    ApiService.post("/auth/password/reset/confirm", { newPassword, token }),

  login: (email: string, password: string) =>
    ApiService.post<{ data: { user: import("../types/user").UserData } }>(
      "/auth/login",
      { email, password },
    ),

  exchangeGoogleCode: (code: string) =>
    ApiService.post("/auth/google/exchange", {
      code,
    }),

  register: (userData: Record<string, unknown>) =>
    ApiService.post("/auth/register", userData),

  logout: () => ApiService.post("/auth/logout"),
};

export const userApi = {
  getProfile: () => ApiService.get("/user/profile"),

  getMe: () => ApiService.get("/users/me"),

  updateProfile: (userData: unknown) =>
    ApiService.put("/user/profile", userData),

  updateMe: (userData: unknown) => ApiService.put("/users/me", userData),

  uploadUserImage: (file: File, userId: string) =>
    ApiService.upload("/images/upload/user", file, {
      id: userId,
    }),
};

export const lessonApi = {
  getLessons: () => ApiService.get("/lesson"),

  getLesson: (id: string) => ApiService.get(`/lesson/${id}`),

  getUserLesson: (lessonId: string) =>
    ApiService.get(`/users/lesson/${lessonId}`),

  startLesson: (lessonId: string, regionId?: string) =>
    ApiService.post("/user-lesson/start", { lessonId, regionId }),

  setLessonCompletion: (lessonId: string, isComplete: boolean) =>
    ApiService.post("/user-lesson/set-lesson-completion", {
      lessonId,
      isComplete,
    }),

  updateProgress: (lessonId: string, progress: unknown) =>
    ApiService.put(`/lesson/${lessonId}/progress`, progress),

  getStagesProgress: (languageId: string) => {
    const url = ApiService.buildUrl(`/users/stages-progress/${languageId}`, {
      page: "1",
      limit: "100",
      orderBy: "name",
      sortOrder: "ASC",
    });
    return ApiService.get(url);
  },

  getLessonsWithSubmissions: (
    languageId: string,
    stageId: string,
    page: number = 1,
    limit: number = 100,
    regionId?: string,
  ) => {
    const params: Record<string, string> = {
      stageId,
      page: page.toString(),
      limit: limit.toString(),
      orderBy: "name",
      sortOrder: "ASC",
    };

    if (regionId) {
      params.regionId = regionId;
    }

    const url = ApiService.buildUrl(
      `/lesson/by-language/${languageId}/with-submissions`,
      params,
    );
    return ApiService.get(url);
  },
};

export const leaderboardApi = {
  getLeaderboard: (
    page: number = 1,
    limit: number = 10,
    orderBy: string = "totalScore",
    sortOrder: "ASC" | "DESC" = "DESC",
  ) => {
    const params = { page, limit, orderBy, sortOrder };
    const url = ApiService.buildUrl("/leaderboard", params);
    return ApiService.get(url);
  },

  getLeaderboardByLanguage: (
    languageId: string,
    page: number = 1,
    limit: number = 10,
    orderBy: string = "totalScore",
    sortOrder: "ASC" | "DESC" = "DESC",
  ) => {
    const params = { page, limit, orderBy, sortOrder };
    const url = ApiService.buildUrl(
      `/leaderboard/language/${languageId}`,
      params,
    );
    return ApiService.get(url);
  },
};

export const quizApi = {
  getQuizByLesson: (lessonId: string, regionId?: string) => {
    const params = regionId ? { regionId } : {};
    const url = ApiService.buildUrl(`/lesson/${lessonId}/quizzes`, params);
    return ApiService.get(url);
  },

  getQuizForAdmin: (quizId: string) => ApiService.get(`/quiz/admin/${quizId}`),

  submitQuiz: (quizId: string, answers: unknown[]) =>
    ApiService.post(`/quiz/${quizId}/submissions`, { answers }),

  createQuiz: (quizData: unknown) => ApiService.post("/quiz", quizData),

  updateQuiz: (quizId: string, quizData: unknown) =>
    ApiService.put(`/quiz/${quizId}`, quizData),

  deleteQuiz: (quizId: string) => ApiService.delete(`/quiz/${quizId}`),

  uploadQuizImage: (file: File, id: string, format?: string) =>
    ApiService.upload(
      "/images/upload/quiz",
      file,
      format ? { id, format } : { id },
    ),
};

export const adminApi = {
  getLanguages: (page: number = 1, limit: number = 100) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl("/languages", params);
    return ApiService.get(url);
  },

  getLanguage: (languageId: string) =>
    ApiService.get(`/languages/${languageId}`),

  createLanguage: (languageData: unknown) =>
    ApiService.post("/languages", languageData),

  updateLanguage: (languageId: string, languageData: unknown) =>
    ApiService.put(`/languages/${languageId}`, languageData),

  deleteLanguage: (languageId: string) =>
    ApiService.delete(`/languages/${languageId}`),

  uploadLanguageImage: (file: File, languageId: string) => {
    return ApiService.upload("/images/upload/languages", file, {
      id: languageId,
    });
  },

  uploadLessonImage: (file: File, id: string) =>
    ApiService.upload("/images/upload/lesson", file, { id }),

  getLessonsByLanguage: (
    languageId: string,
    page: number = 1,
    limit: number = 100,
    stageId?: string,
  ) => {
    const params: Record<string, string | number> = {
      page,
      limit,
      orderBy: "name",
      sortOrder: "ASC",
    };
    if (stageId) {
      params.stageId = stageId;
    }
    const url = ApiService.buildUrl(
      `/lesson/by-language/${languageId}`,
      params,
    );
    return ApiService.get(url);
  },

  getLesson: (lessonId: string) => ApiService.get(`/lesson/${lessonId}`),

  createLesson: (lessonData: unknown) =>
    ApiService.post("/lesson", lessonData),

  updateLesson: (lessonId: string, lessonData: unknown) =>
    ApiService.put(`/lesson/${lessonId}`, lessonData),

  deleteLesson: (lessonId: string) => ApiService.delete(`/lesson/${lessonId}`),

  getStagesByLanguage: (
    languageId: string,
    page: number = 1,
    limit: number = 5,
  ) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl(`/stage/${languageId}`, params);
    return ApiService.get(url);
  },

  getLessonWithQuizzes: (lessonId: string) =>
    ApiService.get(`/lesson/${lessonId}/with-quizzes`),
};

export const stageApi = {
  getStages: (
    languageId: string,
    page: number = 1,
    limit: number = 10,
    orderBy: string = "name",
    sortOrder: "ASC" | "DESC" = "ASC",
  ) => {
    const params = { page, limit, orderBy, sortOrder };
    const url = ApiService.buildUrl(`/stage/${languageId}`, params);
    return ApiService.get(url);
  },

  createStage: (stageData: unknown) => ApiService.post("/stage", stageData),

  updateStage: (stageId: string, stageData: unknown) => {
    return ApiService.put(`/stage/${stageId}`, stageData);
  },

  deleteStage: (stageId: string) => ApiService.delete(`/stage/${stageId}`),
};

export const languageApi = {
  getEnrolledLanguages: async () => {
    const response = await ApiService.get("/users/enrolled-languages");
    return response;
  },

  getAvailableLanguages: async (page: number = 1, limit: number = 8) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl("/languages", params);
    const response = await ApiService.get(url);
    return response;
  },

  getAllLanguages: () => ApiService.get("/languages"),

  enrollInLanguage: (languageId: string, regionId?: string) =>
    ApiService.post("/users/enroll", { languageId, regionId }),

  getEnrolledRegions: async (
    page: number = 1,
    limit: number = 100,
    languageId?: string,
  ) => {
    const params: Record<string, string | number> = {
      page,
      limit,
      orderBy: "createdAt",
      sortOrder: "DESC",
    };
    if (languageId) {
      params.languageId = languageId;
    }
    const url = ApiService.buildUrl("/users/enrolled-regions", params);
    return ApiService.get(url);
  },

  enrollInRegion: (regionId: string) =>
    ApiService.post("/users/enroll-region", { regionId }),

  unenrollFromLanguage: (languageId: string) =>
    ApiService.delete(`/users/enrolled-languages/${languageId}`),

  unenrollFromRegion: (regionId: string) =>
    ApiService.delete(`/users/enrolled-regions/${regionId}`),
};

export const regionApi = {
  getRegions: (page: number = 1, limit: number = 100, languageId?: string) => {
    const params: Record<string, string | number> = {
      page,
      limit,
      orderBy: "name",
      sortOrder: "ASC",
    };
    if (languageId) {
      params.languageId = languageId;
    }
    const url = ApiService.buildUrl("/region", params);
    return ApiService.get(url);
  },

  getRegion: (regionId: string) => ApiService.get(`/region/${regionId}`),

  createRegion: (regionData: unknown) =>
    ApiService.post("/region", regionData),

  updateRegion: (regionId: string, regionData: unknown) =>
    ApiService.put(`/region/${regionId}`, regionData),

  deleteRegion: (regionId: string) => ApiService.delete(`/region/${regionId}`),
};

export const lessonVariantApi = {
  getLessonVariants: (lessonId: string) =>
    ApiService.get(`/lesson/${lessonId}/variants`),

  getLessonVariant: (lessonId: string, variantId: string) =>
    ApiService.get(`/lesson/${lessonId}/variants/${variantId}`),

  createLessonVariant: (lessonId: string, variantData: unknown) =>
    ApiService.post(`/lesson/${lessonId}/variants`, variantData),

  updateLessonVariant: (
    lessonId: string,
    variantId: string,
    variantData: unknown,
  ) => ApiService.put(`/lesson/${lessonId}/variants/${variantId}`, variantData),

  deleteLessonVariant: (lessonId: string, variantId: string) =>
    ApiService.delete(`/lesson/${lessonId}/variants/${variantId}`),

  getRegionalLesson: (lessonId: string, regionId?: string) => {
    const params = regionId ? { regionId } : {};
    const url = ApiService.buildUrl(`/lesson/regional/${lessonId}`, params);
    return ApiService.get(url);
  },
};

export const quizVariantApi = {
  getQuizVariants: (lessonVariantId: string) =>
    ApiService.get(`/quiz-variants/lesson-variant/${lessonVariantId}`),

  createQuizVariant: (data: {
    lessonVariantId: string;
    questions: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>;
  }) => ApiService.post("/quiz-variants", data),

  updateQuizVariant: (
    id: string,
    data: {
      lessonVariantId: string;
      questions: Array<{
        question: string;
        options: Array<{ text: string; isCorrect: boolean }>;
      }>;
    },
  ) => ApiService.put(`/quiz-variants/${id}`, data),

  deleteQuizVariant: (id: string) => ApiService.delete(`/quiz-variants/${id}`),
};

export const countryDivisionApi = {
  getCountries: () => ApiService.get("/country-division/countries"),

  getDivisions: () => ApiService.get("/country-division/divisions"),

  searchDivisions: (params: {
    countryCode?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const url = ApiService.buildUrl(
      "/country-division/divisions/search",
      params,
    );
    return ApiService.get(url);
  },

  getDivisionsByCountry: (countryCode: string) =>
    ApiService.get(`/country-division/countries/${countryCode}/divisions`),

  getCountriesWithDivisions: (name: string) => {
    const url = ApiService.buildUrl("/region/countries-with-divisions", {
      name,
    });
    return ApiService.get(url);
  },
};

export interface ModeratorPaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  sortOrder?: "ASC" | "DESC";
  languageId?: string;
  regionId?: string;
}

export const moderatorApi = {
  listModerators: (params?: ModeratorPaginationParams) => {
    const url = ApiService.buildUrl("/admin/moderators", params || {});
    return ApiService.get(url);
  },

  searchUsers: (query: string) => {
    const url = ApiService.buildUrl("/admin/moderators/users/search", {
      q: query,
    });
    return ApiService.get(url);
  },

  assignPermission: (data: {
    userId: string;
    scope: "language" | "region";
    targetId: string;
  }) => ApiService.post("/admin/moderators", data),

  revokePermission: (permissionId: string) =>
    ApiService.delete(`/admin/moderators/${permissionId}`),
};

export const signRecordApi = {
  saveLandmarks: (data: SaveLandmarksPayload) =>
    ApiService.post<{ id: string }>("/sign-record/landmarks", data),

  triggerCustomTraining: (filters: CustomTrainingFilters) =>
    ApiService.post<{
      jobId?: string;
      jobs?: Array<{ jobId?: string; modelType?: SignDetectionType }>;
      message?: string;
    }>("/sign-record/train/custom", filters),

  getLessonSigns: (lessonId: string, regionId?: string) => {
    const url = ApiService.buildUrl(`/sign-record/lesson/${lessonId}/signs`, {
      ...(regionId && regionId !== "global" ? { regionId } : {}),
    });
    return ApiService.get<PaginatedSignsDto | SignDto[]>(url);
  },

  getGlobalSigns: (regionId?: string) => {
    const url = ApiService.buildUrl(`/sign-record/global`, {
      ...(regionId && regionId !== "global" ? { regionId } : {}),
    });
    return ApiService.get<SignDto[]>(url);
  },

  getSignRecordings: (signId: string, regionId?: string) => {
    const url = ApiService.buildUrl(`/sign-record/sign/${signId}/recordings`, {
      ...(regionId && regionId !== "global" ? { regionId } : {}),
    });
    return ApiService.get<SignRecordingDto[]>(url);
  },

  deleteRecording: (id: string) =>
    ApiService.delete<void>(`/sign-record/recording/${id}`),

  createSign: (
    name: string,
    languageId: string,
    lessonId?: string,
    isGlobal: boolean = false,
    detectionType: SignDetectionType = "static",
  ) =>
    ApiService.post<SignDto>("/sign-record/sign", {
      name,
      languageId,
      lessonId,
      isGlobal,
      detectionType,
    }),

  createSignsBulk: (
    languageId: string,
    lessonId: string,
    signs: { name: string; detectionType?: SignDetectionType }[],
  ) =>
    ApiService.post<BulkCreateSignsResultDto>("/sign-record/signs", {
      languageId,
      lessonId,
      signs,
    }),

  updateSign: (
    id: string,
    name: string,
    detectionType?: SignDetectionType,
  ) =>
    ApiService.patch<SignDto>(`/sign-record/sign/${id}`, {
      name,
      detectionType,
    }),

  deleteSign: (id: string) =>
    ApiService.delete<void>(`/sign-record/sign/${id}`),

  getLessonModel: (lessonId: string, regionId?: string) => {
    const url = ApiService.buildUrl(`/sign-record/lesson/${lessonId}/model`, {
      ...(regionId && regionId !== "global" ? { regionId } : {}),
    });
    return ApiService.get<LessonModelsBundleDto>(url);
  },

  getModels: () => ApiService.get<LessonModelDto[]>(`/sign-record/models`),

  deleteModel: (id: string) =>
    ApiService.delete<void>(`/sign-record/model/${id}`),
};

export default ApiService;
