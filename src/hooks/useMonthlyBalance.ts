import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { useEffect } from "react";

export function useMonthlyBalance(transactions: { type: string; amount: number; date: string }[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const now = new Date();
  const prevMonthKey = format(subMonths(now, 1), "yyyy-MM");

  const carryQuery = useQuery({
    queryKey: ["monthly_balances", user?.id, prevMonthKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("monthly_balances")
        .select("*")
        .eq("month", prevMonthKey)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user || carryQuery.isLoading || carryQuery.data) return;

    const prevMonth = subMonths(now, 1);
    const end = endOfMonth(prevMonth);

    const allUpToPrevMonth = transactions.filter((t) => parseISO(t.date) <= end);
    if (allUpToPrevMonth.length === 0) return;

    const totalIncome = allUpToPrevMonth
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense = allUpToPrevMonth
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    const closingBalance = totalIncome - totalExpense;

    supabase
      .from("monthly_balances")
      .upsert(
        { user_id: user.id, month: prevMonthKey, closing_balance: closingBalance },
        { onConflict: "user_id,month" }
      )
      .then(({ error }) => {
        if (!error) queryClient.invalidateQueries({ queryKey: ["monthly_balances"] });
      });
  }, [user, carryQuery.isLoading, carryQuery.data, transactions.length]);

  const carryForward = carryQuery.data ? Number(carryQuery.data.closing_balance) : 0;

  return { carryForward, isLoading: carryQuery.isLoading };
}
