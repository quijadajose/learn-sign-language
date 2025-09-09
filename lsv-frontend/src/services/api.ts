import { BACKEND_BASE_URL } from "../config";

export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success: boolean;
  status?: number;
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

  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private static async handleResponse<T>(
    response: Response,
  ): Promise<ApiResponse<T>> {
    try {
      const contentType = response.headers.get("content-type");
      let data: any;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        return {
          data,
          message: data?.message || "Operación exitosa",
          success: true,
          status: response.status,
        };
      } else {
        return {
          message:
            data?.message ||
            data ||
            "Ha ocurrido un error al procesar tu solicitud",
          success: false,
          status: response.status,
        };
      }
    } catch (error) {
      return {
        message: "Ha ocurrido un error inesperado",
        success: false,
        status: response.status,
      };
    }
  }

  private static async makeRequest<T = any>(
    endpoint: string,
    method: string,
    body?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    const {
      headers = {},
      timeout = this.defaultTimeout,
      retries = this.defaultRetries,
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    const requestHeaders = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...headers,
    };

    const requestConfig: RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && !(body instanceof FormData)) {
      requestConfig.body = JSON.stringify(body);
    } else if (body instanceof FormData) {
      requestConfig.body = body;
      delete (requestHeaders as any)["Content-Type"];
    }

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          ...requestConfig,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return await this.handleResponse<T>(response);
      } catch (error) {
        if (attempt === retries) {
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

  static async get<T = any>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "GET", undefined, config);
  }

  static async post<T = any>(
    endpoint: string,
    body?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "POST", body, config);
  }

  static async put<T = any>(
    endpoint: string,
    body?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "PUT", body, config);
  }

  static async patch<T = any>(
    endpoint: string,
    body?: any,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "PATCH", body, config);
  }

  static async delete<T = any>(
    endpoint: string,
    config: RequestConfig = {},
  ): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, "DELETE", undefined, config);
  }

  static async upload<T = any>(
    endpoint: string,
    file: File,
    additionalData: Record<string, any> = {},
    config: UploadConfig = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append("file", file);

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    console.log("Upload request data:", {
      endpoint,
      additionalData,
      fileName: file.name,
    });

    const { onProgress, ...requestConfig } = config;

    return this.makeRequest<T>(endpoint, "POST", formData, {
      ...requestConfig,
      headers: {
        ...requestConfig.headers,
      },
    });
  }

  static buildUrl(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(endpoint, this.baseURL);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
    return url.pathname + url.search;
  }
}

export const authApi = {
  resetPassword: (email: string) =>
    ApiService.post("/auth/password/reset", { email }),

  confirmPasswordReset: (newPassword: string, token: string) =>
    ApiService.post("/auth/password/reset/confirm", { newPassword, token }),

  login: (email: string, password: string) =>
    ApiService.post("/auth/login", { email, password }),

  register: (userData: any) => ApiService.post("/auth/register", userData),
};

export const userApi = {
  getProfile: () => ApiService.get("/user/profile"),

  getMe: () => ApiService.get("/users/me"),

  updateProfile: (userData: any) => ApiService.put("/user/profile", userData),

  updateMe: (userData: any) => ApiService.put("/users/me", userData),

  changePassword: (passwordData: any) =>
    ApiService.put("/user/change-password", passwordData),

  uploadUserImage: (file: File, userId: string) =>
    ApiService.upload("/images/upload/user", file, {
      id: userId,
      format: "png",
    }),
};

export const lessonApi = {
  getLessons: () => ApiService.get("/lessons"),

  getLesson: (id: string) => ApiService.get(`/lessons/${id}`),

  getUserLesson: (lessonId: string) =>
    ApiService.get(`/users/lesson/${lessonId}`),

  startLesson: (lessonId: string) =>
    ApiService.post("/user-lesson/start", { lessonId }),

  setLessonCompletion: (lessonId: string, isComplete: boolean) =>
    ApiService.post("/user-lesson/set-lesson-completion", {
      lessonId,
      isComplete,
    }),

  updateProgress: (lessonId: string, progress: any) =>
    ApiService.put(`/lessons/${lessonId}/progress`, progress),

  getStagesProgress: (languageId: string) =>
    ApiService.get(`/users/stages-progress/${languageId}`),

  getLessonsWithSubmissions: (
    languageId: string,
    stageId: string,
    page: number = 1,
    limit: number = 100,
  ) => {
    const params = {
      stageId,
      page: page.toString(),
      limit: limit.toString(),
      orderBy: "name",
      sortOrder: "ASC",
    };
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
  getQuizByLesson: (lessonId: string) =>
    ApiService.get(`/lesson/${lessonId}/quizzes`),

  getQuizForAdmin: (quizId: string) => ApiService.get(`/quiz/admin/${quizId}`),

  submitQuiz: (quizId: string, answers: any[]) =>
    ApiService.post(`/quiz/${quizId}/submissions`, { answers }),

  createQuiz: (quizData: any) => ApiService.post("/quiz", quizData),

  updateQuiz: (quizId: string, quizData: any) =>
    ApiService.put(`/quiz/${quizId}`, quizData),

  deleteQuiz: (quizId: string) => ApiService.delete(`/quiz/${quizId}`),

  uploadQuizImage: (file: File, id: string, format: string = "png") =>
    ApiService.upload("/images/upload/quiz", file, { id, format }),
};

export const adminApi = {
  getLanguages: (page: number = 1, limit: number = 100) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl("/languages", params);
    return ApiService.get(url);
  },

  getLanguage: (languageId: string) =>
    ApiService.get(`/languages/${languageId}`),

  createLanguage: (languageData: any) =>
    ApiService.post("/languages", languageData),

  uploadLanguageImage: (file: File, languageId: string) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const validFormats = ["png", "jpeg", "jpg", "webp"];
    const format = validFormats.includes(fileExtension || "")
      ? fileExtension!
      : "png";

    return ApiService.upload("/images/upload/languages", file, {
      id: languageId,
      format: format,
    });
  },

  uploadLessonImage: (file: File) =>
    ApiService.upload("/images/upload/lesson", file),

  getLessonsByLanguage: (
    languageId: string,
    page: number = 1,
    limit: number = 100,
  ) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl(
      `/lesson/by-language/${languageId}`,
      params,
    );
    return ApiService.get(url);
  },

  getLesson: (lessonId: string) => ApiService.get(`/lesson/${lessonId}`),

  createLesson: (lessonData: any) => ApiService.post("/lesson", lessonData),

  updateLesson: (lessonId: string, lessonData: any) =>
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

  createStage: (stageData: any) => ApiService.post("/stage", stageData),

  updateStage: (stageId: string, stageData: any) => {
    console.log("Updating stage with ID:", stageId, "Data:", stageData);
    return ApiService.put(`/stage/${stageId}`, stageData);
  },

  deleteStage: (stageId: string) => ApiService.delete(`/stage/${stageId}`),
};

export const languageApi = {
  getEnrolledLanguages: async () => {
    console.log("API CALL: getEnrolledLanguages");
    const response = await ApiService.get("/users/enrolled-languages");
    console.log("API RESPONSE: getEnrolledLanguages", response);
    return response;
  },

  getAvailableLanguages: async (page: number = 1, limit: number = 8) => {
    const params = { page, limit, orderBy: "name", sortOrder: "ASC" };
    const url = ApiService.buildUrl("/languages", params);
    console.log("API CALL: getAvailableLanguages with URL:", url);
    const response = await ApiService.get(url);
    console.log("API RESPONSE: getAvailableLanguages", response);
    return response;
  },

  getAllLanguages: () => ApiService.get("/languages"),

  enrollInLanguage: (languageId: string) =>
    ApiService.post("/users/enroll", { languageId }),
};

export default ApiService;
