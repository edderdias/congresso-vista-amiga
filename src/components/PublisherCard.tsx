"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PublisherCardProps {
  publisher: any;
  reports: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PublisherCard({ publisher, reports, open, onOpenChange }: PublisherCardProps) {
  if (!publisher) return null;

  const now = new Date();
  let startYear = now.getFullYear();
  if (now.getMonth() < 8) startYear--;

  const months = [
    { name: "Set", month: 9 }, { name: "Out", month: 10 }, { name: "Nov", month: 11 }, { name: "Dez", month: 12 },
    { name: "Jan", month: 1 }, { name: "Fev", month: 2 }, { name: "Mar", month: 3 }, { name: "Abr", month: 4 },
    { name: "Mai", month: 5 }, { name: "Jun", month: 6 }, { name: "Jul", month: 7 }, { name: "Ago", month: 8 }
  ];

  const serviceYearReports = months.map(m => {
    const year = m.month >= 9 ? startYear : startYear + 1;
    const report = reports.find(r => r.month === m.month && r.year === year);
    return { ...m, report };
  });

  const totalHours = serviceYearReports.reduce((acc, m) => acc + (m.report?.hours || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold border-b pb-2">Cartão de Registro de Publicador</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4 font-sans text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border">
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Nome</p>
              <p className="text-lg font-bold">{publisher.full_name}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Grupo</p>
              <p className="text-lg font-bold"># {publisher.group_number || "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Sexo</p>
              <p className="text-lg font-bold">{publisher.gender === 'M' ? 'Masculino' : 'Feminino'}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Nascimento</p>
              <p className="font-bold">{publisher.birth_date ? format(parseISO(publisher.birth_date), "dd/MM/yyyy") : "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Batismo</p>
              <p className="font-bold">{publisher.baptism_date ? format(parseISO(publisher.baptism_date), "dd/MM/yyyy") : "-"}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Esperança</p>
              <p className="font-bold">{publisher.hope === 'anointed' ? 'Ungido' : 'Outras Ovelhas'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Privilégios</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {publisher.privileges?.map((p: string) => (
                  <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[80px]">{startYear}/{startYear + 1}</TableHead>
                  <TableHead className="text-center">Particip.</TableHead>
                  <TableHead className="text-center">Estudos</TableHead>
                  <TableHead className="text-center">P. Aux</TableHead>
                  <TableHead className="text-center">Horas</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceYearReports.map((m, i) => (
                  <TableRow key={i} className="h-10">
                    <TableCell className="font-bold bg-slate-50/50">{m.name}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={!!m.report?.hours || !!m.report?.bible_studies || m.report?.notes?.toLowerCase().includes("participou")} disabled />
                    </TableCell>
                    <TableCell className="text-center font-bold">{m.report?.bible_studies || ""}</TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={m.report?.pioneer_status === 'pioneiro_auxiliar'} disabled />
                    </TableCell>
                    <TableCell className="text-center font-bold">{m.report?.hours || ""}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                      {m.report?.notes || ""}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100 font-bold">
                  <TableCell colSpan={4} className="text-right">Total de Horas:</TableCell>
                  <TableCell className="text-center text-lg">{totalHours}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}