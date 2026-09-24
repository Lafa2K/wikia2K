# Tutorial: colocando o wiki no ar do zero (para quem nunca usou Supabase)

Este guia assume que você nunca mexeu em banco de dados. Vai levar uns 10-15
minutos. Siga na ordem, sem pular etapas.

Ideia geral, em uma frase: o **código** (este repositório) é só a "casca" —
telas, botões, editor de texto. Os **dados** (as páginas do wiki, usuários,
categorias) ficam guardados à parte, num banco de dados que roda no Supabase.
Você precisa criar esse banco e "apresentar" ele pro código através do
arquivo `.env`.

---

## Parte 1 — Criar a conta e o projeto no Supabase

1. Acesse **[supabase.com](https://supabase.com)** e clique em **Start your project**.
2. Crie a conta (dá pra entrar direto com GitHub ou Google — mais rápido).
3. Você vai cair num painel chamado **Organization**. Clique em **New project**.
4. Preencha:
   - **Name**: qualquer nome, ex: `meu-wiki` (só pra você identificar, não aparece pro público).
   - **Database Password**: clique em "Generate a password" e depois em
     **copiar** essa senha e guardar num bloco de notas. Você só vê ela uma
     vez. (Na prática, você quase nunca vai precisar dela de novo, mas se
     perder e precisar, é chato de recuperar.)
   - **Region**: escolha a mais perto de você (ex: South America / São Paulo).
     Só afeta velocidade, não afeta nada de segurança ou preço.
5. Clique em **Create new project**.
6. Espera. Aparece uma barra de progresso ("Setting up project") — leva de 1
   a 3 minutos. **Não feche a aba.**

✅ **Checkpoint**: quando terminar, você cai automaticamente no painel do
projeto, com um menu lateral (Table Editor, SQL Editor, Authentication,
Storage, etc.).

---

## Parte 2 — Criar as tabelas (o "esqueleto" do banco)

O banco começa **vazio** — sem nenhuma tabela. Vamos colar um script que cria
tudo de uma vez: as tabelas do wiki, as regras de segurança e os dados
iniciais (categorias de exemplo e a página "Bem-vindo").

1. No menu lateral esquerdo, clique no ícone de **SQL Editor** (parece um
   terminal `>_`).
2. Clique em **New query** (canto superior).
3. Abra, neste repositório, o arquivo **`supabase/setup-completo.sql`**.
4. Selecione **todo** o conteúdo dele (Ctrl+A, Ctrl+C) e cole na caixa de
   texto do SQL Editor do Supabase (Ctrl+V).
5. Clique no botão verde **Run** (ou `Ctrl+Enter`).

✅ **Checkpoint**: deve aparecer, embaixo, algo como `Success. No rows
returned`. Se aparecer isso, deu certo — pode seguir.

⚠️ **Se der erro**: leia a mensagem de erro. Os mais comuns:
- `relation "..." already exists` → você já rodou o script antes nesse
  projeto (rodar de novo pode dar erro em algumas partes; nesse caso está
  tudo certo, pode ignorar e seguir).
- Qualquer outro erro → confira se copiou o arquivo **inteiro**, do começo ao
  fim, sem cortar nada.

**Conferir visualmente:** clique em **Table Editor** no menu lateral. Você
deve ver as tabelas: `categories`, `wiki_pages`, `page_revisions`,
`profiles`, `user_roles`, `site_themes`. Se aparecerem, o banco está pronto.

---

## Parte 3 — Pegar as chaves do projeto

Essas são as "credenciais" que o código usa pra falar com o seu banco.

1. No menu lateral, clique no ícone de engrenagem **Project Settings**.
2. Clique em **API** (submenu).
3. Você vai ver três informações — deixe essa aba aberta, vamos usar já já:
   - **Project URL** (algo como `https://xxxxxxxx.supabase.co`)
   - **Project API keys → anon / public** (uma chave longa, começa com
     `sb_publishable_` ou `eyJ...`)
   - **service_role** (aparece com um botão "Reveal" — clique pra ver.
     **Essa é secreta**, não é pra compartilhar com ninguém nem colocar em
     código que vai pro navegador.)

---

## Parte 4 — Configurar o projeto na sua máquina

1. Se ainda não tem, instale o **[Node.js](https://nodejs.org)** (baixe a
   versão "LTS").
2. Baixe/extraia este repositório numa pasta.
3. Abra um terminal **dentro dessa pasta** (no Windows: entra na pasta pelo
   Explorer, clica com botão direito → "Abrir no Terminal"; no
   Mac/Linux: `cd caminho/da/pasta`).
4. Copie o arquivo de exemplo de variáveis de ambiente:

   ```sh
   cp .env.example .env
   ```

   (No Windows, se `cp` não funcionar, pode simplesmente duplicar o arquivo
   `.env.example` no Explorer e renomear a cópia para `.env`.)

5. Abra o arquivo `.env` recém-criado num editor de texto (Bloco de Notas,
   VS Code, o que tiver) e preencha os campos com o que você pegou na
   Parte 3:

   ```
   SUPABASE_PROJECT_ID="xxxxxxxx"
   SUPABASE_PUBLISHABLE_KEY="sb_publishable_...ou_eyJ..."
   SUPABASE_URL="https://xxxxxxxx.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="sb_secret_...ou_eyJ..."

   VITE_SUPABASE_PROJECT_ID="xxxxxxxx"
   VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_...ou_eyJ..."
   VITE_SUPABASE_URL="https://xxxxxxxx.supabase.co"
   ```

   Repare: o `PROJECT_ID` é só o pedacinho antes de `.supabase.co` na URL.
   As linhas com `VITE_` na frente repetem os mesmos valores das de cima
   (menos a `service_role`, que **não** tem versão `VITE_`).

6. Salve o arquivo.

---

## Parte 5 — Rodar o projeto

No mesmo terminal:

```sh
npm install
```

(Isso baixa as dependências — demora um pouco na primeira vez, só espera.)

```sh
npm run dev
```

O terminal vai mostrar algo como `Local: http://localhost:3000`. Abre esse
endereço no navegador.

✅ **Checkpoint**: o site deve carregar mostrando o wiki, com a página
"Bem-vindo" que veio de exemplo no script SQL.

---

## Parte 6 — Criar seu usuário e virar admin

Importante: este wiki **não tem tela de cadastro público**. Se você for em
`/auth`, só existe login — de propósito, pra ninguém conseguir criar conta
sozinho no seu wiki. Toda conta, incluindo a primeira (a sua), é criada
**pelo painel do Supabase**, não pelo site.

1. No painel do Supabase, vá em **Authentication → Users**.
2. Clique em **Add user → Create new user**.
3. Preencha email e senha (marque **Auto Confirm User**, senão ele fica
   pendente de confirmação por email, que você provavelmente não configurou
   ainda).
4. Clique em **Create user**. Ele já aparece na lista — copie o **UID** dele
   (código tipo `a1b2c3d4-...`).
5. Vá em **SQL Editor → New query** e cole, trocando pelo UID copiado:

   ```sql
   insert into public.user_roles (user_id, role)
   values ('COLE-SEU-UID-AQUI', 'admin');
   ```

6. Clique em **Run**.
7. Vá no site em `/auth` e entre com o email/senha que você acabou de criar
   no painel. Deve funcionar e te levar pro `/admin`.

Pra dar acesso a mais alguém no futuro, é o mesmo processo: você (admin) cria
o usuário pelo painel do Supabase e decide se ele ganha o papel `admin` ou
fica sem papel nenhum (só consegue ler, não editar).

---

## Deu tudo certo? Resumo do que você acabou de montar

- Um banco de dados seu, isolado, com suas próprias regras de acesso.
- Um site rodando localmente conectado a esse banco.
- Uma conta sua com permissão de admin nesse wiki.

Se quiser colocar no ar pra outras pessoas acessarem (não só na sua
máquina), veja a seção **"Build de produção"** no `README.md` — publicar em
Vercel, Netlify ou Cloudflare Pages é gratuito no plano básico e leva mais
uns 5 minutos.
