import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, ComposedChart } from "recharts";
import { Users, MapPin, LayoutGrid, TrendingUp, FileText, Star, Clock, BarChart3, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { isAuxPioneerInMonth, type AuxPioneerInfo } from "@/lib/pioneiro";

/**
 * Reta de tendência por mínimos quadrados (regressão linear).
 * Recebe os pontos observados {x, y} e devolve a função da reta (x -> y),
 * ou null quando não há pelo menos 2 pontos com x diferentes.
 */
const linearTrend = (points: { x: number; y: number }[]): ((x: number) => number) | null => {
  const n = points.length;
  if (n < 2) return null;

  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return (x: number) => intercept + slope * x;
};

/** Índice ano*12 + mês do mês atual: tudo antes disso é "mês fechado". */
const currentMonthIndex = () => {
  const now = new Date();
  return now.getFullYear() * 12 + (now.getMonth() + 1);
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPublishers: 0,
    activePublishers: 0,
    totalTerritories: 0,
    totalGroups: 0,
  });

  const [reportStats, setReportStats] = useState({
    pub: { count: 0, studies: 0 },
    aux: { count: 0, hours: 0, studies: 0 },
    reg: { count: 0, hours: 0, studies: 0 }
  });

  const [theocraticData, setTheocraticData] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [prevMonthName, setPrevMonthName] = useState("");

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

  useEffect(() => {
    loadStats();
    loadPreviousMonthReports();
  }, []);

  useEffect(() => {
    loadTheocraticData();
    loadAttendanceData();
  }, [filterServiceYear]);

  const loadStats = async () => {
    const { count: totalPubs } = await supabase
      .from("publishers")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("mudou","removido")');

    const { count: activePubs } = await supabase
      .from("publishers")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "repreendido"]);

    const { count: territoriesCount } = await supabase
      .from("territories")
      .select("*", { count: "exact", head: true });

    const { count: groupsCount } = await supabase
      .from("groups")
      .select("*", { count: "exact", head: true });

    setStats({
      totalPublishers: totalPubs || 0,
      activePublishers: activePubs || 0,
      totalTerritories: territoriesCount || 0,
      totalGroups: groupsCount || 0,
    });
  };

  const loadPreviousMonthReports = async () => {
    const now = new Date();
    const prevMonthDate = subMonths(now, 1);
    const month = prevMonthDate.getMonth() + 1;
    const year = prevMonthDate.getFullYear();
    
    setPrevMonthName(format(prevMonthDate, "MMMM", { locale: ptBR }));

    const { data } = await supabase
      .from("preaching_reports")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (data) {
      // Só conta como pioneiro auxiliar quem estava habilitado para esse mês.
      const publisherIds = [...new Set(data.map(r => r.publisher_id).filter(Boolean))];
      const pubById = new Map<string, AuxPioneerInfo>();
      if (publisherIds.length) {
        const { data: pubs } = await supabase
          .from("publishers")
          .select("id, privileges, aux_pioneer_mode, aux_pioneer_start_month, aux_pioneer_end_month")
          .in("id", publisherIds);
        for (const p of (pubs || []) as unknown as (AuxPioneerInfo & { id: string })[]) {
          pubById.set(p.id, p);
        }
      }

      const aggregated = data.reduce((acc, curr) => {
        let status = curr.pioneer_status;
        if (status === 'pioneiro_auxiliar') {
          const pub = pubById.get(curr.publisher_id);
          if (pub && !isAuxPioneerInMonth(pub, year, month)) status = 'publicador';
        }
        if (status === 'publicador') {
          acc.pub.count++;
          acc.pub.studies += curr.bible_studies || 0;
        } else if (status === 'pioneiro_auxiliar') {
          acc.aux.count++;
          acc.aux.hours += curr.hours || 0;
          acc.aux.studies += curr.bible_studies || 0;
        } else if (status === 'pioneiro_regular') {
          acc.reg.count++;
          acc.reg.hours += curr.hours || 0;
          acc.reg.studies += curr.bible_studies || 0;
        }
        return acc;
      }, {
        pub: { count: 0, studies: 0 },
        aux: { count: 0, hours: 0, studies: 0 },
        reg: { count: 0, hours: 0, studies: 0 }
      });
      setReportStats(aggregated);
    }
  };

  const loadTheocraticData = async () => {
    const startYear = parseInt(filterServiceYear);

    const { data } = await supabase
      .from("preaching_reports")
      .select("month, year, hours, bible_studies")
      .or(`year.eq.${startYear},year.eq.${startYear + 1}`);

    if (data) {
      const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
      const monthNames: Record<number, string> = {
        1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
        7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
      };

      const grouped = data.reduce((acc: any, curr) => {
        const key = `${curr.month}-${curr.year}`;
        if (!acc[key]) {
          acc[key] = { month: curr.month, year: curr.year, hours: 0, studies: 0 };
        }
        acc[key].hours += curr.hours || 0;
        acc[key].studies += curr.bible_studies || 0;
        return acc;
      }, {});

      const nowYm = currentMonthIndex();

      const base = monthsOrder.map((m, i) => {
        const targetYear = m >= 9 ? startYear : startYear + 1;
        const entry = Object.values(grouped).find((item: any) => item.month === m && item.year === targetYear);
        return {
          name: monthNames[m],
          x: i,
          ym: targetYear * 12 + m,
          horas: entry ? (entry as any).hours : 0,
          estudos: entry ? (entry as any).studies : 0,
        };
      });

      // Tendência calculada só com meses fechados (até o mês anterior) que têm dados.
      const fitPoints = base.filter(d => d.ym < nowYm && (d.horas > 0 || d.estudos > 0));
      const horasTrend = linearTrend(fitPoints.map(d => ({ x: d.x, y: d.horas })));
      const estudosTrend = linearTrend(fitPoints.map(d => ({ x: d.x, y: d.estudos })));

      const formatted = base.map(d => {
        const closed = d.ym < nowYm;
        return {
          name: d.name,
          horas: d.horas,
          estudos: d.estudos,
          horasTrend: closed && horasTrend ? Math.max(0, Math.round(horasTrend(d.x))) : null,
          estudosTrend: closed && estudosTrend ? Math.max(0, Math.round(estudosTrend(d.x))) : null,
        };
      });

      setTheocraticData(formatted);
    }
  };

  const loadAttendanceData = async () => {
    const startYear = parseInt(filterServiceYear);

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .gte("date", `${startYear}-09-01`)
      .lte("date", `${startYear + 1}-08-31`)
      .order("date", { ascending: true });

    if (data) {
      const monthsOrder = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];
      const monthNames: Record<number, string> = {
        1: "Jan", 2: "Fev", 3: "Mar", 4: "Abr", 5: "Mai", 6: "Jun",
        7: "Jul", 8: "Ago", 9: "Set", 10: "Out", 11: "Nov", 12: "Dez"
      };

      const grouped: Record<string, any> = {};
      
      data.forEach(curr => {
        const date = parseISO(curr.date);
        const m = date.getMonth() + 1;
        const y = date.getFullYear();
        const key = `${m}-${y}`;
        const type = curr.type.includes("Meio de Semana") ? "mid" : "end";
        
        if (!grouped[key]) {
          grouped[key] = { 
            mid_in: [], mid_zoom: [], 
            end_in: [], end_zoom: [] 
          };
        }
        
        if (type === "mid") {
          grouped[key].mid_in.push(curr.in_person || 0);
          grouped[key].mid_zoom.push(curr.zoom || 0);
        } else {
          grouped[key].end_in.push(curr.in_person || 0);
          grouped[key].end_zoom.push(curr.zoom || 0);
        }
      });

      const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
      const nowYm = currentMonthIndex();

      const base = monthsOrder.map((m, i) => {
        const targetYear = m >= 9 ? startYear : startYear + 1;
        const key = `${m}-${targetYear}`;
        const entry = grouped[key];
        const midIn = avg(entry?.mid_in || []);
        const midZoom = avg(entry?.mid_zoom || []);
        const endIn = avg(entry?.end_in || []);
        const endZoom = avg(entry?.end_zoom || []);
        return {
          name: monthNames[m],
          x: i,
          ym: targetYear * 12 + m,
          midIn, midZoom, midTotal: midIn + midZoom,
          endIn, endZoom, endTotal: endIn + endZoom,
        };
      });

      // Só meses fechados (até o mês anterior) e com assistência registrada entram no cálculo.
      const midFit = base.filter(d => d.ym < nowYm && d.midTotal > 0);
      const endFit = base.filter(d => d.ym < nowYm && d.endTotal > 0);
      const trend = {
        midIn: linearTrend(midFit.map(d => ({ x: d.x, y: d.midIn }))),
        midZoom: linearTrend(midFit.map(d => ({ x: d.x, y: d.midZoom }))),
        midTotal: linearTrend(midFit.map(d => ({ x: d.x, y: d.midTotal }))),
        endIn: linearTrend(endFit.map(d => ({ x: d.x, y: d.endIn }))),
        endZoom: linearTrend(endFit.map(d => ({ x: d.x, y: d.endZoom }))),
        endTotal: linearTrend(endFit.map(d => ({ x: d.x, y: d.endTotal }))),
      };

      const at = (fn: ((x: number) => number) | null, closed: boolean, x: number) =>
        closed && fn ? Math.max(0, Math.round(fn(x))) : null;

      const formatted = base.map(d => {
        const closed = d.ym < nowYm;
        return {
          name: d.name,
          midIn: d.midIn, midZoom: d.midZoom,
          endIn: d.endIn, endZoom: d.endZoom,
          midInTrend: at(trend.midIn, closed, d.x),
          midZoomTrend: at(trend.midZoom, closed, d.x),
          midTotalTrend: at(trend.midTotal, closed, d.x),
          endInTrend: at(trend.endIn, closed, d.x),
          endZoomTrend: at(trend.endZoom, closed, d.x),
          endTotalTrend: at(trend.endTotal, closed, d.x),
        };
      });

      setAttendanceData(formatted);
    }
  };

  const cards = [
    { title: "Total de Publicadores", value: stats.totalPublishers, icon: Users, color: "text-primary", desc: "Exceto mudou/removido" },
    { title: "Publicadores Ativos", value: stats.activePublishers, icon: TrendingUp, color: "text-green-600", desc: "Ativos + Repreendidos" },
    { title: "Grupos", value: stats.totalGroups, icon: LayoutGrid, color: "text-orange-500", desc: "Grupos de serviço" },
    { title: "Territórios", value: stats.totalTerritories, icon: MapPin, color: "text-accent", desc: "Total cadastrado" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da congregação (Ciclo Setembro - Agosto)</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border">
          <Label className="text-xs font-bold flex items-center gap-1 whitespace-nowrap">
            <Calendar className="h-3 w-3" /> Ano letivo:
          </Label>
          <Select value={filterServiceYear} onValueChange={setFilterServiceYear}>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-[10px] text-muted-foreground mt-1">{card.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-50/50 border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Resumo de Relatórios de <span className="capitalize">{prevMonthName}</span>
          </CardTitle>
          <CardDescription>Dados consolidados do mês anterior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-blue-600 font-bold border-b pb-2">
                <Users className="h-4 w-4" />
                <span>Publicadores</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Relatórios</p>
                  <p className="text-xl font-bold">{reportStats.pub.count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Estudos</p>
                  <p className="text-xl font-bold">{reportStats.pub.studies}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-green-600 font-bold border-b pb-2">
                <Clock className="h-4 w-4" />
                <span>Pioneiros Auxiliares</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Relatórios</p>
                  <p className="text-xl font-bold">{reportStats.aux.count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Horas</p>
                  <p className="text-xl font-bold">{reportStats.aux.hours}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Estudos</p>
                  <p className="text-xl font-bold">{reportStats.aux.studies}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-white rounded-lg border shadow-sm">
              <div className="flex items-center gap-2 text-amber-600 font-bold border-b pb-2">
                <Star className="h-4 w-4" />
                <span>Pioneiros Regulares</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Relatórios</p>
                  <p className="text-xl font-bold">{reportStats.reg.count}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Horas</p>
                  <p className="text-xl font-bold">{reportStats.reg.hours}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase">Estudos</p>
                  <p className="text-xl font-bold">{reportStats.reg.studies}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Média Assistência: Meio de Semana
            </CardTitle>
            <CardDescription>Média mensal presencial vs zoom · tendência até o mês anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name="Presencial" dataKey="midIn" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Zoom" dataKey="midZoom" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Line name="Tendência Geral" type="linear" dataKey="midTotalTrend" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 4" dot={false} activeDot={false} legendType="plainline" />
                <Line name="Tendência Presencial" type="linear" dataKey="midInTrend" stroke="#ea580c" strokeWidth={2.5} dot={false} activeDot={false} legendType="plainline" />
                <Line name="Tendência Zoom" type="linear" dataKey="midZoomTrend" stroke="#0891b2" strokeWidth={2.5} dot={false} activeDot={false} legendType="plainline" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Média Assistência: Fim de Semana
            </CardTitle>
            <CardDescription>Média mensal presencial vs zoom · tendência até o mês anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name="Presencial" dataKey="endIn" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar name="Zoom" dataKey="endZoom" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
                <Line name="Tendência Geral" type="linear" dataKey="endTotalTrend" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 4" dot={false} activeDot={false} legendType="plainline" />
                <Line name="Tendência Presencial" type="linear" dataKey="endInTrend" stroke="#ea580c" strokeWidth={2.5} dot={false} activeDot={false} legendType="plainline" />
                <Line name="Tendência Zoom" type="linear" dataKey="endZoomTrend" stroke="#0891b2" strokeWidth={2.5} dot={false} activeDot={false} legendType="plainline" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estudos Bíblicos</CardTitle>
            <CardDescription>Quantidade de estudos por mês (Set - Ago) · tendência até o mês anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={theocraticData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar name="Estudos" dataKey="estudos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                <Line name="Tendência" type="linear" dataKey="estudosTrend" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 4" dot={false} activeDot={false} legendType="plainline" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horas de Pregação</CardTitle>
            <CardDescription>Total de horas reportadas (Set - Ago) · tendência até o mês anterior</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={theocraticData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line name="Horas" type="monotone" dataKey="horas" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line name="Tendência" type="linear" dataKey="horasTrend" stroke="#dc2626" strokeWidth={3} strokeDasharray="7 4" dot={false} activeDot={false} legendType="plainline" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}