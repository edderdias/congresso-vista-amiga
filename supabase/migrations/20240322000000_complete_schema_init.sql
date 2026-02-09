-- 1. Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criar Tipos Enumerados (Enums)
DO $$ BEGIN
    CREATE TYPE public.designation_type AS ENUM ('sound', 'attendant', 'literature', 'cleaning', 'security');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.pioneer_status AS ENUM ('publicador', 'pioneiro_auxiliar', 'pioneiro_regular');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE public.territory_status AS ENUM ('available', 'assigned', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Grupos (Groups)
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

-- 5. Tabela de Publicadores (Publishers)
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

-- 6. Tabela de Relatórios (Preaching Reports)
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

-- 7. Tabela de Territórios (Territories)
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  number TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.territory_status DEFAULT 'available',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Designações (Designations)
CREATE TABLE IF NOT EXISTS public.designations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  designation_type public.designation_type NOT NULL,
  meeting_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preaching_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

-- 10. Criar políticas de acesso para usuários autenticados
DO $$ 
DECLARE
    t text;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables 
             WHERE table_schema = 'public' 
             AND table_name IN ('profiles', 'groups', 'publishers', 'preaching_reports', 'territories', 'designations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all for authenticated" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Allow all for authenticated" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t);
    END LOOP;
END $$;