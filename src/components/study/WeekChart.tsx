import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { useI18n } from "@/lib/i18n/provider";

export function WeekChart({
  data,
  goalMs,
}: {
  data: { label: string; key: string; total: number }[];
  goalMs?: number;
}) {
  const { t, formatDur } = useI18n();
  if (!data.some((d) => d.total > 0)) {
    return (
      <div className="flex h-52 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        {t("chart.empty")}
      </div>
    );
  }

  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <Tooltip
            cursor={{ fill: "var(--accent)", opacity: 0.4 }}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
            formatter={(value: number) => [formatDur(value), t("chart.studied")]}
          />
          <Bar dataKey="total" radius={[6, 6, 4, 4]} maxBarSize={44}>
            {data.map((entry) => (
              <Cell
                key={entry.key}
                fill={
                  goalMs && entry.total >= goalMs ? "var(--success)" : "var(--primary)"
                }
                opacity={entry.total ? 1 : 0.25}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
