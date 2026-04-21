import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

interface DailySpendingChartProps {
  data: { day: string; amount: number }[];
}

export function DailySpendingChart({ data }: DailySpendingChartProps) {
  const { format } = useCurrency();

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 16%)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={false}
          content={({ active, payload, label }) => {
            if (!active || !payload?.[0]) return null;
            return (
              <div className="chart-tooltip px-3 py-2 text-xs">
                <p className="font-medium text-white">{label}</p>
                <p className="text-white/70">{format(payload[0].value as number)}</p>
              </div>
            );
          }}
        />
        <Bar
          dataKey="amount"
          fill="hsl(245, 58%, 63%)"
          radius={[3, 3, 0, 0]}
          activeBar={{ fill: "hsl(245, 58%, 63%)", opacity: 1, radius: 3 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
