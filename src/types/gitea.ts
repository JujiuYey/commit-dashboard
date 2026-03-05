export interface GiteaUser {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  created: string;
}

export interface GiteaRepository {
  id: number;
  owner: GiteaUser;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
  stars_count: number;
  forks_count: number;
  open_issues_count: number;
  open_pr_counter: number;
  created_at: string;
  updated_at: string;
  language: string;
  size: number;
}

export interface GiteaCommit {
  sha: string;
  url: string;
  html_url: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: GiteaUser | null;
  committer: GiteaUser | null;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

export interface GiteaPullRequest {
  id: number;
  number: number;
  title: string;
  body: string;
  state: "open" | "closed";
  html_url: string;
  user: GiteaUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merged: boolean;
  labels: { id: number; name: string; color: string }[];
  base: { label: string; ref: string };
  head: { label: string; ref: string };
}

export interface GiteaContributor {
  id: number;
  login: string;
  full_name: string;
  email: string;
  avatar_url: string;
  contributions: number;
}

export interface RepoIdentifier {
  owner: string;
  repo: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}
