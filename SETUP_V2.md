# FinTrack v2 — Setup Guide

This covers everything you need to deploy in your **own** Supabase project
to activate: Smart Import (CSV/PDF/Image), permanent account deletion,
password-gated data wipe, the Friends redesign, Friend Requests, Chat, and
the CDN-based Avatar system. Nothing here touches your live app until you
run these steps yourself.

## 1. Run the new database migration

In the Supabase SQL Editor, run (in order, if you haven't already run 001–003):

```
supabase/migrations/004_avatars_chat_import_account.sql
```

This adds:
- `user_preferences.avatar_url`, `transactions.import_hash`
- `uploaded_imports`, `conversations`, `chat_messages` tables + RLS
- RPCs: `get_or_create_conversation`, `get_conversations`, `get_monthly_message_count`,
  `mark_conversation_read`, `get_total_unread_count`, `get_incoming_requests`,
  `get_outgoing_requests`, `remove_friend`, `delete_my_account_data`,
  `delete_my_financial_data`
- Updated `get_friends` / `search_users` to include `avatar_url`
- A trigger enforcing the 60-messages-per-chat-per-month limit

Realtime is enabled for `conversations` and `chat_messages` automatically
via `ALTER PUBLICATION supabase_realtime ADD TABLE ...` in the migration.

## 2. Deploy the two Edge Functions

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli).

```bash
supabase functions deploy delete-account
supabase functions deploy parse-statement
```

These run with your project's `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and
`SUPABASE_SERVICE_ROLE_KEY`, which Supabase injects automatically — no
manual secret needed for those three.

## 3. Add your OCR.Space API key

PDF/Image import falls back to [OCR.Space](https://ocr.space/ocrapi) when a
PDF has no extractable text layer (scanned statements) or when the upload
is a photo. Get a free key, then:

```bash
supabase secrets set OCR_SPACE_API_KEY=your_key_here
```

Without this secret, image imports will show a clear error message and CSV
import continues to work normally (it never touches this function).

## 4. What changed, at a glance

| Feature | Where |
|---|---|
| Smart Import (CSV/PDF/Image) | Transactions page → Import button → `SmartImportModal` |
| Avatars (CDN-only, no storage) | Settings → Change Avatar → `/settings/avatar` |
| Friends redesign | Settings → Friends panel → "View All Friends" / "Friend Requests" |
| Chat | Bottom nav "Chat" (replaces "Reports" on mobile only — Reports is still in the desktop sidebar and reachable at `/reports`) |
| Delete All Data (financial only, password-gated) | Settings → Data Management |
| Permanently Delete Account | Settings → Danger Zone |

## Notes & honest caveats

- **PDF parsing** uses a generic line-based parser tuned for the common
  "date · narration · debit/credit · balance" layout most Indian bank
  statements share (the migration's `parseStatementText` function). It is
  not a hand-tuned parser per bank — it works well on clean, text-based
  statements and via OCR on scans, but always show the preview step before
  import (which the modal does) so you can catch anything mis-parsed.
- **Dedup** is a fingerprint of `(date, type, amount, description)` per
  user, enforced both client-side (pre-insert check) and via a unique
  index in Postgres — re-importing the same statement is safe.
- **Typing indicators** use Supabase Realtime *broadcast* (ephemeral, not
  stored) so they don't create DB writes for every keystroke.
