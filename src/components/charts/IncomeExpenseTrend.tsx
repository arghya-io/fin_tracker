import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";

interface IncomeExpenseTrendProps {
  data: { month: string; income: number; expense: number }[];
}

export function IncomeExpenseTrend({ data }: IncomeExpenseTrendProps) {
  const { format } = useCurrency();

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 16%)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={false}
          content={({ active, payload, label }) => {
            if (!active || !payload) return null;
            return (
              <div className="chart-tooltip px-3 py-2 text-xs">
                <p className="font-medium text-white mb-1">{label}</p>
                {payload.map((p, i) => (
                  <p key={i} style={{ color: p.color }}>
                    {p.name}: {format(p.value as number)}
                  </p>
                ))}
              </div>
            );
          }}
        />
        <Bar
          dataKey="income"
          fill="hsl(142, 71%, 45%)"
          radius={[4, 4, 0, 0]}
          name="Income"
          activeBar={{ fill: "hsl(142, 71%, 45%)", opacity: 1, radius: 4 }}
        />
        <Bar
          dataKey="expense"
          fill="hsl(0, 72%, 51%)"
          radius={[4, 4, 0, 0]}
          name="Expense"
          activeBar={{ fill: "hsl(0, 72%, 51%)", opacity: 1, radius: 4 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
