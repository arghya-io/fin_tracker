-- ============================================================
-- FinTrack — Developer dashboard, user blocking, presence, push notifications
-- Run this in your Supabase SQL Editor after 001-006.
-- ============================================================

-- ─── new columns on user_preferences ──────────────────────────
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS is_developer BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- ─── protect privileged columns ───────────────────────────────
-- is_developer and blocked_until must never change through a normal
-- authenticated request (even a hand-crafted one hitting the user's own
-- row) — only through the admin RPCs below, or a SQL-editor script that
-- explicitly sets the bypass flag first. Everything else on this row
-- (display_name, currency, upi_id, ...) is untouched by this trigger.
CREATE OR REPLACE FUNCTION public.protect_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.is_developer IS DISTINCT FROM OLD.is_developer OR NEW.blocked_until IS DISTINCT FROM OLD.blocked_until)
     AND COALESCE(current_setting('app.bypass_privilege_check', true), '') <> 'true'
  THEN
    NEW.is_developer := OLD.is_developer;
    NEW.blocked_until := OLD.blocked_until;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_privileged_columns ON public.user_preferences;
CREATE TRIGGER trg_protect_privileged_columns
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.protect_privileged_columns();

-- ─── developer check ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_developer()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE((SELECT up.is_developer FROM public.user_preferences up WHERE up.user_id = auth.uid()), false);
$$;

GRANT EXECUTE ON FUNCTION public.is_developer() TO authenticated;

-- ─── admin: total registered users ────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_get_user_stats()
RETURNS TABLE (total_users BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  RETURN QUERY SELECT COUNT(*) FROM auth.users;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_stats() TO authenticated;

-- ─── admin: full user list with presence + chat rate ──────────
-- chat_rate_per_day = total chat messages sent ÷ days since the account
-- was created (minimum 1 day, so brand-new accounts don't divide by 0).
CREATE OR REPLACE FUNCTION public.admin_get_user_list()
RETURNS TABLE (
  user_id            UUID,
  email              TEXT,
  display_name       TEXT,
  username           TEXT,
  created_at         TIMESTAMPTZ,
  last_seen_at       TIMESTAMPTZ,
  blocked_until      TIMESTAMPTZ,
  is_developer       BOOLEAN,
  chat_messages_sent BIGINT,
  chat_rate_per_day  NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    au.id,
    au.email::TEXT,
    up.display_name,
    up.username,
    au.created_at,
    up.last_seen_at,
    up.blocked_until,
    COALESCE(up.is_developer, false),
    COALESCE(cm.msg_count, 0) AS chat_messages_sent,
    ROUND(
      COALESCE(cm.msg_count, 0)::NUMERIC / GREATEST(1, EXTRACT(DAY FROM (now() - au.created_at))::NUMERIC),
      2
    ) AS chat_rate_per_day
  FROM auth.users au
  LEFT JOIN public.user_preferences up ON up.user_id = au.id
  LEFT JOIN (
    SELECT sender_id, COUNT(*) AS msg_count
    FROM public.chat_messages
    WHERE deleted_at IS NULL
    GROUP BY sender_id
  ) cm ON cm.sender_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_get_user_list() TO authenticated;

-- ─── admin: block / unblock a user for a chosen duration ──────
CREATE OR REPLACE FUNCTION public.admin_block_user(_user_id UUID, _hours NUMERIC)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot block yourself';
  END IF;
  IF _hours IS NULL OR _hours <= 0 THEN
    RAISE EXCEPTION 'Duration must be a positive number of hours';
  END IF;

  PERFORM set_config('app.bypass_privilege_check', 'true', true);
  UPDATE public.user_preferences
  SET blocked_until = now() + (_hours || ' hours')::INTERVAL
  WHERE user_id = _user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_unblock_user(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_developer() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  PERFORM set_config('app.bypass_privilege_check', 'true', true);
  UPDATE public.user_preferences
  SET blocked_until = NULL
  WHERE user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_block_user(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_unblock_user(UUID) TO authenticated;

-- ─── push_subscriptions ────────────────────────────────────────
-- One row per browser/device subscription. A user may have several
-- (phone + laptop, etc). RLS keeps everyone locked to their own rows;
-- the send-push Edge Function reads across all of them using the
-- service-role key.
CREATE TABLE public.push_subscriptions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint   TEXT NOT NULL UNIQUE,
  p256dh     TEXT NOT NULL,
  auth_key   TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions (user_id);

CREATE POLICY "Users manage own push subscription" ON public.push_subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
