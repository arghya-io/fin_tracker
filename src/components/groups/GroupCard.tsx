import { useNavigate } from "react-router-dom";
import { Group, GroupMember, GROUP_TYPES } from "@/hooks/useGroups";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { formatCurrency, CurrencyCode } from "@/lib/formatCurrency";
import { Badge } from "@/components/ui/badge";

interface GroupCardProps {
  group: Group;
  members: GroupMember[];
}

export function GroupCard({ group, members }: GroupCardProps) {
  const navigate = useNavigate();
  const { yourNetBalance, isLoading } = useGroupExpenses(group.id, members);
  const typeInfo = GROUP_TYPES.find((t) => t.value === group.group_type);
  const format = (n: number) => formatCurrency(Math.abs(n), group.currency as CurrencyCode);

  return (
    <button onClick={() => navigate(`/split/${group.id}`)} className="glass-card p-4 w-full text-left hover:bg-secondary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{typeInfo?.emoji ?? "📁"}</span>
            <span className="font-semibold truncate">{group.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""} · {typeInfo?.label ?? "Group"}
          </p>
        </div>
        <div className="text-right shrink-0">
          {!isLoading && (
            Math.abs(yourNetBalance) < 0.01 ? (
              <Badge variant="outline" className="border-border text-muted-foreground">Settled up</Badge>
            ) : yourNetBalance > 0 ? (
              <div>
                <p className="text-xs text-muted-foreground">you are owed</p>
                <p className="font-bold text-success">{format(yourNetBalance)}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs text-muted-foreground">you owe</p>
                <p className="font-bold text-destructive">{format(yourNetBalance)}</p>
              </div>
            )
          )}
        </div>
      </div>
    </button>
  );
}
