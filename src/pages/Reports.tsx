import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Report {
  id: string;
  month: number;
  year: number;
  hours: number;
  placements: number;
  videos: number;
  return_visits: number;
  bible_studies: number;
  notes: string | null;
  profiles: { full_name: string };
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    hours: 0,
    placements: 0,
    videos: 0,
    return_visits: 0,
    bible_studies: 0,
    notes: "",
  });

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data, error } = await supabase
      .from("preaching_reports")
      .select("*, profiles(full_name)")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar relatórios", description: error.message, variant: "destructive" });
    } else {
      setReports(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("preaching_reports").insert({
      user_id: user.id,
      ...formData,
    });

    if (error) {
      toast({ title: "Erro ao salvar relatório", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Relatório salvo com sucesso!" });
      setOpen(false);
      loadReports();
      setFormData({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        hours: 0,
        placements: 0,
        videos: 0,
        return_visits: 0,
        bible_studies: 0,
        notes: "",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Relatórios de Pregação</h1>
          <p className="text-muted-foreground">Gerencie os relatórios de serviço de campo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar Relatório</DialogTitle>
                <DialogDescription>Preencha os dados do seu relatório mensal</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mês</Label>
                    <Input
                      id="month"
                      type="number"
                      min="1"
                      max="12"
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input
                      id="year"
                      type="number"
                      min="2020"
                      max="2100"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hours">Horas</Label>
                  <Input
                    id="hours"
                    type="number"
                    min="0"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="placements">Publicações</Label>
                    <Input
                      id="placements"
                      type="number"
                      min="0"
                      value={formData.placements}
                      onChange={(e) => setFormData({ ...formData, placements: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="videos">Vídeos</Label>
                    <Input
                      id="videos"
                      type="number"
                      min="0"
                      value={formData.videos}
                      onChange={(e) => setFormData({ ...formData, videos: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="return_visits">Revisitas</Label>
                    <Input
                      id="return_visits"
                      type="number"
                      min="0"
                      value={formData.return_visits}
                      onChange={(e) => setFormData({ ...formData, return_visits: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bible_studies">Estudos Bíblicos</Label>
                    <Input
                      id="bible_studies"
                      type="number"
                      min="0"
                      value={formData.bible_studies}
                      onChange={(e) => setFormData({ ...formData, bible_studies: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Relatórios</CardTitle>
          <CardDescription>Visualize todos os relatórios submetidos</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Período</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Publicações</TableHead>
                <TableHead>Vídeos</TableHead>
                <TableHead>Revisitas</TableHead>
                <TableHead>Estudos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.profiles?.full_name}</TableCell>
                  <TableCell>{`${report.month}/${report.year}`}</TableCell>
                  <TableCell>{report.hours}</TableCell>
                  <TableCell>{report.placements}</TableCell>
                  <TableCell>{report.videos}</TableCell>
                  <TableCell>{report.return_visits}</TableCell>
                  <TableCell>{report.bible_studies}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
