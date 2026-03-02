"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, User, BookOpen, Clock, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Combobox } from "@/components/ui/combobox";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  date: string;
  type: string;
}

export default function School() {
  const [data, setData] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const [bibleReading, setBibleReading] = useState({ id: "", student_id: "" });
  const [ministryParts, setMinistryParts] = useState<{ id?: string, min: string, tema: string, student_id: string }[]>([]);

  useEffect(() => { 
    loadData(); 
    loadPublishers();
    loadMeetings();
  }, [filterMonth, filterYear]);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .eq("type", "Meio de Semana")
      .order("date", { ascending: false });
    setMeetings(data || []);
  };

  const loadPublishers = async () => {
    const { data: pubs } = await supabase
      .from("publishers")
      .select("id, full_name, privileges, gender")
      .eq("status", "active")
      .order("full_name");
    setPublishers(pubs || []);
  };

  const loadData = async () => {
    try {
      const start = `${filterYear}-${filterMonth}-01`;
      const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

      const { data: schoolData, error } = await supabase
        .from("school_assignments")
        .select("*")
        .gte("meeting_date", start)
        .lte("meeting_date", end)
        .order("meeting_date", { ascending: false });

      if (error) throw error;

      const { data: allPubs } = await supabase.from("publishers").select("id, full_name");
      
      const formatted = schoolData.map(item => ({
        ...item,
        student_name: allPubs?.find(p => p.id === item.student_id)?.full_name || "-",
      }));

      setData(formatted);
    } catch (error: any) {
      console.error("[School] Erro ao carregar:", error);
      toast.error("Erro ao carregar dados da escola.");
    }
  };

  const handleMeetingChange = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    setSelectedMeeting(meeting);
    
    const { data } = await supabase
      .from("school_assignments")
      .select("*")
      .eq("meeting_date", meeting.date);

    if (data) {
      const reading = data.find(d => d.part_type === "Leitura da Bíblia");
      setBibleReading({ 
        id: reading?.id || "", 
        student_id: reading?.student_id || "" 
      });

      const others = data
        .filter(d => d.part_type !== "Leitura da Bíblia")
        .map(d => {
          const [min, ...temaParts] = d.part_type.split(" - ");
          return {
            id: d.id,
            min: min.replace(" min", "") || "",
            tema: temaParts.join(" - ") || "",
            student_id: d.student_id
          };
        });
      
      setMinistryParts(others.length > 0 ? others : [{ min: "", tema: "", student_id: "" }]);
    } else {
      setBibleReading({ id: "", student_id: "" });
      setMinistryParts([{ min: "", tema: "", student_id: "" }]);
    }
  };

  const addMinistryPart = () => {
    setMinistryParts([...ministryParts, { min: "", tema: "", student_id: "" }]);
  };

  const removeMinistryPart = (index: number) => {
    setMinistryParts(ministryParts.filter((_, i) => i !== index));
  };

  const updateMinistryPart = (index: number, field: string, value: string) => {
    const newParts = [...ministryParts];
    newParts[index] = { ...newParts[index], [field]: value };
    setMinistryParts(newParts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return toast.error("Selecione a reunião");

    setLoading(true);
    
    const payloads: any[] = [];

    if (bibleReading.student_id) {
      payloads.push({
        ...(bibleReading.id ? { id: bibleReading.id } : {}),
        meeting_date: selectedMeeting.date,
        part_type: "Leitura da Bíblia",
        student_id: bibleReading.student_id
      });
    }

    ministryParts.forEach(p => {
      if (p.student_id) {
        payloads.push({
          ...(p.id ? { id: p.id } : {}),
          meeting_date: selectedMeeting.date,
          part_type: `${p.min} min - ${p.tema}`,
          student_id: p.student_id
        });
      }
    });

    if (payloads.length === 0) {
      setLoading(false);
      return toast.error("Preencha pelo menos uma designação");
    }

    try {
      const { error } = await supabase.from("school_assignments").upsert(payloads);
      if (error) throw error;

      toast.success("Programação da escola salva!");
      setOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("school_assignments").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const resetForm = () => {
    setSelectedMeeting(null);
    setBibleReading({ id: "", student_id: "" });
    setMinistryParts([{ min: "", tema: "", student_id: "" }]);
  };

  const getPubsByPrivilege = (privilege: string, gender?: string) => {
    return publishers
      .filter(p => {
        const hasPriv = p.privileges?.includes(privilege);
        const matchesGender = gender ? p.gender === gender : true;
        return hasPriv && matchesGender;
      })
      .map(p => ({ value: p.id, label: p.full_name }));
  };

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
          <h1 className="text-3xl font-bold">Escola</h1>
          <p className="text-muted-foreground">Gerencie a programação da escola do ministério</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" className="w-[100px]" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Cadastrar</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-6">
                <DialogHeader>
                  <DialogTitle>Programação da Escola</DialogTitle>
                  <DialogDescription>Selecione a reunião de meio de semana e preencha os estudantes.</DialogDescription>
                </DialogHeader>
                
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /> Reunião (Meio de Semana)</Label>
                  <Select value={selectedMeeting?.id || ""} onValueChange={handleMeetingChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a reunião" />
                    </SelectTrigger>
                    <SelectContent>
                      {meetings.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {format(parseISO(m.date), "dd/MM/yyyy")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedMeeting && (
                  <div className="space-y-6 border-t pt-4">
                    <div className="space-y-2">
                      <Label className="text-primary font-bold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Leitura da Bíblia</Label>
                      <Combobox 
                        options={getPubsByPrivilege("Parte de Estudante", "M")} 
                        value={bibleReading.student_id} 
                        onChange={(v) => setBibleReading({...bibleReading, student_id: v})}
                        placeholder="Pesquisar estudante (M)..."
                      />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-primary font-bold flex items-center gap-2">Faça seu melhor no ministério</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addMinistryPart}>
                          <PlusCircle className="h-4 w-4 mr-1" /> Adicionar Parte
                        </Button>
                      </div>
                      
                      {ministryParts.map((part, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-slate-50 rounded-lg border relative group">
                          <div className="col-span-2 space-y-1">
                            <Label className="text-[10px]">Min</Label>
                            <Input placeholder="5" value={part.min} onChange={e => updateMinistryPart(index, "min", e.target.value)} />
                          </div>
                          <div className="col-span-5 space-y-1">
                            <Label className="text-[10px]">Tema</Label>
                            <Input placeholder="Ex: Iniciando Conversas" value={part.tema} onChange={e => updateMinistryPart(index, "tema", e.target.value)} />
                          </div>
                          <div className="col-span-4 space-y-1">
                            <Label className="text-[10px]">Estudante</Label>
                            <Combobox 
                              options={getPubsByPrivilege("Parte de Estudante")} 
                              value={part.student_id} 
                              onChange={(v) => updateMinistryPart(index, "student_id", v)}
                              placeholder="Pesquisar..."
                            />
                          </div>
                          <div className="col-span-1">
                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMinistryPart(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="submit" disabled={loading || !selectedMeeting} className="w-full sm:w-auto">
                    {loading ? "Salvando..." : "Salvar Programação"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Parte</TableHead>
                  <TableHead>Estudante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma designação encontrada para este mês.</TableCell></TableRow>
                ) : (
                  data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{format(parseISO(item.meeting_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">
                        <Badge variant={item.part_type === "Leitura da Bíblia" ? "default" : "outline"}>
                          {item.part_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.student_name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => {
                          const meeting = meetings.find(m => m.date === item.meeting_date);
                          if (meeting) {
                            handleMeetingChange(meeting.id);
                            setOpen(true);
                          }
                        }}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover esta designação da escola?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)}>Sim</AlertDialogAction></AlertDialogFooter>
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
    </div>
  );
}