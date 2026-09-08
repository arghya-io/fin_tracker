import { useState } from "react";
import { useGroups } from "@/hooks/useGroups";
import { useCurrency } from "@/contexts/CurrencyContext";
import { EmptyState } from "@/components/EmptyState";
import { GroupCard } from "@/components/groups/GroupCard";
import { CreateGroupModal } from "@/components/groups/CreateGroupModal";
import { UpiSetupBanner } from "@/components/groups/UpiSetupBanner";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";

export default function SplitHome() {
  const { groups, members, isLoading, createGroup } = useGroups();
  const { currency } = useCurrency();
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Your Groups
        </h1>
        <Button size="sm" onClick={() => setShowCreate(true)} className="gap-1">
          <Plus className="h-4 w-4" /> New Group
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Split bills and shared expenses with friends — Splitwise-style. Everyone in a group needs a FinTrack account.
      </p>

      <UpiSetupBanner />

      {groups.length === 0 && !isLoading ? (
        <EmptyState
          title="No groups yet"
          description="Create a group for a trip, household, or friend circle to start splitting shared expenses."
          actionLabel="New Group"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="space-y-3">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} members={members.filter((m) => m.group_id === g.id)} />
          ))}
        </div>
      )}

      <CreateGroupModal
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultCurrency={currency}
        onSubmit={(data) => { createGroup.mutate(data); setShowCreate(false); }}
      />
    </div>
  );
}
