"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, TrendingUp, Star, Clock, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Pioneers() {
  const [pioneers, setPioneers] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    
    // Determinar o ano de serviço atual (Setembro a Agosto)
    const now = new Date();
    let startYear = now.getFullYear();
    if (now.getMonth() < 8) startYear--; // Se antes de Setembro, o ano de serviço começou no ano anterior
    
    const serviceYearStart = new Date(startYear, 8, 1); // 1º de Setembro
    const monthsElapsed = now.getMonth() >= 8 
      ? now.getMonth() - 7 
      : now.getMonth() + 5;

    const { data: pubs } = await supabase
      .from("publishers")
      .select("*")
      .contains("privileges", ["Pioneiro Regular"])
      .in("status", ["active", "repreendido"]);

    const { data: reports } = await supabase
      .from("preaching_reports")
      .select("*")
      .gte("created_at", serviceYearStart.toISOString());

    if (pubs) {
      const processed = pubs.map(p => {
        const pReports = reports?.filter(r => r.publisher_id === p.id || r.reporter_name === p.full_name) || [];
        const totalHours = pReports.reduce((acc, r) => acc + (r.hours || 0), 0);
        const totalStudies = pReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0);
        const avgHours = monthsElapsed > 0 ? totalHours / monthsElapsed : 0;
        const avgStudies = monthsElapsed > 0 ? totalStudies / monthsElapsed : 0;

        return {
          ...p,
          totalHours,
          totalStudies,
          avgHours,
          avgStudies,
          status: avgHours < 50 ? "below" : "ok"
        };
      });
      setPioneers(processed);

      // Dados para o gráfico
      const months = ["Set", "Out", "Nov", "Dez", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"];
      const data = months.map((m, i) => {
        const monthIdx = (i + 8) % 12;
        const year = monthIdx >= 8 ? startYear : startYear + 1;
        const monthReports = reports?.filter(r => r.month === monthIdx + 1);
        return {
          name: m,
          horas: monthReports?.reduce((acc, r) => acc + (r.hours || 0), 0) || 0,
          estudos: monthReports?.reduce((acc, r) => acc + (r.bible_studies || 0), 0) || 0
        };
      });
      setChartData(data);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pioneiros Regulares</h1>
        <p className="text-muted-foreground">Acompanhamento de metas e médias do ano de serviço</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white"><Star size={20} /></div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Total de Pioneiros</p>
              <p className="text-xl font-bold text-blue-900">{pioneers.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg text-white"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-green-600 font-medium">Média de Horas Geral</p>
              <p className="text-xl font-bold text-green-900">
                {pioneers.length > 0 ? (pioneers.reduce((acc, p) => acc + p.avgHours, 0) / pioneers.length).toFixed(1) : 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg text-white"><BookOpen size={20} /></div>
            <div>
              <p className="text-xs text-purple-600 font-medium">Média de Estudos Geral</p>
              <p className="text-xl font-bold text-purple-900">
                {pioneers.length > 0 ? (pioneers.reduce((acc, p) => acc + p.avgStudies, 0) / pioneers.length).toFixed(1) : 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso Mensal (Todos os Pioneiros)</CardTitle>
          <CardDescription>Soma de horas e estudos de Setembro a Agosto</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Horas" dataKey="horas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Estudos" dataKey="estudos" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pioneiros</CardTitle>
          <CardDescription>Média calculada desde Setembro</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Total Horas</TableHead>
                <TableHead>Média Horas</TableHead>
                <TableHead>Total Estudos</TableHead>
                <TableHead>Média Estudos</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pioneers.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.full_name}</TableCell>
                  <TableCell>{p.totalHours}</TableCell>
                  <TableCell className={p.avgHours < 50 ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                    {p.avgHours.toFixed(1)}
                  </TableCell>
                  <TableCell>{p.totalStudies}</TableCell>
                  <TableCell>{p.avgStudies.toFixed(1)}</TableCell>
                  <TableCell>
                    {p.avgHours < 50 ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertCircle size={12} /> Abaixo da Média
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
                        <CheckCircle2 size={12} /> Parabéns!
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}