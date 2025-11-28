-- Deletar usuário se existir
DELETE FROM auth.users WHERE email = 'lelevitormkt@gmail.com';
DELETE FROM public.accounts WHERE email = 'lelevitormkt@gmail.com';

-- Criar usuário no auth.users
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'lelevitormkt@gmail.com',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) RETURNING id;

-- Criar conta no public.accounts
INSERT INTO public.accounts (
  id,
  name,
  email,
  picture_url,
  created_at
)
SELECT 
  id,
  'Leo Vitor',
  email,
  NULL,
  NOW()
FROM auth.users 
WHERE email = 'lelevitormkt@gmail.com';
