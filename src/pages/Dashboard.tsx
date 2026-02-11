import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { Users, MapPin, LayoutGrid, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPublishers: 0,
    activePublishers: 0,
    totalTerritories: 0,
    totalGroups: 0,
  });

  const [theocraticData, setTheocraticData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadTheocraticData();
  }, []);

  const loadStats = async () => {
    // 1. Total de Publicadores (exceto repreendidos e mudou)
    const { count: totalPubs } = await supabase
      .from("publishers")
      .select("*", { count: "exact", head: true })
      .not("status", "in", '("repreendido","mudou")');

    // 2. Publicadores Ativos (Ativos + Repreendidos)
    const { count: activePubs } = await supabase
      .from("publishers")
      .select("*", { count: "exact", head: true })
      .in("status", ["active", "repreendido"]);

    // 3. Territórios
    const { count: territoriesCount } = await supabase
      .from("territories")
      .select("*", { count: "exact", head: true });

    // 4. Grupos
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

  const loadTheocraticData = async () => {
    // Buscamos dados dos últimos 12 meses para montar o ciclo Setembro-Agosto
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

      // Agrupar por mês/ano e somar
      const grouped = data.reduce((acc: any, curr) => {
        const key = `${curr.month}-${curr.year}`;
        if (!acc[key]) {
          acc[key] = { month: curr.month, year: curr.year, hours: 0, studies: 0 };
        }
        acc[key].hours += curr.hours || 0;
        acc[key].studies += curr.bible_studies || 0;
        return acc;
      }, {});

      // Transformar em array e ordenar pelo ciclo teocrático (Setembro a Agosto)
      // Pegamos os dados mais recentes que se encaixam nesse ciclo
      const formatted = monthsOrder.map(m => {
        // Tenta encontrar o dado para o mês 'm' no ano atual ou anterior dependendo do ciclo
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
    { title: "Total de Publicadores", value: stats.totalPublishers, icon: Users, color: "text-primary", desc: "Exceto repreendidos/mudou" },
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