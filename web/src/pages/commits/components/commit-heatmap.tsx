import * as React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const DAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

interface HeatmapCell {
  day: number;
  hour: number;
  count: number;
}

interface CommitHeatmapProps {
  data: HeatmapCell[];
}

export function CommitHeatmap({ data }: CommitHeatmapProps) {
  const maxHeat = Math.max(1, ...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>活跃热力图</CardTitle>
        <CardDescription>按星期和小时统计的提交分布</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `auto repeat(24, 1fr)` }}
          >
            <div />
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="text-xs text-muted-foreground text-center">
                {h}
              </div>
            ))}
            {DAYS.map((day, dayIdx) => (
              <React.Fragment key={day}>
                <div className="text-xs text-muted-foreground pr-2 flex items-center">
                  {day}
                </div>
                {Array.from({ length: 24 }, (_, h) => {
                  const cell = data.find((d) => d.day === dayIdx && d.hour === h);
                  const count = cell?.count ?? 0;
                  const opacity = count / maxHeat;
                  return (
                    <div
                      key={h}
                      className="aspect-square rounded-sm"
                      style={{
                        backgroundColor:
                          count > 0
                            ? `oklch(0.65 0.2 145 / ${0.15 + opacity * 0.85})`
                            : "var(--muted)",
                      }}
                      title={`${day} ${h}:00 - ${count} 次提交`}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
