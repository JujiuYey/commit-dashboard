import type { GiteaUser } from "@/types/gitea";
import { request } from "@/utils/request";

export const giteaAuthApi = {
  verifyToken: () =>
    request.get<GiteaUser>("/user"),
};
