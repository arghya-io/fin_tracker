import { useState, useMemo, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTransactions } from "@/hooks/useTransactions";
import { useDebts } from "@/hooks/useDebts";
import { useMonthlyBalance } from "@/hooks/useMonthlyBalance";
import { useCurrency } from "@/contexts/CurrencyContext";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { TransactionModal } from "@/components/TransactionModal";
import { ExpenseDonut } from "@/components/charts/ExpenseDonut";
import { IncomeExpenseTrend } from "@/components/charts/IncomeExpenseTrend";
import { DailySpendingChart } from "@/components/charts/DailySpendingChart";
import { getCategoryByValue } from "@/lib/categoryConfig";
import { format, subMonths, startOfMonth, endOfMonth, parseISO, isWithinInterval } from "date-fns";
import { Wallet, TrendingUp, TrendingDown, HandCoins, Landmark, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const { transactions, isLoading, addTransaction } = useTransactions();
  const { totalReceivable, totalPayable } = useDebts();
  const { format: formatCurr } = useCurrency();
  const { carryForward } = useMonthlyBalance(transactions);
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const handler = () => setShowAdd(true);
    window.addEventListener("floating-add-click", handler);
    return () => window.removeEventListener("floating-add-click", handler);
  }, []);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);

  const thisMonth = useMemo(
    () =>
      transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), { start: thisMonthStart, end: thisMonthEnd })
      ),
    [transactions, thisMonthStart, thisMonthEnd]
  );

  const totalIncome = useMemo(
    () => thisMonth.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
    [thisMonth]
  );
  const totalExpense = useMemo(
    () => thisMonth.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
    [thisMonth]
  );
  const balance = carryForward + totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth
      .filter((t) => t.type === "expense")
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + Number(t.amount); });
    return Object.entries(map)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [thisMonth]);

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(now, 5 - i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      const monthTxns = transactions.filter((t) =>
        isWithinInterval(parseISO(t.date), { start, end })
      );
      return {
        month: format(date, "MMM"),
        income: monthTxns.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0),
        expense: monthTxns.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0),
      };
    });
  }, [transactions]);

  const dailySpending = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = format(parseISO(t.date), "dd");
        map[day] = (map[day] || 0) + Number(t.amount);
      });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, amount]) => ({ day, amount }));
  }, [thisMonth]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-foreground">FinTrack</h1>
        <Link to="/settings">
          <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <Separator className="bg-border" />

      <div>
        <h2 className="font-heading font-semibold text-lg">Dashboard</h2>
        <p className="text-sm text-muted-foreground">{format(now, "MMMM yyyy")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Balance"
          value={formatCurr(balance)}
          icon={Wallet}
          loading={isLoading}
          subtitle={carryForward !== 0 ? `↩ Carried: ${formatCurr(carryForward)}` : undefined}
        />
        <StatCard title="Income" value={formatCurr(totalIncome)} icon={TrendingUp} variant="income" loading={isLoading} />
        <StatCard title="Expenses" value={formatCurr(totalExpense)} icon={TrendingDown} variant="expense" loading={isLoading} />
        <StatCard
          title="Receivable"
          value={formatCurr(totalReceivable)}
          icon={HandCoins}
          variant="receivable"
          loading={isLoading}
          onClick={() => navigate("/debt?type=receivable")}
        />
        <StatCard
          title="Payable"
          value={formatCurr(totalPayable)}
          icon={Landmark}
          variant="payable"
          loading={isLoading}
          onClick={() => navigate("/debt?type=payable")}
        />
      </div>

      {transactions.length === 0 && !isLoading ? (
        <EmptyState
          title="No transactions yet"
          description="Start tracking your finances by adding your first transaction."
          actionLabel="Add Transaction"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold mb-4">Expense Breakdown</h3>
            {expenseByCategory.length > 0 ? (
              <ExpenseDonut data={expenseByCategory} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No expenses this month</p>
            )}
          </div>

          <div className="glass-card p-5">
            <h3 className="font-heading font-semibold mb-4">6-Month Trend</h3>
            <IncomeExpenseTrend data={trendData} />
          </div>

          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-heading font-semibold mb-4">Daily Spending</h3>
            {dailySpending.length > 0 ? (
              <DailySpendingChart data={dailySpending} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No spending data this month</p>
            )}
          </div>

          <div className="glass-card p-5 lg:col-span-2">
            <h3 className="font-heading font-semibold mb-4">Recent Transactions</h3>
            <div className="space-y-2">
              {thisMonth.slice(0, 6).map((t) => {
                const cat = getCategoryByValue(t.category);
                return (
                  <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{cat?.emoji || "📝"}</span>
                      <div>
                        <p className="text-sm font-medium">{t.custom_category || cat?.label || t.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.description || format(parseISO(t.date), "MMM dd")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}
                    >
                      {t.type === "income" ? "+" : "-"}{formatCurr(Number(t.amount))}
                    </span>
                  </div>
                );
              })}
              {thisMonth.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions this month</p>
              )}
            </div>
          </div>
        </div>
      )}

      <TransactionModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={(data) => addTransaction.mutate(data)}
        loading={addTransaction.isPending}
      />
    </div>
  );
}
