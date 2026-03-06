import type { GiteaUser } from "@/types/gitea";
import { request } from "@/utils/request";

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export const giteaAuthApi = {
  verifyToken: (baseUrl: string, token: string) =>
    request.post<ApiResponse<GiteaUser>>("/verify", null, {
      headers: {
        "X-Gitea-Base-Url": baseUrl,
        "X-Gitea-Token": token,
      },
    }).then(res => res.data),
};
