import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Combobox } from "@/components/ui/combobox";

interface Designation {
  id: string;
  designation_type: string;
  meeting_date: string;
  notes: string | null;
  user_id: string;
  publisher_name?: string;
}

interface Publisher {
  id: string;
  full_name: string;
  privileges: string[];
}

interface Meeting {
  id: string;
  date: string;
  type: string;
}

const ITEMS_PER_PAGE = 10;

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    user_id: "",
    designation_type: "Presidente",
    meeting_date: "",
    notes: "",
    theme: "",
    minutes: ""
  });

  useEffect(() => {
    loadDesignations();
    loadPublishers();
    loadMeetings();
  }, [filterMonth, filterYear]);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .order("date", { ascending: false });
    setMeetings(data || []);
  };

  const loadDesignations = async () => {
    const start = `${filterYear}-${filterMonth}-01`;
    const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("designations")
      .select("*")
      .gte("meeting_date", start)
      .lte("meeting_date", end)
      .order("meeting_date", { ascending: false });

    if (error) {
      toast.error("Erro ao carregar designações");
    } else {
      const { data: pubs } = await supabase.from("publishers").select("id, full_name");
      const formatted = data.map(d => ({
        ...d,
        publisher_name: pubs?.find(p => p.id === d.user_id)?.full_name || "-"
      }));
      setDesignations(formatted || []);
    }
  };

  const loadPublishers = async () => {
    const { data } = await supabase
      .from("publishers")
      .select("id, full_name, privileges")
      .eq("status", "active")
      .order("full_name");
    setPublishers(data || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("designations").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      toast.success("Designação excluída");
      loadDesignations();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id) return toast.error("Selecione um designado");
    if (!formData.meeting_date) return toast.error("Selecione uma reunião");

    let finalNotes = formData.notes;
    if (formData.designation_type === "Tesouro") {
      finalNotes = formData.theme;
    } else if (formData.designation_type === "Nossa Vida Cristã") {
      finalNotes = formData.minutes ? `${formData.minutes} min - ${formData.theme}` : formData.theme;
    }

    const payload = {
      user_id: formData.user_id,
      designation_type: formData.designation_type,
      meeting_date: formData.meeting_date,
      notes: finalNotes || null
    };

    const { error } = editingId 
      ? await supabase.from("designations").update(payload).eq("id", editingId)
      : await supabase.from("designations").insert([payload]);

    if (error) {
      console.error("Erro Supabase:", error);
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Designação salva com sucesso!");
      setOpen(false);
      loadDesignations();
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ 
      user_id: "", 
      designation_type: "Presidente", 
      meeting_date: "", 
      notes: "",
      theme: "",
      minutes: ""
    });
  };

  const handleEdit = (d: Designation) => {
    setEditingId(d.id);
    
    let theme = "";
    let minutes = "";
    let notes = d.notes || "";

    if (d.designation_type === "Tesouro") {
      theme = notes;
    } else if (d.designation_type === "Nossa Vida Cristã" && notes.includes(" min - ")) {
      const parts = notes.split(" min - ");
      minutes = parts[0];
      theme = parts[1];
    } else if (d.designation_type === "Nossa Vida Cristã") {
      theme = notes;
    }

    setFormData({
      user_id: d.user_id,
      designation_type: d.designation_type,
      meeting_date: d.meeting_date,
      notes: notes,
      theme: theme,
      minutes: minutes
    });
    setOpen(true);
  };

  const designationTypes = [
    { value: "Presidente", label: "Presidente" },
    { value: "Oração Inicial", label: "Oração Inicial" },
    { value: "Tesouro", label: "Tesouro" },
    { value: "Joias Espirituais", label: "Joias Espirituais" },
    { value: "Nossa Vida Cristã", label: "Nossa Vida Cristã" },
    { value: "Necessidade Locais", label: "Necessidade Locais" },
    { value: "Estudo de Livro", label: "Estudo de Livro" },
    { value: "Leitura do Livro", label: "Leitura do Livro" },
    { value: "Oração Final", label: "Oração Final" },
  ];

  const getFilteredPublishers = () => {
    const type = formData.designation_type;
    if (!type) return publishers;

    switch (type) {
      case "Oração Inicial":
      case "Oração Final":
        return publishers.filter(p => p.privileges?.includes("Oração"));
      case "Presidente":
        return publishers.filter(p => p.privileges?.includes("Presidência Vida e Ministério"));
      case "Tesouro":
        return publishers.filter(p => p.privileges?.includes("Tesouro"));
      case "Joias Espirituais":
        return publishers.filter(p => p.privileges?.includes("Encontre Joias"));
      case "Nossa Vida Cristã":
        return publishers.filter(p => p.privileges?.includes("Nossa Vida Cristã"));
      case "Necessidade Locais":
        return publishers.filter(p => p.privileges?.includes("Necessidade Locais"));
      case "Estudo de Livro":
        return publishers.filter(p => p.privileges?.includes("Dirigente Est. de Livro"));
      case "Leitura do Livro":
        return publishers.filter(p => p.privileges?.includes("Leitura do Livro"));
      default:
        return publishers;
    }
  };

  const months = [
    { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
    { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
    { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];

  const publisherOptions = getFilteredPublishers().map(p => ({ value: p.id, label: p.full_name }));

  const totalPages = Math.ceil(designations.length / ITEMS_PER_PAGE);
  const paginatedDesignations = designations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Designações</h1>
          <p className="text-muted-foreground">Gerencie as atribuições da congregação</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" className="w-[100px]" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Nova"} Designação</DialogTitle>
                  <DialogDescription>Selecione a reunião e o designado.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Reunião</Label>
                    <Select value={formData.meeting_date} onValueChange={(v) => setFormData({...formData, meeting_date: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a reunião" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetings.map((m) => (
                          <SelectItem key={m.id} value={m.date}>
                            {format(parseISO(m.date), "dd/MM/yyyy")} - {m.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Designação</Label>
                    <Select value={formData.designation_type} onValueChange={(v) => setFormData({ ...formData, designation_type: v, user_id: "", theme: "", minutes: "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {designationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.designation_type === "Tesouro" && (
                    <div className="space-y-2">
                      <Label>Tema</Label>
                      <Input value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })} placeholder="Informe o tema do Tesouro" required />
                    </div>
                  )}

                  {formData.designation_type === "Nossa Vida Cristã" && (
                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-1 space-y-2">
                        <Label>Min</Label>
                        <Input type="number" value={formData.minutes} onChange={(e) => setFormData({ ...formData, minutes: e.target.value })} placeholder="Ex: 15" />
                      </div>
                      <div className="col-span-3 space-y-2">
                        <Label>Tema</Label>
                        <Input value={formData.theme} onChange={(e) => setFormData({ ...formData, theme: e.target.value })} placeholder="Informe o tema" required />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Designado</Label>
                    <Combobox 
                      options={publisherOptions} 
                      value={formData.user_id} 
                      onChange={(v) => setFormData({...formData, user_id: v})}
                      placeholder="Pesquisar pessoa..."
                    />
                  </div>

                  {formData.designation_type !== "Tesouro" && formData.designation_type !== "Nossa Vida Cristã" && (
                    <div className="space-y-2">
                      <Label>Observações</Label>
                      <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Designações</CardTitle>
          <CardDescription>Lista de atribuições para o mês selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Designado</TableHead>
                  <TableHead>Observação/Tema</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDesignations.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma designação encontrada.</TableCell></TableRow>
                ) : (
                  paginatedDesignations.map((designation) => (
                    <TableRow key={designation.id}>
                      <TableCell className="whitespace-nowrap">{format(parseISO(designation.meeting_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="secondary">{designation.designation_type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{designation.publisher_name}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {designation.notes || "-"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(designation)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Designação?</AlertDialogTitle>
                              <AlertDialogDescription>Deseja remover esta atribuição?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(designation.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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