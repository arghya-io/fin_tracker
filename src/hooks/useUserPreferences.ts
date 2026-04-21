import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface UserPreferences {
  id: string;
  user_id: string;
  display_name: string | null;
  currency: string;
  monthly_budget_default: number;
  created_at: string;
  updated_at: string;
}

export function useUserPreferences() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user_preferences", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as UserPreferences;
    },
    enabled: !!user,
  });

  const updatePreferences = useMutation({
    mutationFn: async (
      updates: Partial<Pick<UserPreferences, "display_name" | "currency" | "monthly_budget_default">>
    ) => {
      const { data, error } = await supabase
        .from("user_preferences")
        .update(updates)
        .eq("user_id", user!.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_preferences"] });
      toast.success("Preferences updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { preferences: query.data, isLoading: query.isLoading, updatePreferences };
}
