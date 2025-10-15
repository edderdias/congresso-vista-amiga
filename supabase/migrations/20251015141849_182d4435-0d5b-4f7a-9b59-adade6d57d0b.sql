-- Create enum types
CREATE TYPE public.territory_status AS ENUM ('available', 'assigned', 'completed');
CREATE TYPE public.designation_type AS ENUM ('sound', 'attendant', 'literature', 'cleaning', 'security');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create preaching reports table
CREATE TABLE public.preaching_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  hours INTEGER DEFAULT 0,
  placements INTEGER DEFAULT 0,
  videos INTEGER DEFAULT 0,
  return_visits INTEGER DEFAULT 0,
  bible_studies INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

ALTER TABLE public.preaching_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reports" ON public.preaching_reports FOR SELECT USING (true);
CREATE POLICY "Users can insert own reports" ON public.preaching_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.preaching_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.preaching_reports FOR DELETE USING (auth.uid() = user_id);

-- Create territories table
CREATE TABLE public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status territory_status DEFAULT 'available',
  assigned_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all territories" ON public.territories FOR SELECT USING (true);
CREATE POLICY "Users can insert territories" ON public.territories FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update territories" ON public.territories FOR UPDATE USING (true);
CREATE POLICY "Users can delete territories" ON public.territories FOR DELETE USING (true);

-- Create designations table
CREATE TABLE public.designations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designation_type designation_type NOT NULL,
  meeting_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all designations" ON public.designations FOR SELECT USING (true);
CREATE POLICY "Users can insert designations" ON public.designations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update designations" ON public.designations FOR UPDATE USING (true);
CREATE POLICY "Users can delete designations" ON public.designations FOR DELETE USING (true);

-- Create function for updating updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preaching_reports_updated_at BEFORE UPDATE ON public.preaching_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_territories_updated_at BEFORE UPDATE ON public.territories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_designations_updated_at BEFORE UPDATE ON public.designations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();