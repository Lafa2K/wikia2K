-- Remove o fluxo de auto-atribuição de admin ("primeiro a clicar vira admin").
-- A partir de agora, o papel de admin só pode ser concedido manualmente,
-- via SQL Editor do Supabase, pelo responsável do projeto.
DROP FUNCTION IF EXISTS public.claim_first_admin();
