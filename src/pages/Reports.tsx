import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Report {
  id: string;
  month: number;
  year: number;
  hours: number;
  placements: number | null;
  videos: number | null;
  return_visits: number | null;
  bible_studies: number;
  notes: string | null;
  pioneer_status: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular";
  user_id: string; // Added user_id to interface
  group_id: number | null; // Added group_id to interface
  profiles: { full_name: string };
}

interface Profile {
  id: string;
  full_name: string;
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]); // State to store profiles
  const [open, setOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    user_id: "", // Added user_id to form data
    group_id: "", // Added group_id to form data (as string for select)
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear(),
    hours: 0,
    bible_studies: 0,
    notes: "",
    pioneer_status: "publicador" as "publicador" | "pioneiro_auxiliar" | "pioneiro_regular",
  });

  const monthOptions = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  const groupOptions = Array.from({ length: 10 }, (_, i) => ({
    value: (i + 1).toString(),
    label: `Grupo ${i + 1}`,
  }));

  const pioneerStatusLabels = {
    publicador: "Publicador",
    pioneiro_auxiliar: "Pioneiro Auxiliar",
    pioneiro_regular: "Pioneiro Regular",
  };

  useEffect(() => {
    loadReports();
    loadProfiles(); // Load profiles when component mounts
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

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    setProfiles(data || []);
  };

  const handleEdit = (report: Report) => {
    setEditingReportId(report.id);
    setFormData({
      id: report.id,
      user_id: report.user_id, // Set user_id for editing
      group_id: report.group_id ? report.group_id.toString() : "", // Set group_id for editing
      month: report.month.toString(),
      year: report.year,
      hours: report.hours,
      bible_studies: report.bible_studies,
      notes: report.notes || "",
      pioneer_status: report.pioneer_status,
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingReportId(null);
    setFormData({
      id: "",
      user_id: "",
      group_id: "",
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear(),
      hours: 0,
      bible_studies: 0,
      notes: "",
      pioneer_status: "publicador",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.user_id) {
      toast({ title: "Erro", description: "Por favor, selecione um membro.", variant: "destructive" });
      return;
    }

    const reportData = {
      user_id: formData.user_id,
      group_id: formData.group_id ? parseInt(formData.group_id) : null, // Convert group_id to number or null
      month: parseInt(formData.month),
      year: formData.year,
      hours: formData.hours,
      bible_studies: formData.bible_studies,
      notes: formData.notes,
      pioneer_status: formData.pioneer_status,
    };

    let error = null;
    if (editingReportId) {
      const { error: updateError } = await supabase
        .from("preaching_reports")
        .update(reportData)
        .eq("id", editingReportId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("preaching_reports").insert([reportData]);
      error = insertError;
    }

    if (error) {
      toast({ title: "Erro ao salvar relatório", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Relatório salvo com sucesso!" });
      handleCloseDialog();
      loadReports();
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
            <Button onClick={handleCloseDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingReportId ? "Editar Relatório" : "Adicionar Relatório"}</DialogTitle>
                <DialogDescription>Preencha os dados do seu relatório mensal</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Membro</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger id="user">
                      <SelectValue placeholder="Selecione um membro" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group">Grupo</Label>
                  <Select value={formData.group_id} onValueChange={(value) => setFormData({ ...formData, group_id: value })}>
                    <SelectTrigger id="group">
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groupOptions.map((group) => (
                        <SelectItem key={group.value} value={group.value}>
                          {group.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="month">Mês</Label>
                    <Select value={formData.month} onValueChange={(value) => setFormData({ ...formData, month: value })}>
                      <SelectTrigger id="month">
                        <SelectValue placeholder="Selecione o mês" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthOptions.map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                <div className="grid grid-cols-2 gap-4">
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
                  <Label>Status de Pioneiro</Label>
                  <RadioGroup
                    value={formData.pioneer_status}
                    onValueChange={(value: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular") => setFormData({ ...formData, pioneer_status: value })}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="publicador" id="publicador" />
                      <Label htmlFor="publicador">Publicador</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pioneiro_auxiliar" id="pioneiro_auxiliar" />
                      <Label htmlFor="pioneiro_auxiliar">Pioneiro Auxiliar</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pioneiro_regular" id="pioneiro_regular" />
                      <Label htmlFor="pioneiro_regular">Pioneiro Regular</Label>
                    </div>
                  </RadioGroup>
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
                <Button type="submit">{editingReportId ? "Salvar Alterações" : "Salvar"}</Button>
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
                <TableHead>Grupo</TableHead> {/* New column */}
                <TableHead>Mês</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Estudos</TableHead>
                <TableHead>Status Pioneiro</TableHead>
                <TableHead>Participou</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.profiles?.full_name}</TableCell>
                  <TableCell>{report.group_id || "-"}</TableCell> {/* Display group_id */}
                  <TableCell>{report.month}</TableCell>
                  <TableCell>{report.year}</TableCell>
                  <TableCell>{report.hours}</TableCell>
                  <TableCell>{report.bible_studies}</TableCell>
                  <TableCell>{pioneerStatusLabels[report.pioneer_status]}</TableCell>
                  <TableCell>{report.hours > 0 ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(report)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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