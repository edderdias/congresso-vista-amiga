import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, User, BookOpen, Mic2, Clock, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [loading, setLoading] = useState(false);
  
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const [formData, setFormData] = useState<Record<string, { user_id: string, notes: string, id?: string }>>({
    "Presidente": { user_id: "", notes: "" },
    "Oração Inicial": { user_id: "", notes: "" },
    "Tesouro": { user_id: "", notes: "" },
    "Joias Espirituais": { user_id: "", notes: "" },
    "Estudo de Livro": { user_id: "", notes: "" },
    "Leitura do Livro": { user_id: "", notes: "" },
    "Oração Final": { user_id: "", notes: "" },
  });

  const [vidaCristaParts, setVidaCristaParts] = useState<{ id?: string, min: string, tema: string, user_id: string }[]>([]);

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

  const handleMeetingChange = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    setSelectedMeeting(meeting);
    
    const { data } = await supabase
      .from("designations")
      .select("*")
      .eq("meeting_date", meeting.date);

    const newFormData: any = {
      "Presidente": { user_id: "", notes: "" },
      "Oração Inicial": { user_id: "", notes: "" },
      "Tesouro": { user_id: "", notes: "" },
      "Joias Espirituais": { user_id: "", notes: "" },
      "Estudo de Livro": { user_id: "", notes: "" },
      "Leitura do Livro": { user_id: "", notes: "" },
      "Oração Final": { user_id: "", notes: "" },
    };

    const newVidaCrista: any[] = [];

    if (data) {
      data.forEach(d => {
        if (d.designation_type === "Nossa Vida Cristã") {
          const [min, ...temaParts] = (d.notes || "").split(" - ");
          newVidaCrista.push({
            id: d.id,
            min: min || "",
            tema: temaParts.join(" - ") || "",
            user_id: d.user_id
          });
        } else if (newFormData[d.designation_type]) {
          newFormData[d.designation_type] = { user_id: d.user_id, notes: d.notes || "", id: d.id };
        }
      });
    }
    
    setFormData(newFormData);
    setVidaCristaParts(newVidaCrista.length > 0 ? newVidaCrista : [{ min: "", tema: "", user_id: "" }]);
  };

  const addVidaCristaPart = () => {
    setVidaCristaParts([...vidaCristaParts, { min: "", tema: "", user_id: "" }]);
  };

  const removeVidaCristaPart = (index: number) => {
    setVidaCristaParts(vidaCristaParts.filter((_, i) => i !== index));
  };

  const updateVidaCristaPart = (index: number, field: string, value: string) => {
    const newParts = [...vidaCristaParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setVidaCristaParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return toast.error("Selecione a reunião");

    setLoading(true);
    
    const payloads = Object.entries(formData)
      .filter(([_, data]) => data.user_id)
      .map(([type, data]) => ({
        id: data.id,
        user_id: data.user_id,
        designation_type: type,
        meeting_date: selectedMeeting.date,
        notes: data.notes || null
      }));

    const vidaCristaPayloads = vidaCristaParts
      .filter(p => p.user_id)
      .map(p => ({
        id: p.id,
        user_id: p.user_id,
        designation_type: "Nossa Vida Cristã",
        meeting_date: selectedMeeting.date,
        notes: `${p.min} - ${p.tema}`
      }));

    const finalPayload = [...payloads, ...vidaCristaPayloads];

    if (finalPayload.length === 0) {
      setLoading(false);
      return toast.error("Preencha pelo menos uma designação");
    }

    const { error } = await supabase.from("designations").upsert(finalPayload);

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Programação salva com sucesso!");
      setOpen(false);
      loadDesignations();
      resetForm();
    }
  };

  const resetForm = () => {
    setSelectedMeeting(null);
    setFormData({
      "Presidente": { user_id: "", notes: "" },
      "Oração Inicial": { user_id: "", notes: "" },
      "Tesouro": { user_id: "", notes: "" },
      "Joias Espirituais": { user_id: "", notes: "" },
      "Estudo de Livro": { user_id: "", notes: "" },
      "Leitura do Livro": { user_id: "", notes: "" },
      "Oração Final": { user_id: "", notes: "" },
    });
    setVidaCristaParts([{ min: "", tema: "", user_id: "" }]);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("designations").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Designação excluída");
      loadDesignations();
    }
  };

  const getPubsByPrivilege = (privilege: string) => {
    return publishers
      .filter(p => p.privileges?.includes(privilege))
      .map(p => ({ value: p.id, label: p.full_name }));
  };

  const months = [
    { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
    { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
    { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];

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
                <Plus className="h-4 w-4 mr-2" /> Programar Reunião
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Programação da Reunião</DialogTitle>
                  <DialogDescription>Selecione a reunião e preencha os designados.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Reunião</Label>
                    <Select value={selectedMeeting?.id || ""} onValueChange={handleMeetingChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a reunião" />
                      </SelectTrigger>
                      <SelectContent>
                        {meetings.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {format(parseISO(m.date), "dd/MM/yyyy")} - {m.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedMeeting?.type.includes("Meio de Semana") && (
                    <div className="space-y-6 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Presidente</Label>
                          <Combobox 
                            options={getPubsByPrivilege("Presidência Vida e Ministério")} 
                            value={formData["Presidente"].user_id} 
                            onChange={(v) => setFormData({...formData, "Presidente": {...formData["Presidente"], user_id: v}})}
                            placeholder="Pesquisar..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Oração Inicial</Label>
                          <Combobox 
                            options={getPubsByPrivilege("Oração")} 
                            value={formData["Oração Inicial"].user_id} 
                            onChange={(v) => setFormData({...formData, "Oração Inicial": {...formData["Oração Inicial"], user_id: v}})}
                            placeholder="Pesquisar..."
                          />
                        </div>
                      </div>

                      <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                        <Label className="text-primary font-bold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Tesouro</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Tema</Label>
                            <Input 
                              placeholder="Informe o tema" 
                              value={formData["Tesouro"].notes} 
                              onChange={(e) => setFormData({...formData, "Tesouro": {...formData["Tesouro"], notes: e.target.value}})}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Orador</Label>
                            <Combobox 
                              options={getPubsByPrivilege("Tesouro")} 
                              value={formData["Tesouro"].user_id} 
                              onChange={(v) => setFormData({...formData, "Tesouro": {...formData["Tesouro"], user_id: v}})}
                              placeholder="Pesquisar..."
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Joias Espirituais</Label>
                        <Combobox 
                          options={getPubsByPrivilege("Encontre Joias")} 
                          value={formData["Joias Espirituais"].user_id} 
                          onChange={(v) => setFormData({...formData, "Joias Espirituais": {...formData["Joias Espirituais"], user_id: v}})}
                          placeholder="Pesquisar..."
                        />
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-primary font-bold flex items-center gap-2"><User className="h-4 w-4" /> Nossa Vida Cristã</Label>
                          <Button type="button" variant="outline" size="sm" onClick={addVidaCristaPart}>
                            <PlusCircle className="h-4 w-4 mr-1" /> Adicionar Parte
                          </Button>
                        </div>
                        
                        {vidaCristaParts.map((part, index) => (
                          <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg border relative group">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-[10px]">Min</Label>
                              <Input placeholder="5" value={part.min} onChange={e => updateVidaCristaPart(index, "min", e.target.value)} />
                            </div>
                            <div className="col-span-5 space-y-1">
                              <Label className="text-[10px]">Tema</Label>
                              <Input placeholder="Tema da parte" value={part.tema} onChange={e => updateVidaCristaPart(index, "tema", e.target.value)} />
                            </div>
                            <div className="col-span-4 space-y-1">
                              <Label className="text-[10px]">Orador</Label>
                              <Combobox 
                                options={getPubsByPrivilege("Nossa Vida Cristã")} 
                                value={part.user_id} 
                                onChange={(v) => updateVidaCristaPart(index, "user_id", v)}
                                placeholder="Pesquisar..."
                              />
                            </div>
                            <div className="col-span-1">
                              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeVidaCristaPart(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <Label className="text-primary font-bold">Encerramento</Label>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Estudo de Livro</Label>
                            <Combobox 
                              options={getPubsByPrivilege("Dirigente Est. de Livro")} 
                              value={formData["Estudo de Livro"].user_id} 
                              onChange={(v) => setFormData({...formData, "Estudo de Livro": {...formData["Estudo de Livro"], user_id: v}})}
                              placeholder="Pesquisar..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Leitura do Livro</Label>
                            <Combobox 
                              options={getPubsByPrivilege("Leitura do Livro")} 
                              value={formData["Leitura do Livro"].user_id} 
                              onChange={(v) => setFormData({...formData, "Leitura do Livro": {...formData["Leitura do Livro"], user_id: v}})}
                              placeholder="Pesquisar..."
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Oração Final</Label>
                          <Combobox 
                            options={getPubsByPrivilege("Oração")} 
                            value={formData["Oração Final"].user_id} 
                            onChange={(v) => setFormData({...formData, "Oração Final": {...formData["Oração Final"], user_id: v}})}
                            placeholder="Pesquisar..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMeeting && !selectedMeeting.type.includes("Meio de Semana") && (
                    <div className="space-y-4 border-t pt-4">
                      <p className="text-sm text-muted-foreground italic">Para reuniões de final de semana, as designações são gerenciadas na aba de Discursos e Áudio/Vídeo.</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full sm:w-auto" disabled={loading || !selectedMeeting}>
                    {loading ? "Salvando..." : "Salvar Programação"}
                  </Button>
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