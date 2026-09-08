export type SplitType = "equal" | "unequal" | "percentage" | "shares";

export interface MemberInput {
  memberId: string;
  /** Raw input value — unused for "equal", exact amount for "unequal",
   *  percentage points for "percentage", share-count for "shares". */
  value: number;
}

export interface ComputedSplit {
  memberId: string;
  shareAmount: number;
  shareUnits: number | null;
}

/**
 * Turns a total amount + a set of participating members + a split
 * strategy into a concrete per-member amount. Rounds to 2 decimals and
 * assigns any leftover paise/cents to the first member so the splits
 * always sum exactly to the total.
 */
export function computeSplits(
  totalAmount: number,
  splitType: SplitType,
  members: MemberInput[]
): ComputedSplit[] {
  if (members.length === 0) return [];

  let raw: { memberId: string; amount: number; units: number | null }[];

  switch (splitType) {
    case "equal": {
      const share = totalAmount / members.length;
      raw = members.map((m) => ({ memberId: m.memberId, amount: share, units: null }));
      break;
    }
    case "unequal": {
      raw = members.map((m) => ({ memberId: m.memberId, amount: m.value, units: null }));
      break;
    }
    case "percentage": {
      raw = members.map((m) => ({
        memberId: m.memberId,
        amount: (totalAmount * m.value) / 100,
        units: m.value,
      }));
      break;
    }
    case "shares": {
      const totalShares = members.reduce((s, m) => s + m.value, 0) || 1;
      raw = members.map((m) => ({
        memberId: m.memberId,
        amount: (totalAmount * m.value) / totalShares,
        units: m.value,
      }));
      break;
    }
    default:
      throw new Error(`Unknown split type: ${splitType}`);
  }

  const rounded = raw.map((r) => ({ ...r, amount: Math.round(r.amount * 100) / 100 }));
  const roundedSum = rounded.reduce((s, r) => s + r.amount, 0);
  const diff = Math.round((totalAmount - roundedSum) * 100) / 100;
  if (diff !== 0 && rounded.length > 0) {
    rounded[0].amount = Math.round((rounded[0].amount + diff) * 100) / 100;
  }

  return rounded.map((r) => ({ memberId: r.memberId, shareAmount: r.amount, shareUnits: r.units }));
}

export function validateSplits(
  totalAmount: number,
  splitType: SplitType,
  members: MemberInput[]
): { valid: boolean; message?: string } {
  if (members.length === 0) return { valid: false, message: "Select at least one member" };

  if (splitType === "unequal") {
    const sum = members.reduce((s, m) => s + (m.value || 0), 0);
    const diff = Math.round((sum - totalAmount) * 100) / 100;
    if (Math.abs(diff) > 0.01) {
      return { valid: false, message: `Amounts add up to ${sum.toFixed(2)}, expected ${totalAmount.toFixed(2)}` };
    }
  }

  if (splitType === "percentage") {
    const sum = members.reduce((s, m) => s + (m.value || 0), 0);
    if (Math.abs(sum - 100) > 0.01) {
      return { valid: false, message: `Percentages add up to ${sum.toFixed(1)}%, expected 100%` };
    }
  }

  if (splitType === "shares") {
    const sum = members.reduce((s, m) => s + (m.value || 0), 0);
    if (sum <= 0) return { valid: false, message: "Enter at least one share" };
  }

  return { valid: true };
}

export interface BalanceInputs {
  memberIds: string[];
  expenses: { paidBy: string; amount: number }[];
  splits: { memberId: string; shareAmount: number }[];
  settlements: { fromMemberId: string; toMemberId: string; amount: number }[];
}

/**
 * Net balance per member. Positive => the group owes them money.
 * Negative => they owe the group money.
 */
export function computeNetBalances({ memberIds, expenses, splits, settlements }: BalanceInputs): Record<string, number> {
  const balances: Record<string, number> = {};
  memberIds.forEach((id) => (balances[id] = 0));

  expenses.forEach((e) => {
    if (balances[e.paidBy] === undefined) balances[e.paidBy] = 0;
    balances[e.paidBy] += e.amount;
  });

  splits.forEach((s) => {
    if (balances[s.memberId] === undefined) balances[s.memberId] = 0;
    balances[s.memberId] -= s.shareAmount;
  });

  settlements.forEach((s) => {
    if (balances[s.fromMemberId] === undefined) balances[s.fromMemberId] = 0;
    if (balances[s.toMemberId] === undefined) balances[s.toMemberId] = 0;
    balances[s.fromMemberId] += s.amount; // paying off debt reduces what they owe
    balances[s.toMemberId] -= s.amount; // they've now received what was owed
  });

  Object.keys(balances).forEach((k) => (balances[k] = Math.round(balances[k] * 100) / 100));
  return balances;
}

export interface SimplifiedTransfer {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/**
 * Classic "simplify debts" greedy algorithm: matches the biggest debtor
 * against the biggest creditor repeatedly, minimizing the number of
 * settle-up payments needed to zero everyone out.
 */
export function simplifyDebts(balances: Record<string, number>): SimplifiedTransfer[] {
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, amount]) => {
    if (amount > 0.005) creditors.push({ id, amount });
    else if (amount < -0.005) debtors.push({ id, amount: -amount });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SimplifiedTransfer[] = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.round(Math.min(debtor.amount, creditor.amount) * 100) / 100;

    if (amount > 0.005) {
      transfers.push({ fromMemberId: debtor.id, toMemberId: creditor.id, amount });
    }

    debtor.amount = Math.round((debtor.amount - amount) * 100) / 100;
    creditor.amount = Math.round((creditor.amount - amount) * 100) / 100;

    if (debtor.amount <= 0.005) i++;
    if (creditor.amount <= 0.005) j++;
  }

  return transfers;
}
