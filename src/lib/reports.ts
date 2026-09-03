/**
 * Regras de leitura dos relatórios de pregação.
 *
 * Ficam aqui, e não dentro de cada tela, para que a página de Pioneiros e o
 * cartão de registro do publicador somem exatamente as mesmas linhas.
 */

/** Total de horas do mês: usa total_hours quando existir, senão horas + créditos. */
export const reportTotalHours = (report: any): number => {
  if (!report) return 0;
  return report.total_hours !== null && report.total_hours !== undefined
    ? report.total_hours
    : (report.hours || 0) + (report.credits || 0);
};

/** Mais recente entre updated_at e created_at, para desempatar lançamentos repetidos. */
const reportTimestamp = (report: any): string =>
  report?.updated_at || report?.created_at || "";

/**
 * Deixa um único relatório por publicador/mês/ano.
 *
 * Quando o mesmo mês foi lançado mais de uma vez (o formulário público não
 * consegue ler os relatórios existentes para checar duplicidade), vence o
 * lançamento mais recente — sem isso, uma soma conta o mês duas vezes e a
 * outra conta uma só.
 */
export const dedupeReports = (reports: any[]): any[] => {
  const byMonth = new Map<string, any>();

  for (const report of reports || []) {
    const key = `${report.publisher_id}|${report.year}|${report.month}`;
    const current = byMonth.get(key);

    if (
      !current ||
      reportTimestamp(report) > reportTimestamp(current) ||
      (reportTimestamp(report) === reportTimestamp(current) && report.id > current.id)
    ) {
      byMonth.set(key, report);
    }
  }

  return Array.from(byMonth.values());
};
