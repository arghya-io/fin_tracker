import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useTransactions } from "@/hooks/useTransactions";
import { CurrencySelector } from "@/components/CurrencySelector";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { exportTransactionsToCSV } from "@/lib/csvExport";
import { CurrencyCode } from "@/lib/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, DollarSign, Download, Trash2, Lock, RefreshCw } from "lucide-react";

export default function Settings() {
  const { user, updatePassword } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const { preferences, updatePreferences } = useUserPreferences();
  const { transactions, bulkDelete } = useTransactions();

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    if (preferences?.display_name) setDisplayName(preferences.display_name);
  }, [preferences]);

  const handleUpdateName = () => {
    if (!displayName.trim()) return;
    updatePreferences.mutate({ display_name: displayName.trim() });
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    const { error } = await updatePassword(newPassword);
    if (!error) { setNewPassword(""); toast.success("Password updated"); }
    else toast.error(error.message);
  };

  const handleDeleteAll = () => {
    if (transactions.length > 0) bulkDelete.mutate(transactions.map((t) => t.id));
    setShowDeleteAll(false);
  };

  const handleRecalculateDebts = async () => {
    setRecalculating(true);
    try {
      const { data: debts } = await supabase.from("debts").select("*");
      if (!debts || debts.length === 0) { toast.info("No debts found"); return; }

      const { data: existingTx } = await supabase
        .from("transactions")
        .select("debt_id")
        .eq("source", "debt_auto")
        .not("debt_id", "is", null);

      const coveredIds = new Set((existingTx || []).map((t: any) => t.debt_id));
      const orphaned = debts.filter((d: any) => !coveredIds.has(d.id));

      if (orphaned.length === 0) { toast.info("All debts already have linked transactions"); return; }

      const txRows = orphaned.map((d: any) => {
        const isReceivable = d.type === "receivable";
        return {
          user_id: d.user_id,
          type: isReceivable ? "expense" : "income",
          amount: d.original_amount,
          category: isReceivable ? "debt_money_lent" : "debt_money_borrowed",
          description: isReceivable
            ? `Lent to ${d.person_name}${d.description ? " — " + d.description : ""}`
            : `Borrowed from ${d.person_name}${d.description ? " — " + d.description : ""}`,
          date: d.debt_date,
          payment_method: "cash",
          source: "debt_auto",
          debt_id: d.id,
        };
      });

      const { error } = await supabase.from("transactions").insert(txRows);
      if (error) throw error;
      toast.success(`Fixed ${orphaned.length} orphaned debt transaction(s)`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl animate-fade-in">
      <h1 className="font-heading font-bold text-2xl">Settings</h1>

      {/* Profile */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Profile</h2>
        </div>
        <div>
          <Label>Email</Label>
          <Input value={user?.email || ""} disabled className="bg-secondary border-border opacity-60" />
        </div>
        <div>
          <Label>Display Name</Label>
          <div className="flex gap-2">
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Your name"
            />
            <Button onClick={handleUpdateName} disabled={updatePreferences.isPending}>
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* Password */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Change Password</h2>
        </div>
        <div className="flex gap-2">
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="bg-secondary border-border"
            placeholder="New password (min 6 chars)"
          />
          <Button onClick={handleUpdatePassword}>Update</Button>
        </div>
      </section>

      {/* Currency */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Currency</h2>
        </div>
        <CurrencySelector value={currency} onChange={(v) => setCurrency(v as CurrencyCode)} />
        <p className="text-xs text-muted-foreground">Currency is applied to all amounts across the app.</p>
      </section>

      {/* Data management */}
      <section className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Data Management</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="border-border" onClick={() => exportTransactionsToCSV(transactions)}>
            <Download className="h-4 w-4 mr-1" /> Export All Transactions
          </Button>
          <Button variant="outline" className="border-border" onClick={handleRecalculateDebts} disabled={recalculating}>
            <RefreshCw className={`h-4 w-4 mr-1 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Recalculating..." : "Fix Debt Transactions"}
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteAll(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Delete All Data
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          "Fix Debt Transactions" repairs balance if debt-linked transactions are missing.
        </p>
      </section>

      <ConfirmDialog
        open={showDeleteAll}
        onOpenChange={setShowDeleteAll}
        title="Delete All Data"
        description="This will permanently delete all your transactions. This action cannot be undone."
        confirmLabel="Delete Everything"
        destructive
        onConfirm={handleDeleteAll}
      />
    </div>
  );
}
