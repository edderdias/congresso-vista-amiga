-- Criar tabela de publicadores
CREATE TABLE IF NOT EXISTS public.publishers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  birth_date DATE,
  baptism_date DATE,
  gender TEXT CHECK (gender IN ('M', 'F')),
  privileges TEXT[] DEFAULT '{}',
  hope TEXT CHECK (hope IN ('anointed', 'other_sheep')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso para usuários autenticados
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'publishers' AND policyname = 'Permitir tudo para usuários autenticados'
  ) THEN
    CREATE POLICY "Permitir tudo para usuários autenticados" ON public.publishers
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;