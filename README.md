# quotepilot-ai

Quotation software for cleaning businesses. Next.js 16 + Supabase (auth, Postgres, RLS).
Reference implementation: ../leadrescue-ai. Overview: [../MAIN-DOCUMENT.md](../MAIN-DOCUMENT.md)

```bash
cp .env.example .env.local   # then fill in the Supabase URL + publishable key
npm install
npm run dev -- -p 3011
```

## Supabase setup
Run these in the Supabase SQL editor, in order: `supabase/migrations/0001` ... `0006`.
Then make yourself platform admin:
`insert into public.platform_admins (user_id) select id from auth.users where email = 'you@example.com';`
Auth > Email Templates > Reset password must include `{{ .Token }}` (OTP reset flow).
Before launch: `update public.app_flags set value = false where key = 'test_payments';`
