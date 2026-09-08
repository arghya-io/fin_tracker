import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { GroupMember } from "@/hooks/useGroups";
import { computeNetBalances, simplifyDebts, SimplifiedTransfer } from "@/lib/splitCalculations";

export interface GroupExpense {
  id: string;
  group_id: string;
  user_id: string;
  description: string;
  amount: number;
  category: string;
  paid_by: string;
  split_type: "equal" | "unequal" | "percentage" | "shares";
  expense_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupExpenseSplit {
  id: string;
  expense_id: string;
  member_id: string;
  user_id: string;
  share_amount: number;
  share_units: number | null;
  created_at: string;
}

export interface GroupSettlement {
  id: string;
  group_id: string;
  user_id: string;
  from_member_id: string;
  to_member_id: string;
  amount: number;
  settled_at: string;
  note: string | null;
  created_at: string;
}

export function useGroupExpenses(groupId: string | undefined, members: GroupMember[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["group_expenses", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_expenses")
        .select("*")
        .eq("group_id", groupId!)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as GroupExpense[];
    },
    enabled: !!user && !!groupId,
  });

  const splitsQuery = useQuery({
    queryKey: ["group_expense_splits", groupId],
    queryFn: async () => {
      const expenseIds = (expensesQuery.data ?? []).map((e) => e.id);
      if (expenseIds.length === 0) return [] as GroupExpenseSplit[];
      const { data, error } = await supabase.from("group_expense_splits").select("*").in("expense_id", expenseIds);
      if (error) throw error;
      return data as GroupExpenseSplit[];
    },
    enabled: !!user && !!groupId && !!expensesQuery.data,
  });

  const settlementsQuery = useQuery({
    queryKey: ["group_settlements", groupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("group_settlements")
        .select("*")
        .eq("group_id", groupId!)
        .order("settled_at", { ascending: false });
      if (error) throw error;
      return data as GroupSettlement[];
    },
    enabled: !!user && !!groupId,
  });

  useEffect(() => {
    if (!user || !groupId) return;
    const channels = ["group_expenses", "group_expense_splits", "group_settlements"].map((table) =>
      supabase
        .channel(`${table}-${groupId}-realtime`)
        .on("postgres_changes", { event: "*", schema: "public", table }, () => {
          queryClient.invalidateQueries({ queryKey: [table, groupId] });
        })
        .subscribe()
    );
    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }, [user, groupId, queryClient]);

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["group_expenses", groupId] });
    queryClient.invalidateQueries({ queryKey: ["group_expense_splits", groupId] });
    queryClient.invalidateQueries({ queryKey: ["group_settlements", groupId] });
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
  };

  const addExpense = useMutation({
    mutationFn: async ({
      description,
      amount,
      category,
      paidBy,
      splitType,
      expenseDate,
      notes,
      splits,
    }: {
      description: string;
      amount: number;
      category: string;
      paidBy: string;
      splitType: GroupExpense["split_type"];
      expenseDate: string;
      notes?: string;
      splits: { memberId: string; shareAmount: number; shareUnits: number | null }[];
    }) => {
      const { data: expense, error } = await supabase
        .from("group_expenses")
        .insert({
          group_id: groupId!,
          user_id: user!.id,
          description,
          amount,
          category,
          paid_by: paidBy,
          split_type: splitType,
          expense_date: expenseDate,
          notes: notes || null,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: splitErr } = await supabase.from("group_expense_splits").insert(
        splits.map((s) => ({
          expense_id: expense.id,
          member_id: s.memberId,
          user_id: user!.id,
          share_amount: s.shareAmount,
          share_units: s.shareUnits,
        }))
      );
      if (splitErr) throw splitErr;

      // Mirror only "your" share into personal transactions, so Dashboard /
      // Reports / Budgets reflect real personal spend rather than the full
      // amount you may have fronted for the group.
      const youMember = members.find((m) => m.member_user_id === user?.id) ?? members.find((m) => m.is_you);
      const yourSplit = youMember ? splits.find((s) => s.memberId === youMember.id) : undefined;
      if (youMember && yourSplit && yourSplit.shareAmount > 0) {
        const { error: txErr } = await supabase.from("transactions").insert({
          user_id: user!.id,
          type: "expense",
          amount: yourSplit.shareAmount,
          category,
          description: `${description} (your share)`,
          date: expenseDate,
          payment_method: "cash",
          source: "group_expense_auto",
          group_expense_id: expense.id,
        });
        if (txErr) throw txErr;
      }

      return expense as GroupExpense;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Expense added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteExpense = useMutation({
    mutationFn: async (expenseId: string) => {
      await supabase.from("transactions").delete().eq("group_expense_id", expenseId);
      const { error } = await supabase.from("group_expenses").delete().eq("id", expenseId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Expense deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const settleUp = useMutation({
    mutationFn: async ({
      fromMemberId,
      toMemberId,
      amount,
      settledAt,
      note,
      recordAsTransaction,
    }: {
      fromMemberId: string;
      toMemberId: string;
      amount: number;
      settledAt: string;
      note?: string;
      recordAsTransaction?: boolean;
    }) => {
      const { data: settlement, error } = await supabase
        .from("group_settlements")
        .insert({
          group_id: groupId!,
          user_id: user!.id,
          from_member_id: fromMemberId,
          to_member_id: toMemberId,
          amount,
          settled_at: settledAt,
          note: note || null,
        })
        .select()
        .single();
      if (error) throw error;

      // Optional: mirror real cash movement into personal transactions, only
      // when "You" are one side of the settlement.
      if (recordAsTransaction) {
        const youMember = members.find((m) => m.member_user_id === user?.id) ?? members.find((m) => m.is_you);
        if (youMember) {
          const fromName = members.find((m) => m.id === fromMemberId)?.name ?? "Someone";
          const toName = members.find((m) => m.id === toMemberId)?.name ?? "Someone";
          if (youMember.id === fromMemberId) {
            await supabase.from("transactions").insert({
              user_id: user!.id,
              type: "expense",
              amount,
              category: "group_settlement_paid",
              description: `Settled up with ${toName}${note ? " — " + note : ""}`,
              date: settledAt,
              payment_method: "cash",
              source: "group_settlement_auto",
              group_settlement_id: settlement.id,
            });
          } else if (youMember.id === toMemberId) {
            await supabase.from("transactions").insert({
              user_id: user!.id,
              type: "income",
              amount,
              category: "group_settlement_received",
              description: `Settled up with ${fromName}${note ? " — " + note : ""}`,
              date: settledAt,
              payment_method: "cash",
              source: "group_settlement_auto",
              group_settlement_id: settlement.id,
            });
          }
        }
      }

      return settlement as GroupSettlement;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Settlement recorded ✅");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSettlement = useMutation({
    mutationFn: async (settlementId: string) => {
      await supabase.from("transactions").delete().eq("group_settlement_id", settlementId);
      const { error } = await supabase.from("group_settlements").delete().eq("id", settlementId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success("Settlement removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const expenses = expensesQuery.data ?? [];
  const splits = splitsQuery.data ?? [];
  const settlements = settlementsQuery.data ?? [];

  const balances = useMemo(() => {
    return computeNetBalances({
      memberIds: members.map((m) => m.id),
      expenses: expenses.map((e) => ({ paidBy: e.paid_by, amount: Number(e.amount) })),
      splits: splits.map((s) => ({ memberId: s.member_id, shareAmount: Number(s.share_amount) })),
      settlements: settlements.map((s) => ({
        fromMemberId: s.from_member_id,
        toMemberId: s.to_member_id,
        amount: Number(s.amount),
      })),
    });
  }, [members, expenses, splits, settlements]);

  const simplifiedTransfers: SimplifiedTransfer[] = useMemo(() => simplifyDebts(balances), [balances]);

  // "You" is whichever member row is linked to the current account — falls back to
  // the legacy `is_you` flag for the group's original creator.
  const youMember = members.find((m) => m.member_user_id === user?.id) ?? members.find((m) => m.is_you);
  const yourNetBalance = youMember ? balances[youMember.id] ?? 0 : 0;

  return {
    expenses,
    splits,
    settlements,
    isLoading: expensesQuery.isLoading || settlementsQuery.isLoading,
    balances,
    simplifiedTransfers,
    yourNetBalance,
    youMember,
    addExpense,
    deleteExpense,
    settleUp,
    deleteSettlement,
  };
}
