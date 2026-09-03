"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Star, TrendingUp, AlertCircle, CheckCircle2, Users, Calendar, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { dedupeReports, reportTotalHours } from "@/lib/reports";

export default function Pioneers() {
  const [pioneers, setPioneers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceYearLabel, setServiceYearLabel] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterName, setFilterName] = useState("");

  const currentServiceYearStart = (() => {
    const now = new Date();
    let s = now.getFullYear();
    if (now.getMonth() < 8) s--;
    return s;
  })();

  const [filterServiceYear, setFilterServiceYear] = useState<string>(currentServiceYearStart.toString());

  const serviceYearOptions = Array.from({ length: 6 }, (_, i) => {
    const s = currentServiceYearStart - i;
    return { v: s.toString(), l: `${s}/${s + 1}` };
  });

  const months = [
    { v: "9", l: "Setembro" }, { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" },
    { v: "1", l: "Janeiro" }, { v: "2", l: "Fevereiro" }, { v: "3", l: "Março" }, { v: "4", l: "Abril" },
    { v: "5", l: "Maio" }, { v: "6", l: "Junho" }, { v: "7", l: "Julho" }, { v: "8", l: "Agosto" }
  ];

  useEffect(() => {
    loadData();
  }, [filterMonth, filterServiceYear]);

  const loadData = async () => {
    setLoading(true);

    const startYear = parseInt(filterServiceYear);
    const endYear = startYear + 1;

    setServiceYearLabel(`${startYear}/${endYear}`);

    // 1. Buscar todos os publicadores que tenham "Pioneiro Regular" no array de privilégios
    const { data: pubs, error: pubsError } = await supabase
      .from("publishers")
      .select("id, full_name, privileges, group_id, groups!publishers_group_id_fkey(group_number), status")
      .neq("status", "mudou");

    if (pubsError) {
      console.error("Erro ao buscar publicadores:", pubsError);
      return setLoading(false);
    }

    const regularPioneers = (pubs || []).filter(p => 
      p.privileges && Array.isArray(p.privileges) && p.privileges.includes("Pioneiro Regular")
    );

    // 2. Buscar relatórios estritamente dentro do ano de serviço (Setembro do ano de início a Agosto do ano final)
    //    Busca só os relatórios dos pioneiros: puxar os da congregação inteira
    //    passava do limite de 1000 linhas por resposta do Supabase e cortava
    //    meses silenciosamente, deixando a soma menor que a do cartão.
    const pioneerIds = regularPioneers.map(p => p.id);
    const { data: rawReports } = pioneerIds.length
      ? await supabase
          .from("preaching_reports")
          .select("*")
          .in("publisher_id", pioneerIds)
          .or(`and(year.eq.${startYear},month.gte.9),and(year.eq.${endYear},month.lte.8)`)
      : { data: [] as any[] };

    // Um lançamento por mês, igual ao cartão do publicador
    const reports = dedupeReports(rawReports || []);

    // 3. Calcular meses decorridos no ano de serviço até o mês selecionado
    const selectedM = parseInt(filterMonth);
    const monthsCount = selectedM >= 9 ? (selectedM - 8) : (4 + selectedM);
    const validMonthsCount = monthsCount > 0 ? monthsCount : 1;
    const targetFilterYear = selectedM >= 9 ? startYear : endYear;

    // 4. Processar dados para a lista de pioneiros
    const processedPioneers = regularPioneers.map(p => {
      const pReports = (reports || []).filter(r => {
        if (r.publisher_id !== p.id) return false;

        // Verificar se pertence ao ano de serviço atual
        const isCurrentServiceYear = (r.year === startYear && r.month >= 9) || (r.year === endYear && r.month <= 8);
        if (!isCurrentServiceYear) return false;

        // Filtrar até o mês selecionado no filtro
        if (r.year < targetFilterYear) return true;
        if (r.year === targetFilterYear && r.month <= selectedM) return true;
        return false;
      });

      const totalCredits = pReports.reduce((acc, r) => acc + (r.credits || 0), 0);
      const totalHours = pReports.reduce((acc, r) => acc + reportTotalHours(r), 0);

      const totalStudies = pReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0);
      const avgHours = totalHours / validMonthsCount;
      const avgStudies = totalStudies / validMonthsCount;

      return {
        ...p,
        totalCredits,
        totalHours,
        totalStudies,
        avgHours,
        avgStudies,
        status: avgHours >= 50 ? "success" : "alert"
      };
    });

    // 5. Processar dados para o gráfico (Setembro do ano inicial até Agosto do ano final)
    const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
    const monthNames: Record<number, string> = {
      1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
      7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
    };

    const monthlyStats = monthsOrder.map(m => {
      const year = m >= 9 ? startYear : endYear;
      const pioneerIds = new Set(regularPioneers.map(p => p.id));
      const monthReports = reports?.filter(r => r.month === m && r.year === year && pioneerIds.has(r.publisher_id)) || [];
      
      return {
        name: monthNames[m],
        horas: monthReports.reduce((acc, r) => acc + reportTotalHours(r), 0),
        estudos: monthReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0)
      };
    });

    setPioneers(processedPioneers.sort((a, b) => b.avgHours - a.avgHours));
    setChartData(monthlyStats);
    setLoading(false);
  };

  // Busca por nome ignorando acentos e maiúsculas ("jose" acha "José")
  const normalizeName = (value: string) =>
    value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

  const nameQuery = normalizeName(filterName.trim());
  const filteredPioneers = nameQuery
    ? pioneers.filter(p => normalizeName(p.full_name || "").includes(nameQuery))
    : pioneers;

  if (loading) return <div className="p-8 text-center">Carregando dados dos pioneiros...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-8 w-8 text-amber-500 fill-amber-500" /> 
            Pioneiros Regulares
          </h1>
          <p className="text-muted-foreground">Acompanhamento do ano de serviço {serviceYearLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
            <Label className="text-xs font-bold flex items-center gap-1 whitespace-nowrap">
              <Calendar className="h-3 w-3" /> Ano letivo:
            </Label>
            <Select
              value={filterServiceYear}
              onValueChange={(v) => {
                setFilterServiceYear(v);
                // Anos anteriores já estão completos: calcular o ano de serviço inteiro
                setFilterMonth(v === currentServiceYearStart.toString()
                  ? (new Date().getMonth() + 1).toString()
                  : "8");
              }}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {serviceYearOptions.map(y => (
                  <SelectItem key={y.v} value={y.v}>{y.l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="text-sm py-1 px-3 border-amber-200 bg-amber-50 text-amber-700">
            Média alvo: 50h / mês
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 uppercase">Total de Pioneiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-900">{pioneers.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600 uppercase">Acima da Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-green-900">{pioneers.filter(p => p.status === 'success').length}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 uppercase">Abaixo da Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-900">{pioneers.filter(p => p.status === 'alert').length}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progresso de Horas (Mensal)
            </CardTitle>
            <CardDescription>Soma total de horas de todos os pioneiros</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line name="Horas Totais" type="monotone" dataKey="horas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Progresso de Estudos (Mensal)
            </CardTitle>
            <CardDescription>Soma total de estudos bíblicos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Estudos Totais" dataKey="estudos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Lista de Acompanhamento</CardTitle>
            <CardDescription>
              Média calculada de Setembro até o mês selecionado
              {nameQuery && ` — mostrando ${filteredPioneers.length} de ${pioneers.length} pioneiros`}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="relative w-full sm:w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Filtrar pelo nome do pioneiro"
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                className="h-9 pl-9 pr-9 text-xs"
              />
              {filterName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFilterName("")}
                  title="Limpar filtro"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
              <Label className="text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                <Calendar className="h-3 w-3" /> Calcular até:
              </Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pioneiro</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-center">Total Crédito</TableHead>
                  <TableHead className="text-center">Total Horas</TableHead>
                  <TableHead className="text-center">Média Horas</TableHead>
                  <TableHead className="text-center">Total Estudos</TableHead>
                  <TableHead className="text-center">Média Estudos</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPioneers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {nameQuery
                        ? `Nenhum pioneiro encontrado com "${filterName.trim()}".`
                        : "Nenhum pioneiro regular encontrado."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPioneers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.full_name}</TableCell>
                      <TableCell>G{p.groups?.group_number || "-"}</TableCell>
                      <TableCell className="text-center font-medium">{p.totalCredits}</TableCell>
                      <TableCell className="text-center font-medium">{p.totalHours}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn(
                          "font-bold",
                          p.avgHours >= 50 ? "text-green-600 border-green-200 bg-green-50" : "text-red-600 border-red-200 bg-red-50"
                        )}>
                          {p.avgHours.toFixed(1)}h
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{p.totalStudies}</TableCell>
                      <TableCell className="text-center">{p.avgStudies.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {p.status === 'success' ? (
                          <div className="flex items-center justify-end gap-1 text-green-600 font-bold text-sm">
                            <CheckCircle2 className="h-4 w-4" /> Parabéns!
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-red-600 font-bold text-sm">
                            <AlertCircle className="h-4 w-4" /> Atenção
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}