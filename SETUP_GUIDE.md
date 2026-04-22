a# UniAsk — Complete Setup Guide
Everything free. No credit card needed for any step.

---

## What you'll have at the end
- A live website at `https://yourname.vercel.app` (free custom domain optional)
- Real user accounts with login/signup
- Data that actually saves (Postgres database)
- Email notifications when questions are answered/assigned
- Ready to add LINE later

**Total time: ~2 hours**
**Total cost: $0**

---

## Tools you'll install (all free)
| Tool | What it does | Link |
|---|---|---|
| Node.js | Runs JavaScript on your computer | nodejs.org |
| Git | Saves and tracks your code | git-scm.com |
| VS Code | Code editor | code.visualstudio.com |
| Supabase | Database + Auth (free tier) | supabase.com |
| Resend | Email notifications (3000/mo free) | resend.com |
| Vercel | Hosts your website (free) | vercel.com |
| GitHub | Stores your code (free) | github.com |

---

## PHASE 1 — Install tools & create the project (20 min)

### Step 1.1 — Install Node.js
1. Go to https://nodejs.org
2. Download the **LTS** version (left button)
3. Run the installer, click through all defaults
4. Open a terminal (Mac: Cmd+Space → "Terminal", Windows: Start → "cmd")
5. Type `node --version` — you should see something like `v20.x.x`

### Step 1.2 — Install Git
1. Go to https://git-scm.com/downloads
2. Download for your OS, install with all defaults
3. In terminal, type `git --version` to confirm

### Step 1.3 — Install VS Code
1. Go to https://code.visualstudio.com
2. Download and install
3. Open it — you'll use this to edit files

### Step 1.4 — Create the project
Open your terminal and run these commands one by one:

```bash
# Go to your desktop (or wherever you want the project)
cd ~/Desktop

# Create the project
npm create vite@latest uniask -- --template react

# Go into the project folder
cd uniask

# Install dependencies
npm install

# Install Supabase client
npm install @supabase/supabase-js

# Test it runs
npm run dev
```

Your browser should open at http://localhost:5173 with a placeholder page.
Press Ctrl+C in the terminal to stop it.

### Step 1.5 — Open project in VS Code
```bash
code .
```
This opens the `uniask` folder in VS Code.

---

## PHASE 2 — Set up Supabase (database + auth) (30 min)

### Step 2.1 — Create a Supabase account
1. Go to https://supabase.com
2. Click "Start your project" → Sign up with GitHub (easiest) or email
3. Click "New project"
4. Fill in:
   - **Name:** uniask
   - **Database Password:** make something strong, save it somewhere
   - **Region:** pick the closest to Japan (e.g. Northeast Asia - Tokyo)
5. Click "Create new project" — takes ~2 minutes to spin up

### Step 2.2 — Create the database tables
1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Copy the entire contents of `supabase/schema.sql` (provided in this project)
4. Paste it into the editor
5. Click **Run** (or Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 2.3 — Enable email auth
1. In Supabase left sidebar → **Authentication** → **Providers**
2. Make sure **Email** is enabled (it is by default)
3. Go to **Authentication** → **Email Templates**
4. Customize the confirmation email if you want (optional)
5. For development, go to **Authentication** → **Settings** → turn OFF "Enable email confirmations" so you can test without confirming emails

### Step 2.4 — Get your API keys
1. In Supabase left sidebar → **Settings** → **API**
2. You need two values:
   - **Project URL** — looks like `https://xxxxx.supabase.co`
   - **anon public key** — long string starting with `eyJ...`
3. Keep this tab open, you'll need these in the next phase

### Step 2.5 — Set up Row Level Security
1. In Supabase left sidebar → **SQL Editor** → **New query**
2. Copy the entire contents of `supabase/rls_policies.sql`
3. Paste and Run

---

## PHASE 3 — Connect the app to Supabase (30 min)

### Step 3.1 — Create environment variables file
In VS Code, create a new file called `.env.local` in the root of your project (same level as `package.json`):

```
VITE_SUPABASE_URL=https://your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with what you got from Step 2.4.

### Step 3.2 — Copy the source files
Replace the contents of these files with the code provided:

- `src/main.jsx` → copy from `src/main.jsx` in this guide
- `src/App.jsx` → copy from `src/App.jsx` in this guide
- `src/index.css` → copy from `src/index.css` in this guide
- `src/lib/supabase.js` → copy from `src/lib/supabase.js` in this guide

### Step 3.3 — Test locally
```bash
npm run dev
```
- Go to http://localhost:5173
- Try registering a new account as a student (use school code `12345` for testing)
- Try logging in
- Submit a test question

If it works, your database is connected!

---

## PHASE 4 — Set up email notifications (20 min)

### Step 4.1 — Create a Resend account
1. Go to https://resend.com
2. Sign up (free, no credit card)
3. Go to **API Keys** → **Create API Key**
4. Name it "uniask-notifications"
5. Copy the key (starts with `re_...`) — you only see it once

### Step 4.2 — Add Resend key to Supabase
1. In Supabase → **Settings** → **Edge Functions** → **Secrets**
2. Add secret: `RESEND_API_KEY` = your key from above
3. Also add: `APP_URL` = `http://localhost:5173` (change to real URL after deploying)

### Step 4.3 — Deploy the Edge Functions
Install the Supabase CLI:
```bash
npm install -g supabase
```

Login:
```bash
supabase login
```

Link to your project (get Project ID from Supabase → Settings → General):
```bash
supabase link --project-ref your-project-id
```

Deploy both functions:
```bash
supabase functions deploy notify-on-question-create
supabase functions deploy notify-on-question-update
```

### Step 4.4 — Create Database Webhooks
1. In Supabase → **Database** → **Webhooks**
2. Create webhook 1:
   - **Name:** on_question_created
   - **Table:** questions
   - **Events:** INSERT
   - **URL:** `https://your-project.supabase.co/functions/v1/notify-on-question-create`
   - Add header: `Authorization: Bearer your-anon-key`
3. Create webhook 2:
   - **Name:** on_question_updated
   - **Table:** questions
   - **Events:** UPDATE
   - **URL:** `https://your-project.supabase.co/functions/v1/notify-on-question-update`
   - Add header: `Authorization: Bearer your-anon-key`

---

## PHASE 5 — Deploy to the internet (15 min)

### Step 5.1 — Create a GitHub account and repo
1. Go to https://github.com and sign up (free)
2. Click the **+** icon → **New repository**
3. Name it `uniask`, make it **Private**, click **Create repository**

### Step 5.2 — Push your code to GitHub
In your terminal (inside the uniask folder):
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/uniask.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 5.3 — Deploy on Vercel
1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project**
3. Import your `uniask` repository
4. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
5. Click **Deploy**
6. In ~2 minutes you'll get a live URL like `https://uniask-abc123.vercel.app`

### Step 5.4 — Update APP_URL in Supabase
1. Go to Supabase → **Settings** → **Edge Functions** → **Secrets**
2. Update `APP_URL` to your new Vercel URL
3. Also go to Supabase → **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Redirect URLs**

### Step 5.5 — Future deploys (automatic!)
Every time you make a change and run:
```bash
git add .
git commit -m "describe your change"
git push
```
Vercel automatically rebuilds and redeploys. Takes about 30 seconds.

---

## PHASE 6 — Create your admin account

1. Go to your live site
2. Register a new account with:
   - Role: **Admin**
   - School code: `WaWaWaWa`
   - Your email and password
3. This is your permanent admin account

Then go to **School codes** page and add your real schools.

---

## Adding a custom domain (optional, ~$10/year)

1. Buy a domain at https://www.onamae.com (Japanese registrar) or https://namecheap.com
2. In Vercel → your project → **Settings** → **Domains**
3. Add your domain, follow the DNS instructions Vercel shows you
4. Done — Vercel gives you free HTTPS automatically

---

## Troubleshooting

**"Cannot find module" error** → Run `npm install` again

**Login not working** → Check your `.env.local` has the right Supabase URL and key, no extra spaces

**Emails not sending** → Check Supabase Edge Function logs: Supabase → **Edge Functions** → click the function → **Logs**

**Database errors** → Check Supabase → **Table Editor** to see if tables were created correctly

---

## What's next (LINE integration)
Once the website is working, LINE integration requires:
1. A LINE Official Account (free at https://www.lycbiz.com/jp/signup/messaging-api/)
2. A small webhook server (we'll add this as a Supabase Edge Function — still free)
3. Connecting the webhook to your existing questions table

Come back to Claude once the website is live and we'll add LINE together.
