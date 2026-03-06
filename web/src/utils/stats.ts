import type { GiteaCommit, GiteaPullRequest } from "@/types/gitea";

export type Granularity = "day" | "week" | "month";

interface DateCount {
  date: string;
  count: number;
}

export interface AuthorStat {
  name: string;
  login: string;
  email: string;
  avatarUrl: string;
  count: number;
  additions: number;
  deletions: number;
}

function toDateKey(dateStr: string, granularity: Granularity): string {
  const d = new Date(dateStr);
  if (granularity === "day") {
    return d.toISOString().slice(0, 10);
  }
  if (granularity === "week") {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return monday.toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 7);
}

export function groupCommitsByDate(
  commits: GiteaCommit[],
  granularity: Granularity = "day",
): DateCount[] {
  const map = new Map<string, number>();
  for (const c of commits) {
    const key = toDateKey(c.commit.committer.date, granularity);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function groupCommitsByAuthor(commits: GiteaCommit[]): AuthorStat[] {
  const map = new Map<string, AuthorStat>();
  for (const c of commits) {
    const email = c.commit.author.email;
    const existing = map.get(email);
    if (existing) {
      existing.count++;
      existing.additions += c.stats?.additions ?? 0;
      existing.deletions += c.stats?.deletions ?? 0;
    }
    else {
      map.set(email, {
        name: c.commit.author.name,
        login: c.author?.login ?? "",
        email,
        avatarUrl: c.author?.avatar_url ?? "",
        count: 1,
        additions: c.stats?.additions ?? 0,
        deletions: c.stats?.deletions ?? 0,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

export function calculatePRMergeTime(prs: GiteaPullRequest[]): {
  average: number;
  median: number;
} {
  const times = prs
    .filter(pr => pr.merged && pr.merged_at)
    .map((pr) => {
      const created = new Date(pr.created_at).getTime();
      const merged = new Date(pr.merged_at!).getTime();
      return (merged - created) / (1000 * 60 * 60);
    })
    .sort((a, b) => a - b);

  if (times.length === 0) return { average: 0, median: 0 };

  const average = times.reduce((s, t) => s + t, 0) / times.length;
  const mid = Math.floor(times.length / 2);
  const median = times.length % 2 === 0
    ? (times[mid - 1] + times[mid]) / 2
    : times[mid];

  return { average, median };
}

export function groupPRsByStatus(prs: GiteaPullRequest[]): {
  open: number;
  merged: number;
  closed: number;
} {
  let open = 0;
  let merged = 0;
  let closed = 0;
  for (const pr of prs) {
    if (pr.merged) merged++;
    else if (pr.state === "open") open++;
    else closed++;
  }
  return { open, merged, closed };
}

export function groupCodeChangesByDate(
  commits: GiteaCommit[],
  granularity: Granularity = "day",
): { date: string; additions: number; deletions: number }[] {
  const map = new Map<string, { additions: number; deletions: number }>();
  for (const c of commits) {
    const key = toDateKey(c.commit.committer.date, granularity);
    const existing = map.get(key);
    const additions = c.stats?.additions ?? 0;
    const deletions = c.stats?.deletions ?? 0;
    if (existing) {
      existing.additions += additions;
      existing.deletions += deletions;
    }
    else {
      map.set(key, { additions, deletions });
    }
  }
  return Array.from(map.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getCommitSizeDistribution(
  commits: GiteaCommit[],
): { size: string; count: number }[] {
  const buckets: Record<string, number> = { S: 0, M: 0, L: 0, XL: 0, Empty: 0 };
  for (const c of commits) {
    const total = c.stats?.total ?? 0;
    if (total === 0) buckets.Empty++;
    else if (total <= 10) buckets.S++;
    else if (total <= 100) buckets.M++;
    else if (total <= 500) buckets.L++;
    else buckets.XL++;
  }
  return Object.entries(buckets).map(([size, count]) => ({ size, count }));
}

const COMMIT_TYPE_REGEX = /^(\w+)(?:\(.+?\))?!?:/;
const KNOWN_TYPES = new Set(["feat", "fix", "refactor", "docs", "chore", "style", "test", "ci"]);

export function getCommitTypeDistribution(
  commits: GiteaCommit[],
): { type: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of commits) {
    const match = c.commit.message.match(COMMIT_TYPE_REGEX);
    const type = match && KNOWN_TYPES.has(match[1]) ? match[1] : "other";
    map.set(type, (map.get(type) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

export function getCumulativeCommits(
  commits: GiteaCommit[],
  granularity: Granularity = "day",
): { date: string; total: number }[] {
  const daily = groupCommitsByDate(commits, granularity);
  let cumulative = 0;
  return daily.map(({ date, count }) => {
    cumulative += count;
    return { date, total: cumulative };
  });
}

export function getCommitHeatmapData(commits: GiteaCommit[]): { day: number; hour: number; count: number }[] {
  const map = new Map<string, number>();
  for (const c of commits) {
    const d = new Date(c.commit.committer.date);
    const key = `${d.getDay()}-${d.getHours()}`;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });
}
