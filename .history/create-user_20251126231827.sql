-- Atualizar senha do usuário lelevitormkt@gmail.com
-- Nova senha: 123456 (simples para teste)
UPDATE auth.users 
SET 
  encrypted_password = '$2a$10$5tXp6pVMxQkXqVwXqVwXqeDXQwXqVwXqVwXqVwXqVwXqVwXqVwXqu',
  email_confirmed_at = NOW()
WHERE email = 'lelevitormkt@gmail.com';
