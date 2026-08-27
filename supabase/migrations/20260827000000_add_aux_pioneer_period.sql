-- Período do Pioneiro Auxiliar: tempo indeterminado ou com mês final
ALTER TABLE public.publishers
  ADD COLUMN IF NOT EXISTS aux_pioneer_mode TEXT DEFAULT 'indeterminado',
  ADD COLUMN IF NOT EXISTS aux_pioneer_end_month TEXT;
