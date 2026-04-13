"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Lock, Unlock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

interface Outline {
  id: string;
  title: string;
  is_blocked: boolean;
}

export default function Speeches() {
  const [activeTab, setActiveTab] = useState("speeches");
  const [data, setData] = useState<any[]>([]);
  const [outlines, setOutlines] = useState<Outline[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Speeches State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [speechFormData, setSpeechFormData] = useState({
    meeting_id: "",
    title: "",
    speaker: "",
    congregation: ""
  });

  // Outlines State
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [editingOutlineId, setEditingOutlineId] = useState<string | null>(null);
  const [outlineSearch, setOutlineSearch] = useState("");
  const [outlineFormData, setOutlineFormData] = useState({
    title: "",
    is_blocked: false
  });

  useEffect(() => { 
    loadData(); 
    loadMeetings();
    loadOutlines();
  }, [filterMonth, filterYear]);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .or('type.eq.Final de Semana,type.eq.Visita do Viajante (Final de Semana)')
      .order("date", { ascending: false });
    setMeetings(data || []);
  };

  const loadOutlines = async () => {
    const { data } = await supabase
      .from("outlines")
      .select("*")
      .order("title", { ascending: true });
    setOutlines(data || []);
  };

  const loadData = async () => {
    try {
      const start = `${filterYear}-${filterMonth}-01`;
      const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

      const { data: speechesData, error } = await supabase
        .from("speeches")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) throw error;
      setData(speechesData || []);
    } catch (error: any) {
      toast.error(`Erro ao carregar discursos: ${error.message}`);
    }
  };

  // Speech Handlers
  const handleSpeechSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!speechFormData.meeting_id) return toast.error("Selecione a reunião");
    if (!speechFormData.title) return toast.error("Selecione o tema");

    setLoading(true);
    const selectedMeeting = meetings.find(m => m.id === speechFormData.meeting_id);

    const payload = {
      date: selectedMeeting.date,
      title: speechFormData.title,
      speaker: speechFormData.speaker,
      congregation: speechFormData.congregation
    };

    try {
      const { error } = editingId 
        ? await supabase.from("speeches").update(payload).eq("id", editingId)
        : await supabase.from("speeches").insert([payload]);

      if (error) throw error;

      toast.success("Discurso salvo!");
      setOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechDelete = async (id: string) => {
    const { error } = await supabase.from("speeches").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const handleSpeechEdit = (item: any) => {
    setEditingId(item.id);
    const meeting = meetings.find(m => m.date === item.date);
    setSpeechFormData({
      meeting_id: meeting?.id || "",
      title: item.title,
      speaker: item.speaker,
      congregation: item.congregation
    });
    setOpen(true);
  };

  // Outline Handlers
  const handleOutlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = editingOutlineId
        ? await supabase.from("outlines").update(outlineFormData).eq("id", editingOutlineId)
        : await supabase.from("outlines").insert([outlineFormData]);

      if (error) throw error;

      toast.success("Esboço salvo!");
      setOutlineOpen(false);
      loadOutlines();
    } catch (error: any) {
      toast.error("Erro ao salvar esboço: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOutlineDelete = async (id: string) => {
    const { error } = await supabase.from("outlines").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir esboço");
    else { toast.success("Esboço excluído!"); loadOutlines(); }
  };

  const handleOutlineEdit = (outline: Outline) => {
    setEditingOutlineId(outline.id);
    setOutlineFormData({
      title: outline.title,
      is_blocked: outline.is_blocked
    });
    setOutlineOpen(true);
  };

  const filteredOutlines = outlines.filter(o => 
    o.title.toLowerCase().includes(outlineSearch.toLowerCase())
  );

  const availableOutlines = outlines.filter(o => !o.is_blocked);

  const months = [
    { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
    { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
    { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Discursos</h1>
          <p className="text-muted-foreground">Programação e gestão de esboços</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="speeches">Discursos</TabsTrigger>
          <TabsTrigger value="outlines">Esboços</TabsTrigger>
        </TabsList>

        <TabsContent value="speeches" className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-end">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="number" className="w-[100px]" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditingId(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setSpeechFormData({ meeting_id: "", title: "", speaker: "", congregation: "" })}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Discurso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleSpeechSubmit} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>{editingId ? "Editar" : "Novo"} Discurso</DialogTitle>
                    <DialogDescription>Selecione uma reunião e um tema cadastrado.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Reunião (Fim de Semana)</Label>
                    <Select value={speechFormData.meeting_id} onValueChange={(v) => setSpeechFormData({...speechFormData, meeting_id: v})}>
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
                  <div className="space-y-2">
                    <Label>Tema do Esboço</Label>
                    <Select value={speechFormData.title} onValueChange={(v) => setSpeechFormData({...speechFormData, title: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tema" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableOutlines.map((o) => (
                          <SelectItem key={o.id} value={o.title}>{o.title}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Orador</Label>
                    <Input value={speechFormData.speaker} onChange={e => setSpeechFormData({...speechFormData, speaker: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Congregação</Label>
                    <Input value={speechFormData.congregation} onChange={e => setSpeechFormData({...speechFormData, congregation: e.target.value})} required />
                  </div>
                  <DialogFooter><Button type="submit" disabled={loading}>Salvar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Discurso</TableHead>
                      <TableHead>Orador</TableHead>
                      <TableHead>Congregação</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum discurso este mês.</TableCell></TableRow>
                    ) : (
                      data.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="whitespace-nowrap">{format(parseISO(item.date), "dd/MM/yyyy")}</TableCell>
                          <TableCell className="font-medium">{item.title}</TableCell>
                          <TableCell>{item.speaker}</TableCell>
                          <TableCell>{item.congregation}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" onClick={() => handleSpeechEdit(item)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover este discurso?</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleSpeechDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outlines" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar esboço..." 
                className="pl-9"
                value={outlineSearch}
                onChange={(e) => setOutlineSearch(e.target.value)}
              />
            </div>
            <Dialog open={outlineOpen} onOpenChange={(v) => { setOutlineOpen(v); if(!v) setEditingOutlineId(null); }}>
              <DialogTrigger asChild>
                <Button onClick={() => setOutlineFormData({ title: "", is_blocked: false })}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Esboço
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleOutlineSubmit} className="space-y-4">
                  <DialogHeader>
                    <DialogTitle>{editingOutlineId ? "Editar" : "Novo"} Esboço</DialogTitle>
                    <DialogDescription>Cadastre o tema do esboço para uso nos discursos.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Input 
                      value={outlineFormData.title} 
                      onChange={e => setOutlineFormData({...outlineFormData, title: e.target.value})} 
                      placeholder="Ex: 123 - O que é o Reino?"
                      required 
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="blocked" 
                      checked={outlineFormData.is_blocked} 
                      onCheckedChange={(v) => setOutlineFormData({...outlineFormData, is_blocked: !!v})} 
                    />
                    <Label htmlFor="blocked" className="cursor-pointer">Bloqueado (Não aparecerá na seleção de discursos)</Label>
                  </div>
                  <DialogFooter><Button type="submit" disabled={loading}>Salvar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tema</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOutlines.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum esboço encontrado.</TableCell></TableRow>
                    ) : (
                      filteredOutlines.map(outline => (
                        <TableRow key={outline.id}>
                          <TableCell className="font-medium">{outline.title}</TableCell>
                          <TableCell>
                            {outline.is_blocked ? (
                              <div className="flex items-center text-red-600 text-xs font-bold gap-1">
                                <Lock size={12} /> Bloqueado
                              </div>
                            ) : (
                              <div className="flex items-center text-green-600 text-xs font-bold gap-1">
                                <Unlock size={12} /> Disponível
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            <Button variant="ghost" size="icon" onClick={() => handleOutlineEdit(outline)}><Pencil className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir Esboço?</AlertDialogTitle><AlertDialogDescription>Esta ação removerá o esboço permanentemente.</AlertDialogDescription></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleOutlineDelete(outline.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}