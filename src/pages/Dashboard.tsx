"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Users, MapPin, LayoutGrid, TrendingUp, FileText, Star, Clock, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, parseISO, startOfYear } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const [stats, setStats] = useState({ totalPublishers: 0, activePublishers: 0, totalTerritories: 0, totalGroups: 0 });
  const [reportStats, setReportStats] = useState({ pub: { count: 0, studies: 0 }, aux: { count: 0, hours: 0, studies: 0 }, reg: { count: 0, hours: 0, studies: 0 } });
  const [theocraticData, setTheocraticData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [prevMonthName, setPrevMonthName] = useState("");

  useEffect(() => {
    loadStats();
    loadTheocraticData();
    loadPreviousMonthReports();
    loadAttendanceData();
  }, []);

  const loadStats = async () => {
    const { count: total } = await supabase.from("publishers").select("*", { count: "exact", head: true }).neq("status", "mudou");
    const { count: active } = await supabase.from("publishers").select("*", { count: "exact", head: true }).in("status", ["active", "repreendido"]);
    const { count: terr } = await supabase.from("territories").select("*", { count: "exact", head: true });
    const { count: grp } = await supabase.from("groups").select("*", { count: "exact", head: true });
    setStats({ totalPublishers: total || 0, activePublishers: active || 0, totalTerritories: terr || 0, totalGroups: grp || 0 });
  };

  const loadTheocraticData = async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Ciclo de serviço: Setembro do ano anterior até Agosto do ano atual
    let startYear = currentYear;
    if (now.getMonth() < 8) startYear--;
    
    const { data } = await supabase
      .from("preaching_reports")
      .select("month, year, hours, bible_studies")
      .or(`year.eq.${startYear},year.eq.${startYear + 1}`);

    if (data) {
      const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
      const monthNames: Record<number, string> = { 1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun", 7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez" };

      const formatted = monthsOrder.map(m => {
        const year = m >= 9 ? startYear : startYear + 1;
        const monthReports = data.filter(r => r.month === m && r.year === year);
        return {
          name: monthNames[m],
          horas: monthReports.reduce((acc, r) => acc + (r.hours || 0), 0),
          estudos: monthReports.reduce((acc, r) => acc + (r.bible_studies || 0), 0),
        };
      });
      setTheocraticData(formatted);
    }
  };

  const loadPreviousMonthReports = async () => {
    const prev = subMonths(new Date(), 1);
    setPrevMonthName(format(prev, "MMMM", { locale: ptBR }));
    const { data } = await supabase.from("preaching_reports").select("*").eq("month", prev.getMonth() + 1).eq("year", prev.getFullYear());
    if (data) {
      const agg = data.reduce((acc, curr) => {
        const s = curr.pioneer_status;
        if (s === 'publicador') { acc.pub.count++; acc.pub.studies += curr.bible_studies || 0; }
        else if (s === 'pioneiro_auxiliar') { acc.aux.count++; acc.aux.hours += curr.hours || 0; acc.aux.studies += curr.bible_studies || 0; }
        else if (s === 'pioneiro_regular') { acc.reg.count++; acc.reg.hours += curr.hours || 0; acc.reg.studies += curr.bible_studies || 0; }
        return acc;
      }, { pub: { count: 0, studies: 0 }, aux: { count: 0, hours: 0, studies: 0 }, reg: { count: 0, hours: 0, studies: 0 } });
      setReportStats(agg);
    }
  };

  const loadAttendanceData = async () => {
    const { data } = await supabase.from("attendance").select("*").order("date", { ascending: true });
    if (data) {
      const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
      const monthNames: Record<number, string> = { 1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun", 7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez" };
      const formatted = monthsOrder.map(m => {
        const monthMeets = data.filter(d => parseISO(d.date).getMonth() + 1 === m);
        const avg = (arr: any[], type: string, field: string) => {
          const filtered = arr.filter(x => x.type.includes(type));
          return filtered.length > 0 ? Math.round(filtered.reduce((a, b) => a + (b[field] || 0), 0) / filtered.length) : 0;
        };
        return {
          name: monthNames[m],
          midIn: avg(monthMeets, "Meio", "in_person"),
          midZoom: avg(monthMeets, "Meio", "zoom"),
          endIn: avg(monthMeets, "Final", "in_person"),
          endZoom: avg(monthMeets, "Final", "zoom"),
        };
      });
      setAttendanceData(formatted);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do ano de serviço (Setembro - Agosto)</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Publicadores</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalPublishers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ativos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{stats.activePublishers}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Grupos</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-orange-500">{stats.totalGroups}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Territórios</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-blue-600">{stats.totalTerritories}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Estudos Bíblicos</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={theocraticData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar name="Estudos" dataKey="estudos" fill="#10b981" radius={[4, 4, 0, 0]} /></BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Horas de Pregação</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={theocraticData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Line name="Horas" type="monotone" dataKey="horas" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} /></LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}