import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "income" | "expense" | "receivable" | "payable";
  subtitle?: string;
  loading?: boolean;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  subtitle,
  loading,
  onClick,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </div>
    );
  }

  const iconColors: Record<string, string> = {
    default: "text-primary bg-primary/10",
    income: "text-success bg-success/10",
    expense: "text-destructive bg-destructive/10",
    receivable: "text-warning bg-warning/15",
    payable: "text-warning bg-warning/15",
  };

  const valueColors: Record<string, string> = {
    default: "text-foreground",
    income: "text-[#22c55e]",
    expense: "text-[#ef4444]",
    receivable: "text-[#f59e0b]",
    payable: "text-[#f59e0b]",
  };

  return (
    <div
      className={`glass-card p-5 animate-fade-in ${onClick ? "cursor-pointer hover:border-primary/30 transition-colors" : ""}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={`p-2 rounded-lg ${iconColors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className={`text-2xl font-bold stat-amount ${valueColors[variant]}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 ${trend.value >= 0 ? "text-success" : "text-destructive"}`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  );
}
