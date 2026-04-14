import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, User, BookOpen, Mic2, Clock, PlusCircle, Eye, Info, MessageCircle } from "lucide-react";
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
  publisher_phone?: string;
}

interface Publisher {
  id: string;
  full_name: string;
  privileges: string[];
  phone?: string;
}

interface Meeting {
  id: string;
  date: string;
  type: string;
}

interface GroupedProgram {
  date: string;
  meetingType: string;
  designations: Designation[];
}

const ITEMS_PER_PAGE = 10;

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<GroupedProgram | null>(null);
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
    "Leitura A Sentinela": { user_id: "", notes: "" },
    "Discurso": { user_id: "", notes: "" },
  });

  const [vidaCristaParts, setVidaCristaParts] = useState<{ id?: string, min: string, tema: string, user_id: string }[]>([]);

  useEffect(() => {
    loadData();
  }, [filterMonth, filterYear]);

  const loadData = async () => {
    setLoading(true);
    const start = `${filterYear}-${filterMonth}-01`;
    const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

    const [desigRes, pubsRes, meetsRes] = await Promise.all([
      supabase.from("designations").select("*").gte("meeting_date", start).lte("meeting_date", end),
      supabase.from("publishers").select("id, full_name, privileges, phone").eq("status", "active"),
      supabase.from("meetings").select("*").order("date", { ascending: false })
    ]);

    if (pubsRes.data) setPublishers(pubsRes.data);
    if (meetsRes.data) setMeetings(meetsRes.data);
    
    if (desigRes.data) {
      const formatted = desigRes.data.map(d => {
        const pub = pubsRes.data?.find(p => p.id === d.user_id);
        return {
          ...d,
          publisher_name: pub?.full_name || "-",
          publisher_phone: pub?.phone || ""
        };
      });
      setDesignations(formatted);
    }
    setLoading(false);
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
      "Leitura A Sentinela": { user_id: "", notes: "" },
      "Discurso": { user_id: "", notes: "" },
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
    
    const payloads: any[] = [];

    Object.entries(formData).forEach(([type, data]) => {
      if (data.user_id) {
        payloads.push({
          ...(data.id ? { id: data.id } : {}),
          user_id: data.user_id,
          designation_type: type,
          meeting_date: selectedMeeting.date,
          notes: data.notes || null
        });
      }
    });

    vidaCristaParts.forEach(p => {
      if (p.user_id) {
        payloads.push({
          ...(p.id ? { id: p.id } : {}),
          user_id: p.user_id,
          designation_type: "Nossa Vida Cristã",
          meeting_date: selectedMeeting.date,
          notes: `${p.min} - ${p.tema}`
        });
      }
    });

    if (payloads.length === 0) {
      setLoading(false);
      return toast.error("Preencha pelo menos uma designação");
    }

    try {
      const toUpdate = payloads.filter(p => p.id);
      const toInsert = payloads.filter(p => !p.id);

      if (toUpdate.length > 0) {
        const { error: err1 } = await supabase.from("designations").upsert(toUpdate);
        if (err1) throw err1;
      }

      if (toInsert.length > 0) {
        const { error: err2 } = await supabase.from("designations").insert(toInsert);
        if (err2) throw err2;
      }

      toast.success("Programação salva com sucesso!");
      setOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar designações:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
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
      "Leitura A Sentinela": { user_id: "", notes: "" },
      "Discurso": { user_id: "", notes: "" },
    });
    setVidaCristaParts([{ min: "", tema: "", user_id: "" }]);
  };

  const handleDeleteProgram = async (date: string) => {
    const { error } = await supabase.from("designations").delete().eq("meeting_date", date);
    if (error) toast.error("Erro ao excluir programação");
    else {
      toast.success("Programação excluída");
      loadData();
    }
  };

  const handleEditProgram = (program: GroupedProgram) => {
    const meeting = meetings.find(m => m.date === program.date);
    if (meeting) {
      handleMeetingChange(meeting.id);
      setOpen(true);
    }
  };

  const handleViewProgram = (program: GroupedProgram) => {
    setSelectedProgram(program);
    setViewOpen(true);
  };

  const getPubByPrivilege = (privilege: string) => {
    return publishers
      .filter(p => p.privileges?.includes(privilege))
      .map(p => ({ value: p.id, label: p.full_name }));
  };

  const sendWhatsApp = (name: string, phone: string, date: string, type: string, notes?: string) => {
    if (!phone) return toast.error("Publicador sem telefone cadastrado");
    
    const cleanPhone = phone.replace(/\D/g, "");
    const formattedDate = format(parseISO(date), "dd/MM/yyyy");
    
    let message = `Olá *${name}*, você foi designado para a seguinte parte na reunião de *${formattedDate}*:\n\n`;
    message += `📌 *Designação:* ${type}\n`;
    if (notes && notes !== "-") {
      message += `📝 *Tema/Obs:* ${notes}\n`;
    }
    message += `\nPor favor, confirme o recebimento desta mensagem. Obrigado!`;
    
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const months = [
    { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
    { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
    { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];

  const groupedPrograms: GroupedProgram[] = Array.from(new Set(designations.map(d => d.meeting_date)))
    .map(date => {
      const meeting = meetings.find(m => m.date === date);
      return {
        date,
        meetingType: meeting?.type || "Não definida",
        designations: designations.filter(d => d.meeting_date === date)
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(groupedPrograms.length / ITEMS_PER_PAGE);
  const paginatedPrograms = groupedPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getDesigValue = (program: GroupedProgram, type: string) => {
    const d = program.designations.find(x => x.designation_type === type);
    return d?.publisher_name || "-";
  };

  const getTreasureTheme = (program: GroupedProgram) => {
    const d = program.designations.find(x => x.designation_type === "Tesouro");
    return d?.notes || "-";
  };

  const isWeekend = selectedMeeting?.type.includes("Final de Semana") || 
                    selectedMeeting?.type === "Especial" || 
                    selectedMeeting?.type === "Celebração";

  const isCircuitVisitMidweek = selectedMeeting?.type === "Visita do Viajante (Meio de Semana)";

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

                  {selectedMeeting && !isWeekend && (
                    <div className="space-y-6 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Presidente</Label>
                          <Combobox 
                            options={getPubByPrivilege("Presidência Vida e Ministério")} 
                            value={formData["Presidente"].user_id} 
                            onChange={(v) => setFormData({...formData, "Presidente": {...formData["Presidente"], user_id: v}})}
                            placeholder="Pesquisar..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Oração Inicial</Label>
                          <Combobox 
                            options={getPubByPrivilege("Oração")} 
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
                              options={getPubByPrivilege("Tesouro")} 
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
                          options={getPubByPrivilege("Encontre Joias")} 
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
                                options={getPubByPrivilege("Nossa Vida Cristã")} 
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
                        
                        {isCircuitVisitMidweek ? (
                          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <Label className="text-blue-700 font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Discurso do Viajante</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Tema/Obs</Label>
                                <Input 
                                  placeholder="Tema do discurso" 
                                  value={formData["Discurso"].notes} 
                                  onChange={(e) => setFormData({...formData, "Discurso": {...formData["Discurso"], notes: e.target.value}})}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">Designado (Local)</Label>
                                <Combobox 
                                  options={getPubByPrivilege("Ancião")} 
                                  value={formData["Discurso"].user_id} 
                                  onChange={(v) => setFormData({...formData, "Discurso": {...formData["Discurso"], user_id: v}})}
                                  placeholder="Pesquisar..."
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Estudo de Livro</Label>
                              <Combobox 
                                options={getPubByPrivilege("Dirigente Est. de Livro")} 
                                value={formData["Estudo de Livro"].user_id} 
                                onChange={(v) => setFormData({...formData, "Estudo de Livro": {...formData["Estudo de Livro"], user_id: v}})}
                                placeholder="Pesquisar..."
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">Leitura do Livro</Label>
                              <Combobox 
                                options={getPubByPrivilege("Leitura do Livro")} 
                                value={formData["Leitura do Livro"].user_id} 
                                onChange={(v) => setFormData({...formData, "Leitura do Livro": {...formData["Leitura do Livro"], user_id: v}})}
                                placeholder="Pesquisar..."
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">Oração Final</Label>
                          <Combobox 
                            options={getPubByPrivilege("Oração")} 
                            value={formData["Oração Final"].user_id} 
                            onChange={(v) => setFormData({...formData, "Oração Final": {...formData["Oração Final"], user_id: v}})}
                            placeholder="Pesquisar..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMeeting && isWeekend && (
                    <div className="space-y-6 border-t pt-4">
                      <div className="space-y-2">
                        <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Presidente</Label>
                        <Combobox 
                          options={getPubByPrivilege("Presidência Final de Semana")} 
                          value={formData["Presidente"].user_id} 
                          onChange={(v) => setFormData({...formData, "Presidente": {...formData["Presidente"], user_id: v}})}
                          placeholder="Pesquisar..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Oração Inicial</Label>
                        <Combobox 
                          options={getPubByPrivilege("Oração")} 
                          value={formData["Oração Inicial"].user_id} 
                          onChange={(v) => setFormData({...formData, "Oração Inicial": {...formData["Oração Inicial"], user_id: v}})}
                          placeholder="Pesquisar..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-primary font-bold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Leitor da Sentinela</Label>
                        <Combobox 
                          options={getPubByPrivilege("Leitura A Sentinela")} 
                          value={formData["Leitura A Sentinela"].user_id} 
                          onChange={(v) => setFormData({...formData, "Leitura A Sentinela": {...formData["Leitura A Sentinela"], user_id: v}})}
                          placeholder="Pesquisar..."
                        />
                      </div>
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
          <CardTitle>Programação das Reuniões</CardTitle>
          <CardDescription>Quadro geral de designações por data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Presidente</TableHead>
                  <TableHead>Tesouro (Tema)</TableHead>
                  <TableHead>Joias</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPrograms.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma programação encontrada.</TableCell></TableRow>
                ) : (
                  paginatedPrograms.map((program) => (
                    <TableRow key={program.date}>
                      <TableCell className="whitespace-nowrap font-bold">{format(parseISO(program.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <Badge variant="outline">{program.meetingType}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getDesigValue(program, "Presidente")}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <span className="font-medium">{getDesigValue(program, "Tesouro")}</span>
                        <br />
                        <span className="text-[10px] text-muted-foreground">{getTreasureTheme(program)}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{getDesigValue(program, "Joias Espirituais")}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Visualizar" onClick={() => handleViewProgram(program)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Editar" onClick={() => handleEditProgram(program)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive" title="Excluir">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Programação?</AlertDialogTitle>
                                <AlertDialogDescription>Deseja remover todas as designações da reunião de {format(parseISO(program.date), "dd/MM/yyyy")}?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteProgram(program.date)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Detalhes da Programação
            </DialogTitle>
            <DialogDescription>
              {selectedProgram && (
                <>Reunião de {format(parseISO(selectedProgram.date), "dd/MM/yyyy")} ({selectedProgram.meetingType})</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-3 border-b pb-4">
                {selectedProgram.designations.map((d, i) => (
                  <div key={i} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase">{d.designation_type}</span>
                      <span className="text-sm font-bold">{d.publisher_name}</span>
                      {d.notes && <span className="text-[10px] text-primary italic">{d.notes}</span>}
                    </div>
                    {d.publisher_phone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600 border-green-200 hover:bg-green-50 h-8"
                        onClick={() => sendWhatsApp(d.publisher_name!, d.publisher_phone!, d.meeting_date, d.designation_type, d.notes || undefined)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" /> Notificar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setViewOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}