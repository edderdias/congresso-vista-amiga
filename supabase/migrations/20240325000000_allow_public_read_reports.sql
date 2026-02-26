-- Permite que qualquer pessoa consulte a tabela para verificar se já existe um relatório
-- Isso é necessário para a regra de não permitir duplicidade no formulário público
CREATE POLICY "Allow public read for duplicate check" ON public.preaching_reports
FOR SELECT USING (true);