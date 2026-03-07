-- Adiciona coluna para identificar se o publicador pode ser indicador
ALTER TABLE public.publishers ADD COLUMN IF NOT EXISTS is_indicator BOOLEAN DEFAULT false;

-- Adiciona coluna para o indicador externo nas designações de AV
ALTER TABLE public.av_designations ADD COLUMN IF NOT EXISTS external_indicator_id UUID REFERENCES public.publishers(id);