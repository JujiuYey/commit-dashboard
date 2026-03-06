import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { GiteaUser, RepoIdentifier } from "@/types/gitea";

interface GiteaState {
  baseUrl: string;
  token: string;
  currentUser: GiteaUser | null;
  selectedRepos: RepoIdentifier[];
  setConnection: (baseUrl: string, token: string, user: GiteaUser) => void;
  setCurrentUser: (user: GiteaUser) => void;
  addRepo: (repo: RepoIdentifier) => void;
  removeRepo: (repo: RepoIdentifier) => void;
  setSelectedRepos: (repos: RepoIdentifier[]) => void;
  clearConnection: () => void;
  isConnected: () => boolean;
}

export const useGiteaStore = create<GiteaState>()(
  persist(
    (set, get) => ({
      baseUrl: "",
      token: "",
      currentUser: null,
      selectedRepos: [],
      setConnection: (baseUrl, token, user) =>
        set({ baseUrl: baseUrl.replace(/\/+$/, ""), token, currentUser: user }),
      setCurrentUser: user => set({ currentUser: user }),
      addRepo: (repo) =>
        set(state => ({
          selectedRepos: state.selectedRepos.some(
            r => r.owner === repo.owner && r.repo === repo.repo,
          )
            ? state.selectedRepos
            : [...state.selectedRepos, repo],
        })),
      removeRepo: (repo) =>
        set(state => ({
          selectedRepos: state.selectedRepos.filter(
            r => !(r.owner === repo.owner && r.repo === repo.repo),
          ),
        })),
      setSelectedRepos: repos => set({ selectedRepos: repos }),
      clearConnection: () =>
        set({ baseUrl: "", token: "", currentUser: null, selectedRepos: [] }),
      isConnected: () => {
        const { baseUrl, token, currentUser } = get();
        return !!baseUrl && !!token && !!currentUser;
      },
    }),
    {
      name: "gitea-storage",
    },
  ),
);
