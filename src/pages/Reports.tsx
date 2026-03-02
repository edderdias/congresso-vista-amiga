import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Report {
  id: string;
  month: number;
  year: number;
  hours: number;
  bible_studies: number;
  notes: string | null;
  pioneer_status: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular";
  reporter_name: string;
  group_id: number | null;
  participated?: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [allActivePublishers, setAllActivePublishers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [showMissing, setShowMissing] = useState(false);

  const [formData, setFormData] = useState({
    group_id: "",
    publisher_id: "",
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear(),
    hours: 0,
    bible_studies: 0,
    notes: "",
    participated: false,
    pioneer_status: "publicador" as any,
  });

  useEffect(() => {
    loadReports();
    loadGroups();
    loadAllActivePublishers();
  }, [filterMonth, filterGroup, filterYear]);

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("*").order("group_number");
    setGroups(data || []);
  };

  const loadAllActivePublishers = async () => {
    const { data } = await supabase
      .from("publishers")
      .select("*, groups(group_number)")
      .eq("status", "active")
      .order("full_name");
    setAllActivePublishers(data || []);
  };

  const loadPublishersByGroup = async (groupId: string) => {
    if (!groupId) return [];
    const { data } = await supabase
      .from("publishers")
      .select("*")
      .eq("group_id", groupId)
      .order("full_name");
    setPublishers(data || []);
    return data || [];
  };

  const loadReports = async () => {
    let query = supabase
      .from("preaching_reports")
      .select("*")
      .eq("year", filterYear)
      .order("month", { ascending: false })
      .order("reporter_name", { ascending: true });

    if (filterMonth !== "all") {
      query = query.eq("month", parseInt(filterMonth));
    }

    if (filterGroup !== "all") {
      query = query.eq("group_id", parseInt(filterGroup));
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Erro ao carregar relatórios");
    } else {
      setReports(data || []);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("preaching_reports").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Relatório excluído");
      loadReports();
    }
  };

  const handleEdit = async (report: Report) => {
    setEditingReportId(report.id);
    
    const group = groups.find(g => g.group_number === report.group_id);
    const groupId = group?.id || "";
    
    const groupPubs = await loadPublishersByGroup(groupId);
    const publisher = groupPubs.find(p => p.full_name === report.reporter_name);
    
    setFormData({
      group_id: groupId,
      publisher_id: publisher?.id || "",
      month: report.month.toString(),
      year: report.year,
      hours: report.hours,
      bible_studies: report.bible_studies,
      notes: report.notes || "",
      participated: report.hours > 0 || report.bible_studies > 0 || !!report.participated,
      pioneer_status: report.pioneer_status,
    });
    
    setOpen(true);
  };

  const handlePublisherChange = (pubId: string) => {
    const pub = publishers.find(p => p.id === pubId);
    let status = "publicador";
    if (pub?.privileges?.includes("Pioneiro Regular")) status = "pioneiro_regular";
    else if (pub?.privileges?.includes("Pioneiro Auxiliar")) status = "pioneiro_auxiliar";
    
    setFormData({ ...formData, publisher_id: pubId, pioneer_status: status });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const publisher = publishers.find(p => p.id === formData.publisher_id);
    const group = groups.find(g => g.id === formData.group_id);

    const reportData = {
      reporter_name: publisher?.full_name,
      group_id: group?.group_number,
      month: parseInt(formData.month),
      year: formData.year,
      hours: formData.hours,
      bible_studies: formData.bible_studies,
      notes: formData.notes,
      pioneer_status: formData.pioneer_status,
    };

    const { error } = editingReportId 
      ? await supabase.from("preaching_reports").update(reportData).eq("id", editingReportId)
      : await supabase.from("preaching_reports").insert([reportData]);

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Relatório salvo!");
      setOpen(false);
      loadReports();
    }
  };

  const resetForm = () => {
    setEditingReportId(null);
    setFormData({
      group_id: "",
      publisher_id: "",
      month: (new Date().getMonth() + 1).toString(),
      year: new Date().getFullYear(),
      hours: 0,
      bible_studies: 0,
      notes: "",
      participated: false,
      pioneer_status: "publicador" as any,
    });
  };

  const monthOptions = [
    { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" }, { value: "4", label: "Abril" },
    { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
    { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
  ];

  const getDisplayData = () => {
    if (!showMissing) {
      return reports.filter(r => 
        r.reporter_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lógica para "Falta Relatar"
    const reportedNames = new Set(reports.map(r => r.reporter_name));
    const missing = allActivePublishers.filter(p => {
      const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = filterGroup === "all" || p.group_id === groups.find(g => g.group_number.toString() === filterGroup)?.id;
      const hasNotReported = !reportedNames.has(p.full_name);
      return matchesSearch && matchesGroup && hasNotReported;
    }).map(p => ({
      id: p.id,
      reporter_name: p.full_name,
      group_id: p.groups?.group_number || null,
      month: parseInt(filterMonth),
      year: filterYear,
      hours: 0,
      bible_studies: 0,
      notes: "Pendente",
      pioneer_status: "publicador" as any,
      isMissing: true
    }));

    return missing;
  };

  const filteredData = getDisplayData();
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" /> Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader><DialogTitle>{editingReportId ? "Editar" : "Lançar"} Relatório</DialogTitle></DialogHeader>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mês</Label>
                  <Select value={formData.month} onValueChange={(val) => setFormData({...formData, month: val})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{monthOptions.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input type="number" value={formData.year} onChange={e => setFormData({...formData, year: parseInt(e.target.value) || new Date().getFullYear()})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={formData.group_id} onValueChange={(val) => {
                  setFormData({...formData, group_id: val, publisher_id: ""});
                  loadPublishersByGroup(val);
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Publicador</Label>
                <Select value={formData.publisher_id} onValueChange={handlePublisherChange} disabled={!formData.group_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione o publicador" /></SelectTrigger>
                  <SelectContent>{publishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded border">
                <Checkbox id="part" checked={formData.participated} onCheckedChange={(v) => setFormData({...formData, participated: !!v})} />
                <Label htmlFor="part">Participou no ministério?</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas</Label>
                  <Input type="number" value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <Label>Estudos</Label>
                  <Input type="number" value={formData.bible_studies} onChange={e => setFormData({...formData, bible_studies: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <RadioGroup value={formData.pioneer_status} onValueChange={(v) => setFormData({...formData, pioneer_status: v})}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="publicador" id="pub" />
                    <Label htmlFor="pub">Publicador</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pioneiro_auxiliar" id="aux" />
                    <Label htmlFor="aux">Pioneiro Auxiliar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pioneiro_regular" id="reg" />
                    <Label htmlFor="reg">Pioneiro Regular</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>

              <DialogFooter><Button type="submit" className="w-full sm:w-auto">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2 w-full">
              <Label>Filtrar por Nome</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar nome..." 
                  className="pl-9"
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2 w-full">
              <Label>Filtrar por Mês</Label>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os meses</SelectItem>
                  {monthOptions.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full">
              <Label>Filtrar por Grupo</Label>
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os grupos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.group_number.toString()}>Grupo {g.group_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 w-full">
              <Label>Ano</Label>
              <Input type="number" value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())} />
            </div>
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox id="missing" checked={showMissing} onCheckedChange={(v) => setShowMissing(!!v)} />
              <Label htmlFor="missing" className="font-bold text-red-600 cursor-pointer">Falta relatar</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Mês/Ano</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estudos</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhum registro encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map(r => (
                    <TableRow key={r.id} className={showMissing ? "bg-red-50/30" : ""}>
                      <TableCell className="font-medium whitespace-nowrap">{r.reporter_name}</TableCell>
                      <TableCell className="whitespace-nowrap">Grupo {r.group_id}</TableCell>
                      <TableCell className="whitespace-nowrap">{monthOptions.find(m => m.value === r.month.toString())?.label} / {r.year}</TableCell>
                      <TableCell>{showMissing ? "-" : r.hours}</TableCell>
                      <TableCell>{showMissing ? "-" : r.bible_studies}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {r.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {!showMissing && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(r as Report)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Relatório?</AlertDialogTitle>
                                  <AlertDialogDescription>Deseja realmente excluir o relatório de {r.reporter_name}?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </div>
  );
}