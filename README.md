# UniAsk — Complete Setup Guide
Everything free. Follow these steps in order.

---

## What you'll need
- A computer with internet access
- ~2 hours total
- No prior coding experience required — every command is written out exactly

---

## PART 1 — Install tools on your computer (one time only)

### Step 1.1 — Install Node.js
1. Go to https://nodejs.org
2. Click the "LTS" download button (the left one)
3. Run the installer, click through all the defaults
4. Open Terminal (Mac) or Command Prompt (Windows)
5. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.10.0`

### Step 1.2 — Install Git
1. Go to https://git-scm.com/downloads
2. Download and install for your OS (all defaults are fine)
3. Confirm it works:
   ```
   git --version
   ```

---

## PART 2 — Set up your free Supabase database

### Step 2.1 — Create a Supabase account
1. Go to https://supabase.com
2. Click "Start your project" → sign up with GitHub or email (free)
3. Click "New project"
4. Fill in:
   - Name: `uniask`
   - Database Password: make a strong password and SAVE IT somewhere
   - Region: pick the closest to Japan (e.g. Northeast Asia - Tokyo)
5. Click "Create new project" — wait ~2 minutes for it to spin up

### Step 2.2 — Run the database setup
1. In your Supabase project, click "SQL Editor" in the left sidebar
2. Click "New query"
3. Open the file `supabase_setup.sql` from this folder
4. Copy the ENTIRE contents and paste into the SQL Editor
5. Click "Run" (green button)
6. You should see "Success. No rows returned" — that means it worked

### Step 2.3 — Get your API keys
1. In Supabase, click "Project Settings" (gear icon, bottom left)
2. Click "API"
3. Copy these two values — you'll need them in the next step:
   - **Project URL** — looks like `https://abcdefgh.supabase.co`
   - **anon public** key — long string starting with `eyJ...`

### Step 2.4 — Enable email confirmations (optional but recommended)
1. In Supabase, go to "Authentication" → "Email"
2. You can leave "Confirm email" ON (users verify via email) or turn it OFF for testing
3. For production: leave ON

---

## PART 3 — Set up the code

### Step 3.1 — Get the code onto your computer
Copy the entire `uniask` folder from this download to somewhere on your computer, e.g. your Desktop.

Open Terminal / Command Prompt and navigate to it:
```bash
# Mac/Linux:
cd ~/Desktop/uniask

# Windows:
cd C:\Users\YourName\Desktop\uniask
```

### Step 3.2 — Add your Supabase keys
1. Open the file `src/supabaseClient.js` in any text editor (Notepad, TextEdit, VS Code)
2. Replace the two placeholder values:
   ```js
   const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co'
   const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY'
   ```
   With your actual values from Step 2.3. Example:
   ```js
   const SUPABASE_URL = 'https://abcdefgh.supabase.co'
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   ```
3. Save the file

### Step 3.3 — Install dependencies
In your terminal (still in the uniask folder):
```bash
npm install
```
This downloads all the libraries. Takes ~1 minute.

### Step 3.4 — Run the website locally
```bash
npm run dev
```
Open your browser and go to: **http://localhost:5173**

The website should load! Try registering with the school code `12345`.

**To stop the local server:** press `Ctrl + C` in the terminal.

---

## PART 4 — Set up email notifications (free)

### Step 4.1 — Create a Resend account
1. Go to https://resend.com
2. Sign up free (3,000 emails/month included)
3. After signup, click "API Keys" → "Create API Key"
4. Name it `uniask`, click Create, copy the key (starts with `re_`)

### Step 4.2 — Add a sending domain (or use test mode)
**Option A (easiest for testing):** Skip this — Resend lets you send to your own email without a domain.

**Option B (for real users):** 
1. In Resend, click "Domains" → "Add Domain"
2. Follow their DNS instructions for your domain
3. Update the `FROM_EMAIL` in `notify-email/index.ts` to use your domain

### Step 4.3 — Install Supabase CLI and deploy the email function
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project (get project ref from Supabase URL: abcdefgh from https://abcdefgh.supabase.co)
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets (replace with your actual values)
supabase secrets set RESEND_API_KEY=re_your_key_here
supabase secrets set SITE_URL=https://your-vercel-url.vercel.app

# Deploy the email function
supabase functions deploy notify-email --no-verify-jwt
```

### Step 4.4 — Enable the pg_net extension (for DB triggers to call functions)
1. In Supabase, go to "Database" → "Extensions"
2. Search for "pg_net" and enable it
3. In SQL Editor, run:
   ```sql
   alter database postgres set app.edge_function_url = 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-email';
   alter database postgres set app.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
   ```
   (Service role key is in Project Settings → API → service_role key)

---

## PART 5 — Deploy to the internet (free forever)

### Step 5.1 — Create a GitHub account and repo
1. Go to https://github.com → sign up free
2. Click "New repository"
3. Name: `uniask`, set to Private, click "Create repository"
4. Follow GitHub's instructions to push your code. In your terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial UniAsk setup"
   git remote add origin https://github.com/YOUR_USERNAME/uniask.git
   git push -u origin main
   ```

### Step 5.2 — Deploy to Vercel (free)
1. Go to https://vercel.com → sign up with GitHub (free)
2. Click "Add New Project"
3. Import your `uniask` GitHub repo
4. Before clicking Deploy, click "Environment Variables" and add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key

   ⚠️ Also update `src/supabaseClient.js` to use env vars:
   ```js
   const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
   const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
   ```
5. Click "Deploy"
6. In ~2 minutes you get a URL like `uniask.vercel.app` — **your site is live!**

### Step 5.3 — Update Supabase auth settings
1. In Supabase, go to "Authentication" → "URL Configuration"
2. Set "Site URL" to your Vercel URL: `https://uniask.vercel.app`
3. Add to "Redirect URLs": `https://uniask.vercel.app/**`

### Step 5.4 — (Optional) Custom domain
1. Buy a domain at https://onamae.com (cheapest for .jp domains, ~¥1,200/yr)
   or https://namecheap.com (~$10/yr for .com)
2. In Vercel, go to your project → Settings → Domains → Add domain
3. Follow Vercel's DNS instructions (they give you exact settings to enter at your registrar)
4. HTTPS is automatic and free

---

## PART 6 — Create your admin account

### Step 6.1 — Register as admin
1. Go to your live site
2. Click "Register", select "Admin"
3. Use:
   - Your real email
   - A strong password
   - Admin code: `WaWaWaWa`
4. Check your email and confirm your account (if email confirmation is ON)
5. Log in — you now have full admin access

### Step 6.2 — Add your real school
1. Log in as admin
2. Go to "Schools" tab
3. Add your school name → it generates a unique 5-digit code
4. Share this code with students and alumni so they can register

---

## PART 7 — Ongoing: future deployments

Every time you make a change to the code:
```bash
git add .
git commit -m "describe your change"
git push
```
Vercel auto-deploys within 60 seconds. No extra steps needed.

---

## Cost summary
| Service | What it does | Free tier |
|---|---|---|
| Supabase | Database, auth, real-time | 500MB DB, 50k auth users, 2GB bandwidth |
| Vercel | Hosting | 100GB bandwidth, unlimited deploys |
| Resend | Email notifications | 3,000 emails/month |
| GitHub | Code storage | Unlimited private repos |
| **Total** | | **$0/month** |

You only need to pay if you exceed these limits — which won't happen until you have thousands of active users.

---

## Troubleshooting

**"School code not found" on registration**
→ Run the supabase_setup.sql again — the seed schools might not have inserted.

**Blank screen / errors in browser console**
→ Double-check your supabaseClient.js has the correct URL and key (no extra spaces).

**Emails not sending**
→ Check Supabase Edge Function logs: Dashboard → Edge Functions → notify-email → Logs.

**Users can't log in after registering**
→ If email confirmation is ON, they need to click the email link first. Check spam folder.

**Vercel deploy fails**
→ Make sure the env vars VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel project settings.
