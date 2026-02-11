import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
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
  const [open, setOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState({
    group_id: "",
    publisher_id: "",
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear(),
    hours: 0,
    bible_studies: 0,
    notes: "",
    participated: true,
    pioneer_status: "publicador" as any,
  });

  const [filterName, setFilterName] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");

  useEffect(() => {
    loadReports();
    loadGroups();
  }, [filterName, filterGroup]);

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("*").order("group_number");
    setGroups(data || []);
  };

  const loadPublishersByGroup = async (groupId: string) => {
    if (!groupId) return;
    const { data } = await supabase
      .from("publishers")
      .select("*")
      .eq("group_id", groupId)
      .order("full_name");
    setPublishers(data || []);
  };

  const loadReports = async () => {
    let query = supabase
      .from("preaching_reports")
      .select("*")
      .order("year", { ascending: false })
      .order("month", { ascending: false });

    if (filterName) query = query.ilike("reporter_name", `%${filterName}%`);
    if (filterGroup !== "all") query = query.eq("group_id", parseInt(filterGroup));

    const { data } = await query;
    setReports(data || []);
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

  const totalPages = Math.ceil(reports.length / ITEMS_PER_PAGE);
  const paginatedReports = reports.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingReportId(null)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Lançar Relatório</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={formData.group_id} onValueChange={(val) => {
                  setFormData({...formData, group_id: val, publisher_id: ""});
                  loadPublishersByGroup(val);
                }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                  <SelectContent>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Publicador</Label>
                <Select value={formData.publisher_id} onValueChange={(val) => setFormData({...formData, publisher_id: val})} disabled={!formData.group_id}>
                  <SelectTrigger><SelectValue placeholder="Selecione o publicador" /></SelectTrigger>
                  <SelectContent>
                    {publishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded border">
                <Checkbox id="part" checked={formData.participated} onCheckedChange={(v) => setFormData({...formData, participated: !!v})} />
                <Label htmlFor="part">Participou no ministério?</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horas</Label>
                  <Input type="number" value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Estudos</Label>
                  <Input type="number" value={formData.bible_studies} onChange={e => setFormData({...formData, bible_studies: parseInt(e.target.value)})} />
                </div>
              </div>

              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Estudos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReports.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.reporter_name}</TableCell>
                  <TableCell>{r.group_id}</TableCell>
                  <TableCell>{r.month}/{r.year}</TableCell>
                  <TableCell>{r.hours}</TableCell>
                  <TableCell>{r.bible_studies}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </div>
  );
}