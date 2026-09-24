# Game Book — Wiki

Wiki com painel admin (editor Markdown, capas, categorias) e site público, rodando
sobre TanStack Start (SSR) + Supabase. Projeto próprio, sem dependência de plataforma
de terceiros para hospedar ou rodar.

## Como rodar (cada pessoa usa o SEU PRÓPRIO Supabase)

> 🔰 **Nunca mexeu com banco de dados?** Siga o
> [`TUTORIAL-PRIMEIRA-VEZ.md`](./TUTORIAL-PRIMEIRA-VEZ.md) — passo a passo
> com clique-a-clique, sem pular etapas. O resumo rápido abaixo é pra quem
> já manja.

Este projeto **não vem conectado a nenhum banco**. O `.env` real nunca é
commitado (está no `.gitignore`) — só existe o `.env.example`, sem segredos.
Cada pessoa que clonar o repositório cria o próprio projeto no Supabase e usa
suas próprias chaves. Ninguém consegue usar o banco de outra pessoa sem ter
essas chaves.

### 1. Criar o projeto no Supabase

1. Crie uma conta em [supabase.com](https://supabase.com) e clique em **New Project**.
2. Anote a senha do banco que você definir (só é pedida uma vez).
3. Espere o projeto provisionar (1-2 min).

### 2. Aplicar o schema (tabelas, RLS, funções)

Jeito mais simples: em **SQL Editor** no painel do Supabase, cole o conteúdo
de **`supabase/setup-completo.sql`** (um único arquivo que já junta todas as
migrations na ordem certa) e clique em **Run**. Um clique só.

Se preferir aplicar as migrations individuais (ex: já tem um projeto rodando
e só quer aplicar as mais novas) ou usar a CLI, veja a seção "Aplicar
mudanças no banco depois" mais abaixo.

### 3. Pegar as chaves e configurar o `.env`

Em **Project Settings → API** no painel do Supabase, copie:
- **Project URL**
- **anon / publishable key**
- **service_role key** (fica em "Reveal" — é secreta, nunca vai pro navegador)

```sh
cp .env.example .env
```

Preencha o `.env` com esses valores (o `service_role` só é necessário se você
usar rotas server-side administrativas; para rodar o wiki normalmente, a
`anon key` já basta).

### 4. Instalar e rodar

Precisa de Node.js (ou Bun) instalado.

```sh
npm install
npm run dev
```

Abre em `http://localhost:3000` (ou a porta que o terminal mostrar).

## Aplicar mudanças no banco depois

Novas migrations em `supabase/migrations/`: cole o `.sql` no **SQL Editor** e
rode, ou use a CLI (uma vez linkada, aplica tudo que ainda não rodou):

```sh
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase db push
```

## Build de produção

```sh
npm run build
```

Gera a build otimizada (alvo Cloudflare/Nitro, configurado em `vite.config.ts`).
Publicar em produção requer um host com suporte a SSR (Vercel, Netlify, Cloudflare
Pages) — GitHub Pages **não serve**, por ser só estático. Configure as mesmas
variáveis do `.env` nas "Environment Variables" do host — nunca no código.

## Conceder acesso de admin

Não existe cadastro público de admin nem "primeiro usuário vira admin" — isso
foi removido de propósito (veja `supabase/migrations/20260922200000_remove_claim_first_admin.sql`)
para que ninguém consiga virar admin do seu wiki sozinho. Depois de criar a
conta pelo `/auth`, o papel de admin é concedido manualmente via SQL Editor:

```sql
insert into public.user_roles (user_id, role)
values ('SEU-USER-UID-AQUI', 'admin');
```

O UID fica em **Authentication → Users** no painel do Supabase.

## Segurança / checklist antes de deixar o repositório público

- [ ] `.env` real **não** está commitado (confira com `git status` — deve
      aparecer como ignorado).
- [ ] Só o `.env.example` (sem valores) vai pro GitHub.
- [ ] A RLS (Row Level Security) está ativa em todas as tabelas — já vem
      configurada nas migrations; não desative.
- [ ] O admin é concedido manualmente por SQL, não por auto-cadastro.
- [ ] A `service_role key` nunca aparece em código do lado do cliente nem em
      variáveis com prefixo `VITE_`.
