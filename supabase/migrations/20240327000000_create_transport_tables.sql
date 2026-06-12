-- Create transport_arrangements table
CREATE TABLE public.transport_arrangements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('congresso', 'assembleia')),
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_total_value BOOLEAN DEFAULT true,
  total_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transport_daily_costs table (for daily values when not total)
CREATE TABLE public.transport_daily_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arrangement_id UUID REFERENCES public.transport_arrangements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  UNIQUE(arrangement_id, date)
);

-- Create transport_members table
CREATE TABLE public.transport_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  arrangement_id UUID REFERENCES public.transport_arrangements(id) ON DELETE CASCADE,
  publisher_id UUID REFERENCES public.publishers(id) ON DELETE SET NULL,
  name TEXT, -- For non-members
  phone TEXT,
  observation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transport_payments table
CREATE TABLE public.transport_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.transport_members(id) ON DELETE CASCADE,
  date DATE, -- NULL if is_total_value is true
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transport_arrangements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_daily_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all for authenticated" ON public.transport_arrangements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.transport_daily_costs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.transport_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.transport_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Grant access
GRANT ALL ON TABLE public.transport_arrangements TO authenticated;
GRANT ALL ON TABLE public.transport_daily_costs TO authenticated;
GRANT ALL ON TABLE public.transport_members TO authenticated;
GRANT ALL ON TABLE public.transport_payments TO authenticated;
GRANT ALL ON TABLE public.transport_arrangements TO service_role;
GRANT ALL ON TABLE public.transport_daily_costs TO service_role;
GRANT ALL ON TABLE public.transport_members TO service_role;
GRANT ALL ON TABLE public.transport_payments TO service_role;