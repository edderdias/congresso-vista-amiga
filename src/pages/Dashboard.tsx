import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Users, FileText, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalReports: 0,
    totalTerritories: 0,
    activeDesignations: 0,
  });

  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadMonthlyData();
  }, []);

  const loadStats = async () => {
    const [members, reports, territories, designations] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("preaching_reports").select("*", { count: "exact", head: true }),
      supabase.from("territories").select("*", { count: "exact", head: true }),
      supabase.from("designations").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalMembers: members.count || 0,
      totalReports: reports.count || 0,
      totalTerritories: territories.count || 0,
      activeDesignations: designations.count || 0,
    });
  };

  const loadMonthlyData = async () => {
    const { data } = await supabase
      .from("preaching_reports")
      .select("month, year, hours")
      .order("year", { ascending: true })
      .order("month", { ascending: true })
      .limit(6);

    if (data) {
      const formatted = data.map((item) => ({
        name: `${item.month}/${item.year}`,
        horas: item.hours,
      }));
      setMonthlyData(formatted);
    }
  };

  const cards = [
    { title: "Membros", value: stats.totalMembers, icon: Users, color: "text-primary" },
    { title: "Relatórios", value: stats.totalReports, icon: FileText, color: "text-secondary" },
    { title: "Territórios", value: stats.totalTerritories, icon: MapPin, color: "text-accent" },
    { title: "Designações", value: stats.activeDesignations, icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da congregação</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Horas de Pregação - Últimos 6 Meses</CardTitle>
            <CardDescription>Total de horas reportadas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="horas" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tendência de Atividade</CardTitle>
            <CardDescription>Evolução das horas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="horas" stroke="hsl(var(--secondary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
