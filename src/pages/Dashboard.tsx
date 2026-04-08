import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Users, MapPin, LayoutGrid, TrendingUp, FileText, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

  useEffect(() => {
    loadStats();
    loadTheocraticData();
    loadCurrentMonthReports();
  }, []);

  const loadStats = async () => {
    const { count: totalPubs } = await supabase
      .from("publishers")
      .select("*", { count: "exact", head: true })
      .neq("status", "mudou");

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

  const loadCurrentMonthReports = async () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const { data } = await supabase
      .from("preaching_reports")
      .select("*")
      .eq("month", month)
      .eq("year", year);

    if (data) {
      const aggregated = data.reduce((acc, curr) => {
        const status = curr.pioneer_status;
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
    const { data } = await supabase
      .from("preaching_reports")
      .select("month, year, hours, bible_studies")
      .order("year", { ascending: true })
      .order("month", { ascending: true });

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

      const formatted = monthsOrder.map(m => {
        const entry = Object.values(grouped).find((item: any) => item.month === m);
        return {
          name: monthNames[m],
          horas: entry ? (entry as any).hours : 0,
          estudos: entry ? (entry as any).studies : 0,
        };
      });

      setTheocraticData(formatted);
    }
  };

  const cards = [
    { title: "Total de Publicadores", value: stats.totalPublishers, icon: Users, color: "text-primary", desc: "Exceto mudou" },
    { title: "Publicadores Ativos", value: stats.activePublishers, icon: TrendingUp, color: "text-green-600", desc: "Ativos + Repreendidos" },
    { title: "Grupos", value: stats.totalGroups, icon: LayoutGrid, color: "text-orange-500", desc: "Grupos de serviço" },
    { title: "Territórios", value: stats.totalTerritories, icon: MapPin, color: "text-accent", desc: "Total cadastrado" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da congregação (Ciclo Setembro - Agosto)</p>
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
            Resumo de Relatórios do Mês
          </CardTitle>
          <CardDescription>Dados consolidados por categoria de publicador</CardDescription>
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
            <CardTitle>Estudos Bíblicos</CardTitle>
            <CardDescription>Quantidade de estudos por mês (Set - Ago)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={theocraticData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar name="Estudos" dataKey="estudos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Horas de Pregação</CardTitle>
            <CardDescription>Total de horas reportadas (Set - Ago)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={theocraticData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line name="Horas" type="monotone" dataKey="horas" stroke="hsl(var(--secondary))" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}