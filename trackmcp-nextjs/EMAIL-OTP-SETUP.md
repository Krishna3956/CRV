# TrackMCP authentication setup

## The final user flow

- New user: first name, last name, email, password → email OTP verification → onboarding.
- Returning user: email and password → dashboard.
- Existing passwordless user: email → password-reset OTP → choose a password → dashboard.
- Company name is not collected anywhere in signup or onboarding.

## Do you need to create a Supabase table?

No. Do not create a table for passwords or OTPs. Supabase Auth stores the user, password hash, email-confirmation state, and recovery tokens in `auth.users`. TrackMCP only stores the application profile/workspace data it already uses.

## What you need to do in the dashboards

### 1. Configure Resend

In Resend, verify the sending domain you want to use and create an API key with sending access. Add Resend’s DNS records in Cloudflare.

### 2. Configure Supabase SMTP

Open **Supabase → Authentication → SMTP Settings** and enter:

```text
Host: smtp.resend.com
Port: 587
Username: resend
Password: your Resend API key
Sender email: a verified address on your domain
Sender name: TrackMCP
```

Keep the Resend API key in Supabase’s SMTP setting. Do not put it in a `NEXT_PUBLIC_*` variable. These are Resend’s documented SMTP values: [Resend SMTP documentation](https://resend.com/docs/send-with-smtp).

### 3. Turn on email confirmation

Open **Supabase → Authentication → Providers → Email** and make sure:

- Email provider is enabled.
- Confirm email is enabled.

With confirmation enabled, signup creates the password but does not allow dashboard access until the email is verified. Supabase’s password signup returns a user without a session until confirmation is complete. [Supabase password signup documentation](https://supabase.com/docs/reference/javascript/auth-signup).

### 4. Make the confirmation email an OTP

Open **Supabase → Authentication → Email Templates → Confirm signup**.

Replace the link-based template with:

```html
<h2>Verify your TrackMCP email</h2>
<p>Enter this code on the TrackMCP signup page:</p>
<p style="font-size: 30px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
<p>This code can only be used once.</p>
```

Remove `{{ .ConfirmationURL }}` from this template. The signup page verifies the code with Supabase and creates the session in the browser, so users can read the email on their phone and type the code on their laptop. [Supabase OTP documentation](https://supabase.com/docs/guides/auth/auth-email-passwordless).

### 5. Make password recovery an OTP too

Open **Supabase → Authentication → Email Templates → Reset password**.

Use a template containing `{{ .Token }}` and remove `{{ .ConfirmationURL }}`:

```html
<h2>Reset your TrackMCP password</h2>
<p>Enter this code on the TrackMCP password reset page:</p>
<p style="font-size: 30px; font-weight: 700; letter-spacing: 6px;">{{ .Token }}</p>
<p>If you did not request this, you can ignore this email.</p>
```

This is needed for users who were created under the old passwordless flow. They can click **Forgot or need to set a password?** on the login page.

### 6. Check URL configuration

Open **Supabase → Authentication → URL Configuration** and set:

```text
Site URL: https://app.trackmcp.com
```

The new signup and recovery OTP flows do not depend on a browser-opening email link. Leave the existing `/auth/callback` redirect configured temporarily so previously sent magic links fail gracefully.

## Run locally

```bash
cd /Users/krgoyal/Desktop/Thinking/trackmcp-web/trackmcp-nextjs
npm install
npm run dev -- --port 3000
```

Open [http://localhost:3000/signin](http://localhost:3000/signin) or [http://localhost:3000/signup](http://localhost:3000/signup). If port 3000 is busy, use the port printed by Next.js.
