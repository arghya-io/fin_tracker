import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CategoryDropdown } from "@/components/CategoryDropdown";
import { GroupMember } from "@/hooks/useGroups";
import { computeSplits, validateSplits, SplitType } from "@/lib/splitCalculations";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { memberDisplayName } from "@/lib/memberDisplay";
import { useAuth } from "@/contexts/AuthContext";

interface AddGroupExpenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: GroupMember[];
  formatCurr: (n: number) => string;
  onSubmit: (data: {
    description: string;
    amount: number;
    category: string;
    paidBy: string;
    splitType: SplitType;
    expenseDate: string;
    notes?: string;
    splits: { memberId: string; shareAmount: number; shareUnits: number | null }[];
  }) => void;
}

const SPLIT_LABELS: { value: SplitType; label: string }[] = [
  { value: "equal", label: "Equal" },
  { value: "unequal", label: "Unequal" },
  { value: "percentage", label: "Percentage" },
  { value: "shares", label: "Shares" },
];

export function AddGroupExpenseModal({ open, onOpenChange, members, formatCurr, onSubmit }: AddGroupExpenseModalProps) {
  const { user } = useAuth();
  const youMember = members.find((m) => m.is_you);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [paidBy, setPaidBy] = useState(youMember?.id ?? members[0]?.id ?? "");
  const [splitType, setSplitType] = useState<SplitType>("equal");
  const [date, setDate] = useState<Date>(new Date());
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState<Record<string, boolean>>(
    Object.fromEntries(members.map((m) => [m.id, true]))
  );
  const [values, setValues] = useState<Record<string, string>>({});

  const reset = () => {
    setDescription("");
    setAmount("");
    setCategory("food");
    setPaidBy(youMember?.id ?? members[0]?.id ?? "");
    setSplitType("equal");
    setDate(new Date());
    setNotes("");
    setParticipants(Object.fromEntries(members.map((m) => [m.id, true])));
    setValues({});
  };

  const activeMembers = members.filter((m) => participants[m.id]);
  const totalAmount = Number(amount) || 0;

  const memberInputs = useMemo(
    () => activeMembers.map((m) => ({ memberId: m.id, value: Number(values[m.id]) || 0 })),
    [activeMembers, values]
  );

  const validation = useMemo(
    () => validateSplits(totalAmount, splitType, memberInputs),
    [totalAmount, splitType, memberInputs]
  );

  const preview = useMemo(() => {
    if (totalAmount <= 0) return [];
    return computeSplits(totalAmount, splitType, memberInputs);
  }, [totalAmount, splitType, memberInputs]);

  const previewByMember = Object.fromEntries(preview.map((p) => [p.memberId, p.shareAmount]));

  const canSubmit = description.trim().length > 0 && totalAmount > 0 && paidBy && activeMembers.length > 0 && validation.valid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      description: description.trim(),
      amount: totalAmount,
      category,
      paidBy,
      splitType,
      expenseDate: format(date, "yyyy-MM-dd"),
      notes: notes.trim() || undefined,
      splits: preview,
    });
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add Shared Expense</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Description *</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary border-border" placeholder="Dinner, cab, groceries..." />
          </div>

          <div>
            <Label>Amount *</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary border-border" placeholder="0.00" min="0" step="0.01" />
          </div>

          <div>
            <Label>Category</Label>
            <CategoryDropdown type="expense" value={category} onChange={setCategory} />
          </div>

          <div>
            <Label>Paid by *</Label>
            <Select value={paidBy} onValueChange={setPaidBy}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue placeholder="Who paid?" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {memberDisplayName(m, user?.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left bg-secondary border-border">
                  <CalendarIcon className="mr-2 h-4 w-4" />{format(date, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Split</Label>
            <div className="flex gap-2 mt-1">
              {SPLIT_LABELS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSplitType(s.value)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
                    splitType === s.value ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Split between</Label>
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <Checkbox
                  checked={!!participants[m.id]}
                  onCheckedChange={(c) => setParticipants((prev) => ({ ...prev, [m.id]: !!c }))}
                />
                <span className="flex-1 text-sm truncate">{memberDisplayName(m, user?.id)}</span>
                {splitType !== "equal" && participants[m.id] && (
                  <Input
                    type="number"
                    value={values[m.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [m.id]: e.target.value }))}
                    className="w-24 h-8 bg-secondary border-border text-sm"
                    placeholder={splitType === "percentage" ? "%" : splitType === "shares" ? "shares" : "0.00"}
                    min="0"
                    step={splitType === "unequal" ? "0.01" : "1"}
                  />
                )}
                {participants[m.id] && previewByMember[m.id] !== undefined && (
                  <span className="text-xs text-muted-foreground w-20 text-right shrink-0">
                    {formatCurr(previewByMember[m.id])}
                  </span>
                )}
              </div>
            ))}
            {!validation.valid && (
              <p className="text-xs text-destructive">{validation.message}</p>
            )}
          </div>

          <div>
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary border-border" placeholder="Extra details..." />
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!canSubmit}>
            Add Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
