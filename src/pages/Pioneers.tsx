"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, subMonths, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Star, TrendingUp, AlertCircle, CheckCircle2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Pioneers() {
  const [pioneers, setPioneers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceYearLabel, setServiceYearLabel] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    const now = new Date();
    let startYear = now.getFullYear();
    if (now.getMonth() < 8) startYear--; 
    
    setServiceYearLabel(`${startYear}/${startYear + 1}`);

    // 1. Buscar todos os publicadores que tenham "Pioneiro Regular" no array de privilégios
    const { data: pubs, error: pubsError } = await supabase
      .from("publishers")
      .select("id, full_name, privileges, group_id, groups!publishers_group_id_fkey(group_number), status")
      .neq("status", "mudou");

    if (pubsError) {
      console.error("Erro ao buscar publicadores:", pubsError);
      return setLoading(false);
    }

    // Filtrar localmente para garantir precisão com o array do Postgres
    // Mesma lógica usada na tela de Publicadores para stats.regPioneers
    const regularPioneers = (pubs || []).filter(p => {
      console.log('Pioneiro ---> ' + p)
      if (!p.privileges) return false;

      const privString = typeof p.privileges === 'string' ? p.privileges : JSON.stringify(p.privileges);

      return privString.toLowerCase().includes("pioneiro regular");
    }
      // p.privileges && Array.isArray(p.privileges) && p.privileges.includes("Pioneiro Regular")
    );

    // 2. Buscar relatórios desde o início do ano de serviço (Setembro)
    const { data: reports } = await supabase
      .from("preaching_reports")
      .select("*")
      .or(`year.gt.${startYear},and(year.eq.${startYear},month.gte.9)`);

    // 3. Calcular meses decorridos (Setembro até o mês atual)
    const monthsCount = (now.getFullYear() - startYear) * 12 + (now.getMonth() - 8) + 1;
    const validMonthsCount = monthsCount > 0 ? monthsCount : 1;

    // 4. Processar dados para a lista
    const processedPioneers = regularPioneers.map(p => {
      const pReports = reports?.filter(r => r.publisher_id === p.id) || [];
      const totalHours = pReports.reduce((acc, r) => acc + (r.hours || 0), 0);
      const totalStudies = pReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0);
      const avgHours = totalHours / validMonthsCount;
      const avgStudies = totalStudies / validMonthsCount;

      return {
        ...p,
        totalHours,
        totalStudies,
        avgHours,
        avgStudies,
        status: avgHours >= 50 ? "success" : "alert"
      };
    });

    // 5. Processar dados para o gráfico (Progresso Mensal Geral dos Pioneiros)
    const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
    const monthNames: Record<number, string> = {
      1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
      7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
    };

    const monthlyStats = monthsOrder.map(m => {
      const year = m >= 9 ? startYear : startYear + 1;
      const pioneerIds = new Set(regularPioneers.map(p => p.id));
      const monthReports = reports?.filter(r => r.month === m && r.year === year && pioneerIds.has(r.publisher_id)) || [];
      
      return {
        name: monthNames[m],
        horas: monthReports.reduce((acc, r) => acc + (r.hours || 0), 0),
        estudos: monthReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0)
      };
    });

    setPioneers(processedPioneers.sort((a, b) => b.avgHours - a.avgHours));
    setChartData(monthlyStats);
    setLoading(false);
  };

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
        <Badge variant="outline" className="text-sm py-1 px-3 border-amber-200 bg-amber-50 text-amber-700">
          Média alvo: 50h / mês
        </Badge>
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
        <CardHeader>
          <CardTitle>Lista de Acompanhamento</CardTitle>
          <CardDescription>Média calculada de Setembro até o mês atual</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pioneiro</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead className="text-center">Total Horas</TableHead>
                  <TableHead className="text-center">Média Horas</TableHead>
                  <TableHead className="text-center">Total Estudos</TableHead>
                  <TableHead className="text-center">Média Estudos</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pioneers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum pioneiro regular encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  pioneers.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold">{p.full_name}</TableCell>
                      <TableCell>G{p.groups?.group_number || "-"}</TableCell>
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