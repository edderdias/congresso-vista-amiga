-- 1. Criar Tipos Enumerados (Enums) se não existirem
DO $$ BEGIN
    CREATE TYPE public.designation_type AS ENUM ('sound', 'attendant', 'literature', 'cleaning', 'security');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.pioneer_status AS ENUM ('publicador', 'pioneiro_auxiliar', 'pioneiro_regular');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.territory_status AS ENUM ('available', 'assigned', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Garantir que a tabela profiles existe (base para outras tabelas)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela groups
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_number INTEGER NOT NULL,
  overseer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assistant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  field_service_meeting TEXT,
  publisher_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar/Atualizar tabela preaching_reports
CREATE TABLE IF NOT EXISTS public.preaching_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_name TEXT,
  group_id INTEGER,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  hours INTEGER DEFAULT 0,
  placements INTEGER DEFAULT 0,
  videos INTEGER DEFAULT 0,
  return_visits INTEGER DEFAULT 0,
  bible_studies INTEGER DEFAULT 0,
  notes TEXT,
  pioneer_status public.pioneer_status DEFAULT 'publicador',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna pioneer_status se não existir (caso a tabela já exista)
DO $$ BEGIN
    ALTER TABLE public.preaching_reports ADD COLUMN pioneer_status public.pioneer_status DEFAULT 'publicador';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 5. Criar tabela publishers
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

-- 6. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preaching_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas de acesso simplificadas para usuários autenticados
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'groups', 'preaching_reports', 'publishers')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Permitir tudo para autenticados" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Permitir tudo para autenticados" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;