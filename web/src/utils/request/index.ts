import type { AxiosRequestConfig, AxiosResponse } from "axios";
import axios from "axios";
import { toast } from "sonner";

import { useGiteaStore } from "@/stores/gitea";

const instance = axios.create({
  timeout: 30000,
  baseURL: "/gitea-api/v1",
});

instance.interceptors.request.use((config) => {
  const { baseUrl, token } = useGiteaStore.getState();
  if (baseUrl) {
    config.headers["X-Gitea-Base-Url"] = baseUrl;
  }
  if (token) {
    config.headers.Authorization = `token ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  response => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.code === "ECONNABORTED") {
      toast.error("请求超时");
      return Promise.reject(new Error("请求超时"));
    }

    const status = error.response?.status;
    if (status === 401) {
      toast.error("Token 无效", { description: "请检查你的 Gitea 访问令牌" });
    }
    else if (status === 403) {
      toast.error("无权限", { description: "你没有权限访问此资源" });
    }
    else {
      const msg = error.response?.data?.message || error.message || "请求失败";
      toast.error("请求失败", { description: msg });
    }

    return Promise.reject(error);
  },
);

export function request<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return instance<T>(url, config);
}

request.get = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  instance.get<T>(url, config).then(res => res.data);

request.post = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  instance.post<T>(url, data, config).then(res => res.data);

request.put = <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> =>
  instance.put<T>(url, data, config).then(res => res.data);

request.delete = <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  instance.delete<T>(url, config).then(res => res.data);

request.raw = instance;
