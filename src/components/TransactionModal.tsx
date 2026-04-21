import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryDropdown } from "./CategoryDropdown";
import { PAYMENT_METHODS } from "@/lib/categoryConfig";
import { Transaction } from "@/hooks/useTransactions";

const schema = z
  .object({
    type: z.enum(["income", "expense"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    category: z.string().min(1, "Category required"),
    custom_category: z.string().optional(),
    description: z.string().max(500).optional(),
    date: z.string().min(1, "Date required"),
    payment_method: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        (data.category === "other_expense" || data.category === "other_income") &&
        !data.custom_category?.trim()
      ) {
        return false;
      }
      return true;
    },
    { message: "Please specify a custom category", path: ["custom_category"] }
  );

type FormData = z.infer<typeof schema>;

interface TransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    type: "income" | "expense";
    amount: number;
    category: string;
    custom_category?: string;
    description?: string;
    date: string;
    payment_method?: string;
  }) => void;
  defaultValues?: Partial<Transaction>;
  loading?: boolean;
}

export function TransactionModal({ open, onOpenChange, onSubmit, defaultValues, loading }: TransactionModalProps) {
  const isEditing = !!defaultValues?.id;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: defaultValues?.type || "expense",
      amount: defaultValues?.amount || undefined,
      category: defaultValues?.category || "",
      custom_category: defaultValues?.custom_category || "",
      description: defaultValues?.description || "",
      date: defaultValues?.date || new Date().toISOString().split("T")[0],
      payment_method: defaultValues?.payment_method || "cash",
    },
  });

  const type = watch("type");
  const category = watch("category");
  const isOther = category === "other_expense" || category === "other_income";

  const handleFormSubmit = (data: FormData) => {
    onSubmit(
      data as {
        type: "income" | "expense";
        amount: number;
        category: string;
        custom_category?: string;
        description?: string;
        date: string;
        payment_method?: string;
      }
    );
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">{isEditing ? "Edit" : "Add"} Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={type === "expense" ? "default" : "outline"}
              onClick={() => {
                setValue("type", "expense");
                setValue("category", "");
              }}
              className={type === "expense" ? "bg-destructive hover:bg-destructive/90" : "border-border"}
            >
              Expense
            </Button>
            <Button
              type="button"
              variant={type === "income" ? "default" : "outline"}
              onClick={() => {
                setValue("type", "income");
                setValue("category", "");
              }}
              className={type === "income" ? "bg-success hover:bg-success/90" : "border-border"}
            >
              Income
            </Button>
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              {...register("amount")}
              className="bg-secondary border-border"
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount.message}</p>}
          </div>

          <div>
            <Label>Category</Label>
            <CategoryDropdown type={type} value={category} onChange={(v) => setValue("category", v)} />
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category.message}</p>}
          </div>

          {isOther && (
            <div>
              <Label>Custom Category</Label>
              <Input
                {...register("custom_category")}
                className="bg-secondary border-border"
                placeholder="Specify category"
              />
              {errors.custom_category && (
                <p className="text-xs text-destructive mt-1">{errors.custom_category.message}</p>
              )}
            </div>
          )}

          <div>
            <Label>Description (optional)</Label>
            <Textarea
              {...register("description")}
              className="bg-secondary border-border resize-none"
              rows={2}
              placeholder="What was this for?"
            />
          </div>

          <div>
            <Label>Date</Label>
            <Input type="date" {...register("date")} className="bg-secondary border-border" />
            {errors.date && <p className="text-xs text-destructive mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={watch("payment_method")} onValueChange={(v) => setValue("payment_method", v)}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.emoji} {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Update Transaction" : "Add Transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
