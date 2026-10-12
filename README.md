# ISFA Equipamentos Hospitalares — site e gestão de produtos

React + Vite + TypeScript + Tailwind, com Supabase (base de dados, login e fotografias) e publicação na Vercel.

## 1. Criar o Supabase (uma vez)

1. Crie um projeto em supabase.com.
2. No **SQL Editor**, execute por esta ordem: `supabase/schema.sql` e depois `supabase/seed.sql` (lista inicial de 29 produtos).
3. Em **Authentication > Sign In / Providers**, desligue **Allow new users to sign up** (só a equipa deve ter contas).
4. Em **Authentication > Users > Add user**, crie a conta do primeiro administrador (email + palavra-passe forte).
5. No SQL Editor, dê-lhe permissão de gestão (substitua o email):

       insert into public.admin_users (user_id)
       select id from auth.users where email = 'EMAIL-DO-ADMIN';

   Não existe palavra-passe nem administrador por defeito. Só quem estiver em `admin_users` consegue alterar produtos, stock e fotografias, e isso é verificado pela base de dados (RLS), não pelo site.
6. Em **Project Settings > API**, copie a *Project URL* e a chave pública (*anon / publishable*).

## 2. Publicar na Vercel

1. Envie este projeto para o GitHub e importe-o na Vercel (Framework: Vite; build `npm run build`; saída `dist`).
2. Em **Settings > Environment Variables**, crie `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (ver `.env.example`).
3. Faça o deploy. HTTPS e os cabeçalhos de segurança (`vercel.json`) ficam ativos automaticamente.

Nunca coloque a chave `service_role` no projeto nem na Vercel.

## 3. Usar a gestão

- Abra `https://O-SEU-DOMINIO/#gestao` (ou "Área da equipa" no rodapé) e entre com a conta de administrador.
- **Novo produto**: nome, categoria, descrições, especificações, preço, stock e fotografias. Escolha a foto de perfil.
- Publicar mostra o produto no site; guardar como rascunho esconde-o. Preço e quantidade só aparecem no site se marcar as opções.
- Alterações de stock ficam no histórico, com motivo.

## 4. Desenvolvimento local

    npm install
    cp .env.example .env   # preencha as duas variáveis
    npm run dev

Sem `.env`, o site abre em modo de leitura com os dados de exemplo (`src/data/seed.json`) e sem gestão.

## O que ainda não existe

- Sitemap (precisa do domínio final), páginas de Política de Privacidade e Termos, e uma página própria por produto (hoje cada produto abre numa janela).
- Pedidos de contacto por formulário: os pedidos são feitos pelo WhatsApp.
- Backups automáticos e recuperação de conta de administrador dependem do plano do Supabase e do fluxo "Forgot password" do Supabase Auth, ainda não ligado ao site.
- Estas funcionalidades de segurança não foram testadas contra um projeto Supabase real (ainda não foi criado); teste o login, a gravação e o bloqueio de utilizadores sem permissão antes de divulgar o site.
