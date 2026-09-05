/**
 * Regras do período de Pioneiro Auxiliar.
 *
 * O privilégio "Pioneiro Auxiliar" pode valer por tempo indeterminado, por um
 * único mês ou por um intervalo de meses. Estas funções dizem se, em um mês
 * específico, o publicador está de fato servindo como pioneiro auxiliar — tanto
 * na hora de classificar um relatório quanto na hora de contar no dashboard.
 */

export type AuxPioneerMode = "indeterminado" | "mes_unico" | "periodo";

export type PioneerStatus = "publicador" | "pioneiro_auxiliar" | "pioneiro_regular";

/** Só os campos do publicador que interessam para decidir o período de auxiliar. */
export interface AuxPioneerInfo {
  privileges?: string[] | null;
  aux_pioneer_mode?: string | null;
  aux_pioneer_start_month?: string | null;
  aux_pioneer_end_month?: string | null;
}

/** "YYYY-MM" -> índice comparável (ano * 12 + mês). Retorna null quando inválido. */
const monthIndex = (value?: string | null): number | null => {
  if (!value) return null;
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return null;
  return year * 12 + month;
};

/**
 * Normaliza o modo salvo, absorvendo o valor legado "mes_final" (que só tinha
 * mês final) como um "periodo" sem início definido.
 */
export const normalizeAuxPioneerMode = (mode?: string | null): AuxPioneerMode => {
  if (mode === "mes_unico") return "mes_unico";
  if (mode === "periodo" || mode === "mes_final") return "periodo";
  return "indeterminado";
};

/**
 * O publicador está servindo como pioneiro auxiliar no mês informado?
 *
 * `month` é 1-12. Sem o privilégio "Pioneiro Auxiliar", é sempre falso. Quando o
 * modo depende de um mês que não foi preenchido, cai no comportamento mais
 * aberto (conta o mês), para não esconder relatórios de cadastros incompletos.
 */
export const isAuxPioneerInMonth = (
  publisher: AuxPioneerInfo | null | undefined,
  year: number,
  month: number
): boolean => {
  if (!publisher?.privileges?.includes("Pioneiro Auxiliar")) return false;

  const mode = normalizeAuxPioneerMode(publisher.aux_pioneer_mode);
  if (mode === "indeterminado") return true;

  const target = year * 12 + month;
  const start = monthIndex(publisher.aux_pioneer_start_month);
  const end = monthIndex(publisher.aux_pioneer_end_month);

  if (mode === "mes_unico") {
    return start === null || target === start;
  }

  // "periodo": entre o mês de início e o de fim (qualquer um pode faltar)
  if (start !== null && target < start) return false;
  if (end !== null && target > end) return false;
  return true;
};

/**
 * Status a gravar no relatório de um publicador para o mês/ano informado.
 * Pioneiro regular é privilégio fixo; auxiliar depende do mês.
 */
export const resolvePioneerStatus = (
  publisher: AuxPioneerInfo | null | undefined,
  year: number,
  month: number
): PioneerStatus => {
  if (publisher?.privileges?.includes("Pioneiro Regular")) return "pioneiro_regular";
  if (isAuxPioneerInMonth(publisher, year, month)) return "pioneiro_auxiliar";
  return "publicador";
};
