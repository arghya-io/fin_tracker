import { useState, useRef, useMemo } from "react";
import Papa from "papaparse";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Download, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ImportCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedRow {
  date: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  payment_method: string;
  custom_category: string;
  valid: boolean;
  error?: string;
}

const TEMPLATE_HEADERS = ["date", "type", "amount", "category", "description", "payment_method"];

function parseDate(raw: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const day = d.padStart(2, "0");
    const month = m.padStart(2, "0");
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${y}-${month}-${day}`;
    }
  }
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[₹$€£,\s]/g, "");
  const num = Number(cleaned);
  return isNaN(num) || num <= 0 ? null : num;
}

function parseType(raw: string): "income" | "expense" | null {
  const t = raw?.toLowerCase().trim();
  if (t === "income") return "income";
  if (t === "expense") return "expense";
  return null;
}

export function ImportCSVModal({ open, onOpenChange }: ImportCSVModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);

  const parsed = useMemo<ParsedRow[]>(() => {
    return rawRows.map((row) => {
      const date = parseDate(row.date || row.Date || "");
      const type = parseType(row.type || row.Type || "");
      const amount = parseAmount(row.amount || row.Amount || "");
      const category = (row.category || row.Category || "").trim();
      const description = (row.description || row.Description || "").trim();
      const payment_method =
        (row.payment_method || row["Payment Method"] || row.payment || "").trim() || "other";
      const custom_category = (row.custom_category || "").trim();
      const valid = !!date && !!type && !!amount && !!category;
      return {
        date: date || "",
        type: type || "expense",
        amount: amount || 0,
        category,
        description,
        payment_method,
        custom_category,
        valid,
        error: !date
          ? "Invalid date"
          : !type
            ? "Invalid type"
            : !amount
              ? "Invalid amount"
              : !category
                ? "Missing category"
                : undefined,
      };
    });
  }, [rawRows]);

  const validRows = parsed.filter((r) => r.valid);
  const invalidRows = parsed.filter((r) => !r.valid);

  const handleFile = (file: File) => {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => setRawRows(results.data as Record<string, string>[]),
    });
  };

  const downloadTemplate = () => {
    const csv =
      TEMPLATE_HEADERS.join(",") +
      "\n2025-01-15,expense,500,food,Lunch at cafe,cash\n2025-01-16,income,3000,salary,Monthly salary,bank_transfer";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (!user || validRows.length === 0) return;
    setImporting(true);
    try {
      const rows = validRows.map((r) => ({
        user_id: user.id,
        type: r.type,
        amount: r.amount,
        category: r.category,
        custom_category: r.custom_category || null,
        description: r.description || null,
        date: r.date,
        payment_method: r.payment_method,
      }));
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await supabase.from("transactions").insert(rows.slice(i, i + BATCH));
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success(`${validRows.length} transactions imported`);
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFileName(null);
    setRawRows([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading">Import Transactions</DialogTitle>
        </DialogHeader>

        <div
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-secondary/50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          {fileName ? (
            <div className="flex items-center justify-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{fileName}</span>
              <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); reset(); }}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Tap to select a .csv file</p>
            </>
          )}
        </div>

        <button onClick={downloadTemplate} className="text-xs text-primary hover:underline flex items-center gap-1 mx-auto">
          <Download className="h-3 w-3" /> Download CSV Template
        </button>

        {rawRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              {validRows.length > 0 && (
                <span className="flex items-center gap-1 text-success">
                  <CheckCircle2 className="h-4 w-4" /> {validRows.length} rows ready
                </span>
              )}
              {invalidRows.length > 0 && (
                <span className="flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> {invalidRows.length} skipped
                </span>
              )}
            </div>
            <div className="overflow-x-auto max-h-40 border border-border rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-right">Amount</th>
                    <th className="p-2 text-left">Category</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="p-2">{r.date || "—"}</td>
                      <td className="p-2">{r.type}</td>
                      <td className="p-2 text-right">{r.amount}</td>
                      <td className="p-2 truncate max-w-[100px]">{r.category || "—"}</td>
                      <td className="p-2">
                        {r.valid ? (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        ) : (
                          <span className="text-destructive">{r.error}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button className="w-full" disabled={validRows.length === 0 || importing} onClick={handleImport}>
              {importing && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Import {validRows.length} Transaction{validRows.length !== 1 ? "s" : ""}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
