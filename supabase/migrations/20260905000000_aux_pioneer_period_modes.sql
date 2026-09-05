-- ============================================================
-- Pioneiro Auxiliar: período com 3 modos
--   indeterminado | mes_unico (um único mês) | periodo (intervalo)
-- ============================================================

-- 1. Novo campo: mês de início (usado por 'mes_unico' e 'periodo')
ALTER TABLE public.publishers
  ADD COLUMN IF NOT EXISTS aux_pioneer_start_month TEXT;

-- 2. Migra o modo legado 'mes_final' -> 'periodo'
--    (mantém o aux_pioneer_end_month; início fica em aberto)
UPDATE public.publishers
  SET aux_pioneer_mode = 'periodo'
  WHERE aux_pioneer_mode = 'mes_final';

-- 3. Garante o default correto para cadastros novos
ALTER TABLE public.publishers
  ALTER COLUMN aux_pioneer_mode SET DEFAULT 'indeterminado';

-- 4. Valida os valores possíveis do modo
ALTER TABLE public.publishers
  DROP CONSTRAINT IF EXISTS publishers_aux_pioneer_mode_check;
ALTER TABLE public.publishers
  ADD CONSTRAINT publishers_aux_pioneer_mode_check
  CHECK (aux_pioneer_mode IS NULL OR aux_pioneer_mode IN ('indeterminado', 'mes_unico', 'periodo'));
