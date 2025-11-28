-- Atualizar senha do usuário lelevitormkt@gmail.com
-- Nova senha: password (senha simples de teste)
UPDATE auth.users 
SET 
  encrypted_password = crypt('password', gen_salt('bf')),
  email_confirmed_at = NOW()
WHERE email = 'lelevitormkt@gmail.com';
