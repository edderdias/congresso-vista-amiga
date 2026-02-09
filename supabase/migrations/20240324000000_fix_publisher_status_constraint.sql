-- Este script corrige a restrição de status na tabela de publicadores
-- para permitir o valor 'repreendido' que está sendo enviado pelo sistema.

ALTER TABLE public.publishers 
DROP CONSTRAINT IF EXISTS publishers_status_check;

ALTER TABLE public.publishers 
ADD CONSTRAINT publishers_status_check 
CHECK (status IN ('active', 'inactive', 'repreendido'));