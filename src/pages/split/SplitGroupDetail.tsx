import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useGroups, GROUP_TYPES } from "@/hooks/useGroups";
import { useGroupExpenses } from "@/hooks/useGroupExpenses";
import { formatCurrency, CurrencyCode } from "@/lib/formatCurrency";
import { getCategoryByValue } from "@/lib/categoryConfig";
import { memberDisplayName } from "@/lib/memberDisplay";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AddGroupExpenseModal } from "@/components/groups/AddGroupExpenseModal";
import { SettleUpModal } from "@/components/groups/SettleUpModal";
import { GroupSettingsModal } from "@/components/groups/GroupSettingsModal";
import { UpiSetupBanner } from "@/components/groups/UpiSetupBanner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Plus, ArrowRightLeft, Trash2, Receipt, Scale, Settings as SettingsIcon } from "lucide-react";

export default function SplitGroupDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { groups, members: allMembers, deleteGroup, removeMember, addMember } = useGroups();
  const group = groups.find((g) => g.id === id);
  const members = allMembers.filter((m) => m.group_id === id);
  const isAdmin = !!group && group.user_id === user?.id;

  const {
    expenses,
    isLoading,
    balances,
    simplifiedTransfers,
    yourNetBalance,
    addExpense,
    deleteExpense,
    settleUp,
  } = useGroupExpenses(id, members);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [settleData, setSettleData] = useState<{ from?: string; to?: string; amount?: number } | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const format$ = (n: number) => formatCurrency(n, (group?.currency ?? "INR") as CurrencyCode);
  const memberName = (id: string) => memberDisplayName(members.find((m) => m.id === id), user?.id);

  const typeInfo = useMemo(() => GROUP_TYPES.find((t) => t.value === group?.group_type), [group]);

  if (!group) {
    return (
      <EmptyState title="Group not found" description="This group may have been deleted." actionLabel="Back to Groups" onAction={() => navigate("/split")} />
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={() => navigate("/split")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-heading font-bold text-2xl flex-1 truncate">
          {typeInfo?.emoji} {group.name}
        </h1>
        <Button size="icon" variant="ghost" onClick={() => setShowSettings(true)} aria-label="Group settings">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Balance summary */}
      <UpiSetupBanner />
      <div className="glass-card p-4">
        {Math.abs(yourNetBalance) < 0.01 ? (
          <p className="font-semibold text-center py-1">You're all settled up 🎉</p>
        ) : yourNetBalance > 0 ? (
          <p className="font-semibold text-center py-1">
            Overall, you are owed <span className="text-success">{format$(yourNetBalance)}</span>
          </p>
        ) : (
          <p className="font-semibold text-center py-1">
            Overall, you owe <span className="text-destructive">{format$(Math.abs(yourNetBalance))}</span>
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowAddExpense(true)} className="flex-1 gap-1">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-1 border-primary text-primary" onClick={() => setSettleData({})}>
          <ArrowRightLeft className="h-4 w-4" /> Settle Up
        </Button>
      </div>

      <Tabs defaultValue="expenses">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="expenses" className="gap-1"><Receipt className="h-3.5 w-3.5" /> Expenses</TabsTrigger>
          <TabsTrigger value="balances" className="gap-1"><Scale className="h-3.5 w-3.5" /> Balances</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-3 mt-4">
          {expenses.length === 0 && !isLoading ? (
            <EmptyState title="No expenses yet" description="Add the first shared expense for this group." actionLabel="Add Expense" onAction={() => setShowAddExpense(true)} />
          ) : (
            expenses.map((e) => {
              const cat = getCategoryByValue(e.category);
              return (
                <div key={e.id} className="glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span>{cat?.emoji ?? "📝"}</span>
                        <span className="font-semibold truncate">{e.description}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid by {memberName(e.paid_by)} · {format(parseISO(e.expense_date), "MMM dd, yyyy")} · {e.split_type} split
                      </p>
                      {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold">{format$(Number(e.amount))}</p>
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button size="sm" variant="ghost" className="text-destructive h-7" onClick={() => setDeleteExpenseId(e.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="balances" className="space-y-4 mt-4">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Net balance per member</h3>
            <div className="space-y-2">
              {members.map((m) => {
                const bal = balances[m.id] ?? 0;
                return (
                  <div key={m.id} className="glass-card p-3 flex items-center justify-between">
                    <span className="font-medium">{memberDisplayName(m, user?.id)}</span>
                    <span className={Math.abs(bal) < 0.01 ? "text-muted-foreground text-sm" : bal > 0 ? "text-success font-semibold" : "text-destructive font-semibold"}>
                      {Math.abs(bal) < 0.01 ? "settled up" : bal > 0 ? `gets back ${format$(bal)}` : `owes ${format$(Math.abs(bal))}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Suggested settle-ups</h3>
            {simplifiedTransfers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody owes anybody — you're all square.</p>
            ) : (
              <div className="space-y-2">
                {simplifiedTransfers.map((t, i) => (
                  <div key={i} className="glass-card p-3 flex items-center justify-between gap-2">
                    <span className="text-sm">
                      <span className="font-medium">{memberName(t.fromMemberId)}</span> owes{" "}
                      <span className="font-medium">{memberName(t.toMemberId)}</span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold">{format$(t.amount)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-primary text-primary h-7"
                        onClick={() => setSettleData({ from: t.fromMemberId, to: t.toMemberId, amount: t.amount })}
                      >
                        Settle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {members.length > 0 && (
        <AddGroupExpenseModal
          open={showAddExpense}
          onOpenChange={setShowAddExpense}
          members={members}
          formatCurr={format$}
          onSubmit={(data) => { addExpense.mutate(data); setShowAddExpense(false); }}
        />
      )}

      {members.length > 0 && settleData !== null && (
        <SettleUpModal
          open={settleData !== null}
          onOpenChange={(o) => !o && setSettleData(null)}
          members={members}
          groupId={group.id}
          groupName={group.name}
          formatCurr={format$}
          defaultFrom={settleData.from}
          defaultTo={settleData.to}
          defaultAmount={settleData.amount}
          onSubmit={(data) => { settleUp.mutate(data); setSettleData(null); }}
        />
      )}

      <GroupSettingsModal
        open={showSettings}
        onOpenChange={setShowSettings}
        group={group}
        members={members}
        isAdmin={isAdmin}
        onAddMember={(userId, name) => addMember.mutate({ groupId: group.id, userId, name })}
        onRemoveMember={(memberId) => removeMember.mutate(memberId)}
        onDeleteGroup={() => { deleteGroup.mutate(group.id); navigate("/split"); }}
      />

      <ConfirmDialog
        open={!!deleteExpenseId}
        onOpenChange={(o) => !o && setDeleteExpenseId(null)}
        title="Delete Expense"
        description="This will remove the expense, its splits, and any linked personal transaction. This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deleteExpenseId) deleteExpense.mutate(deleteExpenseId); setDeleteExpenseId(null); }}
      />
    </div>
  );
}
