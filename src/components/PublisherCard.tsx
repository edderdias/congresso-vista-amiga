"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dedupeReports, reportTotalHours } from "@/lib/reports";
import { isAuxPioneerInMonth } from "@/lib/pioneiro";

interface PublisherCardProps {
  publisher: any;
  reports: any[];
  /** Ano em que o ano de serviço começa (Setembro deste ano a Agosto do seguinte). */
  serviceYearStart: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Marca "X" feita com borda + texto: imprime mesmo sem "gráficos de plano de fundo". */
function Mark({ checked }: { checked: boolean }) {
  return (
    <span className="mx-auto flex h-[15px] w-[15px] items-center justify-center border border-black text-[11px] font-black leading-none">
      {checked ? "X" : ""}
    </span>
  );
}

/** Remove o marcador legado "[Créditos: N]" que ficava embutido na observação. */
const cleanNotes = (raw?: string | null) =>
  (raw || "").replace(/\[Créditos:\s*\d+\]\s*/gi, "").trim();

/**
 * Participou no campo: vale o campo explícito do relatório, porque o publicador
 * comum apenas marca "participei", sem informar horas. Relatórios antigos sem
 * o campo caem no cálculo por horas/estudos.
 */
const didParticipate = (r: any) => {
  if (!r) return false;
  if (r.participated !== null && r.participated !== undefined) return !!r.participated;
  return reportTotalHours(r) > 0 || (r.bible_studies || 0) > 0;
};

export function PublisherCard({ publisher, reports, serviceYearStart, open, onOpenChange }: PublisherCardProps) {
  if (!publisher) return null;

  // Ano de serviço escolhido ao abrir o cartão: Setembro deste ano a Agosto do seguinte
  const startYear = serviceYearStart;

  const months = [
    { name: "Setembro", month: 9 }, { name: "Outubro", month: 10 }, { name: "Novembro", month: 11 }, { name: "Dezembro", month: 12 },
    { name: "Janeiro", month: 1 }, { name: "Fevereiro", month: 2 }, { name: "Março", month: 3 }, { name: "Abril", month: 4 },
    { name: "Maio", month: 5 }, { name: "Junho", month: 6 }, { name: "Julho", month: 7 }, { name: "Agosto", month: 8 }
  ];

  /**
   * Pioneiro auxiliar é mês a mês: normalmente vem do próprio relatório, pois
   * pode ser auxiliar em um mês e não no outro. Quando o relatório é antigo e
   * não tem pioneer_status, usa o período cadastrado no publicador (tempo
   * indeterminado, um único mês ou intervalo de meses).
   */
  const isAuxPioneer = (report: any, month: number, year: number) => {
    if (!report) return false;
    if (report.pioneer_status) return report.pioneer_status === "pioneiro_auxiliar";
    return isAuxPioneerInMonth(publisher, year, month);
  };

  // Um lançamento por mês, igual à página de Pioneiros
  const monthlyReports = dedupeReports(reports || []);

  const serviceYearReports = months.map(m => {
    const year = m.month >= 9 ? startYear : startYear + 1;
    const report = monthlyReports.find(r => r.month === m.month && r.year === year);
    return {
      ...m,
      year,
      report,
      participated: didParticipate(report),
      studies: report?.bible_studies || 0,
      auxPioneer: isAuxPioneer(report, m.month, year),
      hours: reportTotalHours(report),
      credits: report?.credits || 0,
      notes: cleanNotes(report?.notes)
    };
  });

  const totalHours = serviceYearReports.reduce((acc, m) => acc + m.hours, 0);
  const totalStudies = serviceYearReports.reduce((acc, m) => acc + m.studies, 0);
  const totalCredits = serviceYearReports.reduce((acc, m) => acc + m.credits, 0);
  const participatedMonths = serviceYearReports.filter(m => m.participated).length;
  const auxPioneerMonths = serviceYearReports.filter(m => m.auxPioneer).length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="publisher-card-dialog max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="print:hidden">
          <div className="flex justify-between items-center pr-8">
            <DialogTitle className="text-xl font-bold">Cartão de Registro de Publicador</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir / Salvar PDF
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4 font-sans text-sm">
          <style>{`
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              html, body { background: #fff !important; }
              /* O diálogo é renderizado fora do #root, então dá para tirar o app da impressão */
              #root { display: none !important; }
              /* Esconde o overlay escuro e tudo que não faz parte do cartão */
              body * { visibility: hidden !important; }
              .print-content, .print-content * { visibility: visible !important; }
              .print-hidden { display: none !important; }
              .publisher-card-dialog {
                position: static !important;
                transform: none !important;
                display: block !important;
                width: 100% !important;
                max-width: none !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 0 !important;
                border: 0 !important;
                box-shadow: none !important;
              }
              .print-content { width: 100% !important; }
              table { page-break-inside: auto; }
              tr { page-break-inside: avoid; break-inside: avoid; }
            }
          `}</style>

          <div className="print-content space-y-4">
            <div className="text-center border-b-2 border-black pb-2 mb-4">
              <h1 className="text-xl font-black uppercase tracking-tighter">Cartão de Registro de Publicador</h1>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3 border-2 border-black p-4 rounded-sm">
              <div className="col-span-2 border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Nome</p>
                <p className="text-base font-bold">{publisher.full_name}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Grupo</p>
                <p className="text-base font-bold"># {publisher.group_number || "-"}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Sexo</p>
                <p className="text-base font-bold">{publisher.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Data de Nascimento</p>
                <p className="font-bold">{publisher.birth_date ? format(parseISO(publisher.birth_date), "dd/MM/yyyy") : "-"}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Data de Batismo</p>
                <p className="font-bold">{publisher.baptism_date ? format(parseISO(publisher.baptism_date), "dd/MM/yyyy") : "-"}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Esperança</p>
                <p className="font-bold">{publisher.hope === 'anointed' ? 'Ungido' : 'Outras Ovelhas'}</p>
              </div>
              <div className="border-b border-slate-300 pb-1">
                <p className="text-[9px] font-bold uppercase text-slate-500">Privilégios</p>
                <p className="font-bold truncate">{publisher.privileges?.join(", ") || "-"}</p>
              </div>
            </div>

            <div className="border-2 border-black rounded-sm overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-100 border-b-2 border-black">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[120px] font-black text-black border-r border-black">ANO: {startYear}/{startYear + 1}</TableHead>
                    <TableHead className="w-[70px] text-center font-black text-black border-r border-black">Participou</TableHead>
                    <TableHead className="w-[60px] text-center font-black text-black border-r border-black">Estudos</TableHead>
                    <TableHead className="w-[55px] text-center font-black text-black border-r border-black">P. Aux</TableHead>
                    <TableHead className="w-[60px] text-center font-black text-black border-r border-black">Horas</TableHead>
                    <TableHead className="font-black text-black">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceYearReports.map((m, i) => (
                    <TableRow key={i} className="h-9 border-b border-slate-300 hover:bg-transparent">
                      <TableCell className="font-bold bg-slate-50 border-r border-black">
                        {m.name} <span className="text-[9px] font-normal text-slate-500">/{String(m.year).slice(-2)}</span>
                      </TableCell>
                      <TableCell className="text-center border-r border-black">
                        <Mark checked={m.participated} />
                      </TableCell>
                      <TableCell className="text-center font-bold border-r border-black">{m.studies || ""}</TableCell>
                      <TableCell className="text-center border-r border-black">
                        <Mark checked={m.auxPioneer} />
                      </TableCell>
                      <TableCell className="text-center font-bold border-r border-black leading-tight">
                        {m.hours || ""}
                        {m.credits > 0 && (
                          <span className="block text-[8px] font-normal text-slate-500">
                            {m.report?.hours || 0}+{m.credits}c
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-[11px] leading-tight">
                        {m.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-100 font-black border-t-2 border-black hover:bg-slate-100">
                    <TableCell className="text-right border-r border-black">TOTAIS:</TableCell>
                    <TableCell className="text-center border-r border-black">{participatedMonths}</TableCell>
                    <TableCell className="text-center border-r border-black">{totalStudies}</TableCell>
                    <TableCell className="text-center border-r border-black">{auxPioneerMonths}</TableCell>
                    <TableCell className="text-center border-r border-black">{totalHours}</TableCell>
                    <TableCell className="text-[10px] font-normal">
                      {totalCredits > 0 ? `Inclui ${totalCredits}h de crédito` : ""}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <p className="text-[9px] text-slate-500 leading-tight">
              Participou: mês com participação no ministério, mesmo sem horas informadas.
              P. Aux: mês servido como pioneiro auxiliar. Totais, na ordem: meses de participação,
              estudos, meses de pioneiro auxiliar e horas do ano de serviço.
            </p>

            <div className="mt-4 text-[10px] text-slate-400 italic text-right">
              Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
