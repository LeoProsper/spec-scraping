-- Criar usuário lelevitormkt@gmail.com com senha: kaix123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'lelevitormkt@gmail.com',
  -- Senha: kaix123 (bcrypt hash)
  '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE67XO0MZJ7k.P0bIiC8Hqfz3MvtZi',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  ''
)
ON CONFLICT (email) DO UPDATE SET
  email_confirmed_at = NOW(),
  encrypted_password = EXCLUDED.encrypted_password;
