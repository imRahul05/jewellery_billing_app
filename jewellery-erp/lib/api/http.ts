import axios, { AxiosError, AxiosResponse } from "axios";

export interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: {
    count?: number;
  };
}

/**
 * Centralized, strictly typed Axios client instance.
 * All client-side requests to `/api/v1/...` route handlers flow through here.
 */
export const http = axios.create({
  baseURL: "/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // forward auth session cookies automatically
});

// Response interceptor to format success and handle unified error envelope
http.interceptors.response.use(
  <T>(response: AxiosResponse<ApiResponse<T>>): AxiosResponse<ApiResponse<T>> => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>): Promise<never> => {
    let errorMessage = "An unexpected error occurred.";
    if (error.response?.data && typeof error.response.data === "object") {
      const responseData = error.response.data;
      if (responseData.error) {
        errorMessage = responseData.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return Promise.reject(new Error(errorMessage));
  },
);

/**
 * Type-safe HTTP request wrappers
 */
export const api = {
  async get<T>(url: string, params?: Record<string, string | number | boolean | undefined>): Promise<ApiResponse<T>> {
    const response = await http.get<ApiResponse<T>>(url, { params });
    return response.data;
  },

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await http.post<ApiResponse<T>>(url, data);
    return response.data;
  },

  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await http.patch<ApiResponse<T>>(url, data);
    return response.data;
  },

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await http.put<ApiResponse<T>>(url, data);
    return response.data;
  },

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await http.delete<ApiResponse<T>>(url);
    return response.data;
  },
};
