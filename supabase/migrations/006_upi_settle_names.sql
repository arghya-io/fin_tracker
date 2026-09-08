-- ============================================================
-- FinTrack — UPI Settle Up + real member names fix
-- Run this in your Supabase SQL Editor after 001-005.
-- ============================================================

-- ─── upi_id on user_preferences ──────────────────────────────
-- Standard UPI VPA format, e.g. "arghya@okhdfcbank". Nullable — not
-- everyone has set one up yet.
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS upi_id TEXT;

ALTER TABLE public.user_preferences
  ADD CONSTRAINT user_preferences_upi_id_format
  CHECK (upi_id IS NULL OR upi_id ~ '^[a-zA-Z0-9._-]+@[a-zA-Z][a-zA-Z0-9]*$');

-- ─── fix hard-coded "You" member names ───────────────────────
-- Every group's creator row was inserted with the literal name "You"
-- instead of the account holder's real name. That's fine for the
-- viewer's own account (the app now renders "You" dynamically based on
-- member_user_id), but it's wrong for everyone else looking at the same
-- group, and wrong inside descriptions like "Settled up with You".
-- Backfill with the real display name (falling back to the email
-- username) so the underlying data is correct for every viewer.
UPDATE public.group_members gm
SET name = COALESCE(NULLIF(up.display_name, ''), split_part(au.email, '@', 1))
FROM public.user_preferences up
JOIN auth.users au ON au.id = up.user_id
WHERE gm.member_user_id = up.user_id
  AND gm.name = 'You'
  AND COALESCE(NULLIF(up.display_name, ''), split_part(au.email, '@', 1)) IS NOT NULL;

-- ─── get_group_payment_info: expose UPI id + name for co-members ────
-- user_preferences is locked down to "view own row only" — correctly,
-- since it holds budget defaults etc. Settling up needs the *receiving*
-- member's UPI id though, so this SECURITY DEFINER function returns just
-- the three fields needed for payment, and only for members of a group
-- the caller actually belongs to.
CREATE OR REPLACE FUNCTION public.get_group_payment_info(_group_id UUID)
RETURNS TABLE (member_user_id UUID, display_name TEXT, upi_id TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT up.user_id, up.display_name, up.upi_id
  FROM public.user_preferences up
  WHERE public.is_group_member(_group_id)
    AND up.user_id IN (
      SELECT gm.member_user_id FROM public.group_members gm
      WHERE gm.group_id = _group_id AND gm.member_user_id IS NOT NULL
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_group_payment_info(UUID) TO authenticated;
