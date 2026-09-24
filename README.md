# Game Book — Wiki

Wiki with an admin panel (Markdown editor, covers, categories) and a public site, running on TanStack Start (SSR) + Supabase. Personal project, with no dependency on third-party platforms for hosting or running.

## How to run (each person uses THEIR OWN Supabase)

> 🔰 **Never worked with a database?** Follow the
> [`TUTORIAL-PRIMEIRA-VEZ.md`](./TUTORIAL-PRIMEIRA-VEZ.md) — step-by-step,
> click-by-click, without skipping steps. The quick summary below is for those
> who already know the ropes.

This project **does not come connected to any database**. The real `.env` is never
committed (it is in `.gitignore`) — there is only the `.env.example`, with no secrets.
Each person who clones the repository creates their own project on Supabase and uses
their own keys. Nobody can use someone else's database without having these keys.

### 1. Create the project on Supabase

1. Create an account at [supabase.com](https://supabase.com) and click on **New Project**.
2. Write down the database password you set (it is only asked once).
3. Wait for the project to provision (1-2 min).

### 2. Apply the schema (tables, RLS, functions)

Simplest way: in the **SQL Editor** on the Supabase dashboard, paste the contents
of **`supabase/setup-completo.sql`** (a single file that merges all migrations in
the right order) and click **Run**. Just one click.

If you prefer to apply the individual migrations (e.g., you already have a running
project and only want to apply the newest ones) or use the CLI, see the "Apply
database changes later" section below.

### 3. Get the keys and configure the `.env`

In **Project Settings → API** on the Supabase dashboard, copy:
- **Project URL**
- **anon / publishable key**
- **service_role key** (is under "Reveal" — it is secret, never goes to the browser)

```sh
cp .env.example .env
```

Fill out the `.env` with these values (the `service_role` is only necessary if you
use administrative server-side routes; to run the wiki normally, the `anon key` is enough).

### 4. Install and run

Requires Node.js (or Bun) installed.

```sh
npm install
npm run dev
```

Opens at `http://localhost:3000` (or the port shown in the terminal).

## Apply database changes later

New migrations in `supabase/migrations/`: paste the `.sql` into the **SQL Editor** and
run it, or use the CLI (once linked, it applies everything that hasn't run yet):

```sh
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

## Production build

```sh
npm run build
```

Generates the optimized build (Cloudflare/Nitro target, configured in `vite.config.ts`).
Publishing to production requires a host with SSR support (Vercel, Netlify, Cloudflare
Pages) — GitHub Pages **will not work**, as it is only static. Configure the same
variables from `.env` in the host's "Environment Variables" — never in the code.

## Grant admin access


# Tutorial: taking the wiki live from scratch (for those who have never used Supabase)

This guide assumes you have never worked with a database. It will take about 10-15
minutes. Follow the order, without skipping steps.

General idea, in one sentence: the **code** (this repository) is just the "shell" —
screens, buttons, text editor. The **data** (the wiki pages, users, categories) are
kept separately, in a database running on Supabase. You need to create this database
and "introduce" it to the code through the `.env` file.

---

## Part 1 — Create the account and project on Supabase

1. Go to **[supabase.com](https://supabase.com)** and click on **Start your project**.
2. Create the account (you can log in directly with GitHub or Google — faster).
3. You will land on a dashboard called **Organization**. Click on **New project**.
4. Fill in:
   - **Name**: any name, e.g., `my-wiki` (just for you to identify, it doesn't appear to the public).
   - **Database Password**: click on "Generate a password" and then **copy**
     that password and save it in a notepad. You will only see it once.
     (In practice, you will almost never need it again, but if you lose it
     and need it, it is annoying to recover.)
   - **Region**: choose the one closest to you (e.g., South America / São Paulo).
     It only affects speed, not security or price.
5. Click on **Create new project**.
6. Wait. A progress bar will appear ("Setting up project") — takes 1
   to 3 minutes. **Do not close the tab.**

✅ **Checkpoint**: when finished, you will automatically land on the project
dashboard, with a side menu (Table Editor, SQL Editor, Authentication, Storage, etc.).

---

## Part 2 — Create the tables (the database "skeleton")

The database starts **empty** — with no tables. Let's paste a script that creates
everything at once: the wiki tables, the security rules, and the initial data
(example categories and the "Welcome" page).

1. In the left side menu, click on the **SQL Editor** icon (looks like a
   `>_` terminal).
2. Click on **New query** (top corner).
3. Open, in this repository, the **`supabase/setup-completo.sql`** file.
4. Select **all** of its content (Ctrl+A, Ctrl+C) and paste it into the
   text box of the Supabase SQL Editor (Ctrl+V).
5. Click the green **Run** button (or `Ctrl+Enter`).

✅ **Checkpoint**: at the bottom, something like `Success. No rows returned`
should appear. If that appears, it worked — you can proceed.

⚠️ **If you get an error**: read the error message. The most common ones:
- `relation "..." already exists` → you have already run the script before in this
  project (running it again can cause errors in some parts; in this case, everything
  is fine, you can ignore it and proceed).
- Any other error → check if you copied the **entire** file, from start to
  finish, without cutting anything.

**Check visually:** click on **Table Editor** in the side menu. You
should see the tables: `categories`, `wiki_pages`, `page_revisions`,
`profiles`, `user_roles`, `site_themes`. If they appear, the database is ready.

---

## Part 3 — Get the project keys

These are the "credentials" the code uses to talk to your database.

1. In the side menu, click on the gear icon **Project Settings**.
2. Click on **API** (submenu).
3. You will see three pieces of information — leave this tab open, we'll use it shortly:
   - **Project URL** (something like `https://xxxxxxxx.supabase.co`)
   - **Project API keys → anon / public** (a long key, starts with
     `sb_publishable_` or `eyJ...`)
   - **service_role** (appears with a "Reveal" button — click to view.
     **This is secret**, it is not to be shared with anyone or placed in
     code that goes to the browser.)

---

## Part 4 — Configure the project on your machine

1. If you don't have it yet, install **[Node.js](https://nodejs.org)** (download the
   "LTS" version).
2. Download/extract this repository into a folder.
3. Open a terminal **inside that folder** (on Windows: go into the folder via
   Explorer, right-click → "Open in Terminal"; on Mac/Linux: `cd path/to/folder`).
4. Copy the environment variables example file:

   ```sh
   cp .env.example .env
   ```

   (On Windows, if `cp` doesn't work, you can simply duplicate the
   `.env.example` file in Explorer and rename the copy to `.env`.)

5. Open the newly created `.env` file in a text editor (Notepad,
   VS Code, whatever you have) and fill in the fields with what you got in
   Part 3:

   ```
   SUPABASE_PROJECT_ID="xxxxxxxx"
   SUPABASE_PUBLISHABLE_KEY="sb_publishable_...or_eyJ..."
   SUPABASE_URL="https://xxxxxxxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="sb_secret_...or_eyJ..."

   VITE_SUPABASE_PROJECT_ID="xxxxxxxx"
   VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_...or_eyJ..."
   VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
   ```

   Notice: the `PROJECT_ID` is just the small part before `.supabase.co` in the URL.
   The lines with `VITE_` in front repeat the same values as the ones above
   (except the `service_role`, which **does not** have a `VITE_` version).

6. Save the file.

---

## Part 5 — Run the project

In the same terminal:

```sh
npm install
```

(This downloads the dependencies — it takes a while the first time, just wait.)

```sh
npm run dev
```

The terminal will show something like `Local: http://localhost:3000`. Open this
address in your browser.

✅ **Checkpoint**: the site should load showing the wiki, with the "Welcome"
page that came as an example in the SQL script.

---

## Part 6 — Create your user and become an admin

Important: this wiki **does not have a public registration screen**. If you go to
`/auth`, there is only login — on purpose, so nobody can create an account on
your wiki on their own. Every account, including the first one (yours), is created
**through the Supabase dashboard**, not the site.

1. On the Supabase dashboard, go to **Authentication → Users**.
2. Click on **Add user → Create new user**.
3. Fill in email and password (check **Auto Confirm User**, otherwise it stays
   pending email confirmation, which you probably haven't set up yet).
4. Click on **Create user**. They will immediately appear in the list — copy their
   **UID** (a code like `a1b2c3d4-...`).
5. Go to **SQL Editor → New query** and paste, swapping for the copied UID:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('PASTE-YOUR-UID-HERE', 'admin');
   ```

6. Click **Run**.
7. Go to the site at `/auth` and log in with the email/password you just created
   on the dashboard. It should work and take you to `/admin`.

To give access to someone else in the future, it is the same process: you (admin)
create the user via the Supabase dashboard and decide if they get the `admin` role
or stay without any role (they can only read, not edit).

---

## Did everything work? Summary of what you just set up

- Your own isolated database, with your own access rules.
- A locally running site connected to this database.
- An account of your own with admin permissions on this wiki.

If you want to put it live for other people to access (not just on your machine),
see the **"Production build"** section in `README.md` — publishing on Vercel,
Netlify, or Cloudflare Pages is free on the basic plan and takes about 5 more minutes.
