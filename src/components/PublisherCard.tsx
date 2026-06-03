"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PublisherCardProps {
  publisher: any;
  reports: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublisherCard({ publisher, reports, open, onOpenChange }: PublisherCardProps) {
  if (!publisher) return null;

  // Determinar o ano de serviço atual (Setembro a Agosto)
  const now = new Date();
  let startYear = now.getFullYear();
  if (now.getMonth() < 8) startYear--; // Se estamos antes de Setembro, o ano começou no ano anterior

  const months = [
    { name: "Setembro", month: 9 }, { name: "Outubro", month: 10 }, { name: "Novembro", month: 11 }, { name: "Dezembro", month: 12 },
    { name: "Janeiro", month: 1 }, { name: "Fevereiro", month: 2 }, { name: "Março", month: 3 }, { name: "Abril", month: 4 },
    { name: "Maio", month: 5 }, { name: "Junho", month: 6 }, { name: "Julho", month: 7 }, { name: "Agosto", month: 8 }
  ];

  const serviceYearReports = months.map(m => {
    const year = m.month >= 9 ? startYear : startYear + 1;
    const report = reports.find(r => r.month === m.month && r.year === year);
    return { ...m, report };
  });

  const totalHours = serviceYearReports.reduce((acc, m) => acc + (m.report?.hours || 0), 0);
  const totalStudies = serviceYearReports.reduce((acc, m) => acc + (m.report?.bible_studies || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto print:p-0 print:max-w-none print:shadow-none print:border-none">
        <DialogHeader className="print:hidden">
          <div className="flex justify-between items-center pr-8">
            <DialogTitle className="text-xl font-bold">Cartão de Registro de Publicador</DialogTitle>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Imprimir
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 py-4 font-sans text-sm print:m-0">
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-content, .print-content * { visibility: visible; }
              .print-content { position: absolute; left: 0; top: 0; width: 100%; }
              .print-hidden { display: none !important; }
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
                    <TableHead className="text-center font-black text-black border-r border-black">Participou</TableHead>
                    <TableHead className="text-center font-black text-black border-r border-black">Estudos</TableHead>
                    <TableHead className="text-center font-black text-black border-r border-black">P. Aux</TableHead>
                    <TableHead className="text-center font-black text-black border-r border-black">Horas</TableHead>
                    <TableHead className="font-black text-black">Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceYearReports.map((m, i) => (
                    <TableRow key={i} className="h-9 border-b border-slate-300 hover:bg-transparent">
                      <TableCell className="font-bold bg-slate-50 border-r border-black">{m.name}</TableCell>
                      <TableCell className="text-center border-r border-black">
                        <div className="flex justify-center">
                          <Checkbox checked={!!m.report?.hours || !!m.report?.bible_studies || m.report?.notes?.toLowerCase().includes("participou")} disabled className="border-black" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold border-r border-black">{m.report?.bible_studies || ""}</TableCell>
                      <TableCell className="text-center border-r border-black">
                        <div className="flex justify-center">
                          <Checkbox checked={m.report?.pioneer_status === 'pioneiro_auxiliar'} disabled className="border-black" />
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold border-r border-black">{m.report?.hours || ""}</TableCell>
                      <TableCell className="text-[11px] leading-tight">
                        {m.report?.notes || ""}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-slate-100 font-black border-t-2 border-black">
                    <TableCell className="text-right border-r border-black" colSpan={2}>TOTAIS:</TableCell>
                    <TableCell className="text-center border-r border-black">{totalStudies}</TableCell>
                    <TableCell className="border-r border-black"></TableCell>
                    <TableCell className="text-center border-r border-black">{totalHours}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 text-[10px] text-slate-400 italic text-right">
              Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}