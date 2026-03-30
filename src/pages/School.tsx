"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Calendar as CalendarIcon, User, BookOpen, Clock, PlusCircle, Users, Eye, Info } from "lucide-react";
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
import { PaginationControls } from "@/components/PaginationControls";

interface Meeting {
  id: string;
  date: string;
  type: string;
}

interface SchoolAssignment {
  id: string;
  meeting_date: string;
  part_type: string;
  student_id: string;
  assistant_id: string | null;
  student_name?: string;
  assistant_name?: string;
}

interface GroupedSchoolProgram {
  date: string;
  assignments: SchoolAssignment[];
}

const ITEMS_PER_PAGE = 10;

export default function School() {
  const [data, setData] = useState<SchoolAssignment[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<GroupedSchoolProgram | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
  const [bibleReading, setBibleReading] = useState({ id: "", student_id: "" });
  const [ministryParts, setMinistryParts] = useState<{ id?: string, min: string, tema: string, student_id: string, assistant_id: string }[]>([]);

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
      setLoading(true);
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
        assistant_name: allPubs?.find(p => p.id === item.assistant_id)?.full_name || "-",
      }));

      setData(formatted);
    } catch (error: any) {
      console.error("[School] Erro ao carregar:", error);
      toast.error("Erro ao carregar dados da escola.");
    } finally {
      setLoading(false);
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
            student_id: d.student_id || "",
            assistant_id: d.assistant_id || ""
          };
        });
      
      setMinistryParts(others.length > 0 ? others : [{ min: "", tema: "", student_id: "", assistant_id: "" }]);
    } else {
      setBibleReading({ id: "", student_id: "" });
      setMinistryParts([{ min: "", tema: "", student_id: "", assistant_id: "" }]);
    }
  };

  const addMinistryPart = () => {
    setMinistryParts([...ministryParts, { min: "", tema: "", student_id: "", assistant_id: "" }]);
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
        student_id: bibleReading.student_id,
        assistant_id: null
      });
    }

    ministryParts.forEach(p => {
      if (p.student_id) {
        payloads.push({
          ...(p.id ? { id: p.id } : {}),
          meeting_date: selectedMeeting.date,
          part_type: `${p.min} min - ${p.tema}`,
          student_id: p.student_id,
          assistant_id: p.assistant_id || null
        });
      }
    });

    if (payloads.length === 0) {
      setLoading(false);
      return toast.error("Preencha pelo menos uma designação");
    }

    try {
      // Separar atualizações de inserções para evitar erro de ID nulo em lote
      const toUpdate = payloads.filter(p => p.id);
      const toInsert = payloads.filter(p => !p.id);

      if (toUpdate.length > 0) {
        const { error: err1 } = await supabase.from("school_assignments").upsert(toUpdate);
        if (err1) throw err1;
      }

      if (toInsert.length > 0) {
        const { error: err2 } = await supabase.from("school_assignments").insert(toInsert);
        if (err2) throw err2;
      }

      toast.success("Programação da escola salva!");
      setOpen(false);
      loadData();
      resetForm();
    } catch (error: any) {
      console.error("Erro ao salvar escola:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (date: string) => {
    const { error } = await supabase.from("school_assignments").delete().eq("meeting_date", date);
    if (error) toast.error("Erro ao excluir programação");
    else {
      toast.success("Programação excluída!");
      loadData();
    }
  };

  const resetForm = () => {
    setSelectedMeeting(null);
    setBibleReading({ id: "", student_id: "" });
    setMinistryParts([{ min: "", tema: "", student_id: "", assistant_id: "" }]);
  };

  const getPubsByPrivilege = (privilege: string, gender?: string, excludeId?: string) => {
    return publishers
      .filter(p => {
        const hasPriv = p.privileges?.includes(privilege);
        const matchesGender = gender ? p.gender === gender : true;
        const isNotExcluded = excludeId ? p.id !== excludeId : true;
        return hasPriv && matchesGender && isNotExcluded;
      })
      .map(p => ({ value: p.id, label: p.full_name }));
  };

  const months = [
    { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
    { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
    { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
    { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
  ];

  const groupedPrograms: GroupedSchoolProgram[] = Array.from(new Set(data.map(d => d.meeting_date)))
    .map(date => ({
      date,
      assignments: data.filter(d => d.meeting_date === date)
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(groupedPrograms.length / ITEMS_PER_PAGE);
  const paginatedPrograms = groupedPrograms.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getBibleReadingStudent = (program: GroupedSchoolProgram) => {
    return program.assignments.find(a => a.part_type === "Leitura da Bíblia")?.student_name || "-";
  };

  const getMinistryPartStudent = (program: GroupedSchoolProgram, index: number) => {
    const parts = program.assignments.filter(a => a.part_type !== "Leitura da Bíblia");
    return parts[index]?.student_name || "-";
  };

  const handleViewProgram = (program: GroupedSchoolProgram) => {
    setSelectedProgram(program);
    setViewOpen(true);
  };

  const handleEditProgram = (program: GroupedSchoolProgram) => {
    const meeting = meetings.find(m => m.date === program.date);
    if (meeting) {
      handleMeetingChange(meeting.id);
      setOpen(true);
    }
  };

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
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
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
                        <div key={index} className="space-y-3 p-4 bg-slate-50 rounded-lg border relative group">
                          <div className="grid grid-cols-12 gap-3 items-end">
                            <div className="col-span-2 space-y-1">
                              <Label className="text-[10px]">Min</Label>
                              <Input placeholder="5" value={part.min} onChange={e => updateMinistryPart(index, "min", e.target.value)} />
                            </div>
                            <div className="col-span-9 space-y-1">
                              <Label className="text-[10px]">Tema</Label>
                              <Input placeholder="Ex: Iniciando Conversas" value={part.tema} onChange={e => updateMinistryPart(index, "tema", e.target.value)} />
                            </div>
                            <div className="col-span-1">
                              <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeMinistryPart(index)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <Label className="text-[10px] flex items-center gap-1"><User size={10} /> Estudante</Label>
                              <Combobox 
                                options={getPubsByPrivilege("Parte de Estudante", undefined, part.assistant_id)} 
                                value={part.student_id} 
                                onChange={(v) => updateMinistryPart(index, "student_id", v)}
                                placeholder="Pesquisar estudante..."
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] flex items-center gap-1"><Users size={10} /> Ajudante</Label>
                              <Combobox 
                                options={getPubsByPrivilege("Parte de Estudante", undefined, part.student_id)} 
                                value={part.assistant_id} 
                                onChange={(v) => updateMinistryPart(index, "assistant_id", v)}
                                placeholder="Pesquisar ajudante..."
                              />
                            </div>
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
        <CardHeader>
          <CardTitle>Programação da Escola</CardTitle>
          <CardDescription>Quadro geral de estudantes por reunião</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Leitura da Bíblia</TableHead>
                  <TableHead>Parte 1</TableHead>
                  <TableHead>Parte 2</TableHead>
                  <TableHead>Parte 3</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedPrograms.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma programação encontrada para este mês.</TableCell></TableRow>
                ) : (
                  paginatedPrograms.map(program => (
                    <TableRow key={program.date}>
                      <TableCell className="whitespace-nowrap font-bold">{format(parseISO(program.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">{getBibleReadingStudent(program)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getMinistryPartStudent(program, 0)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getMinistryPartStudent(program, 1)}</TableCell>
                      <TableCell className="whitespace-nowrap">{getMinistryPartStudent(program, 2)}</TableCell>
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
                                <AlertDialogDescription>Deseja remover todas as designações da escola para a reunião de {format(parseISO(program.date), "dd/MM/yyyy")}?</AlertDialogDescription>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Detalhes da Escola
            </DialogTitle>
            <DialogDescription>
              {selectedProgram && (
                <>Reunião de {format(parseISO(selectedProgram.date), "dd/MM/yyyy")}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="space-y-4 py-4">
              <div className="space-y-2 border-b pb-4">
                <Label className="text-primary font-bold text-xs">Tesouros da Palavra de Deus</Label>
                <div className="flex justify-between items-center bg-slate-50 p-2 rounded">
                  <span className="text-sm font-medium">Leitura da Bíblia</span>
                  <span className="text-sm font-bold">{getBibleReadingStudent(selectedProgram)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-primary font-bold text-xs">Faça seu melhor no ministério</Label>
                {selectedProgram.assignments
                  .filter(a => a.part_type !== "Leitura da Bíblia")
                  .map((a, i) => (
                    <div key={i} className="p-3 bg-slate-50 rounded-lg border space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-primary uppercase">{a.part_type}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground text-[10px] block">Estudante</span>
                          <span className="font-bold">{a.student_name}</span>
                        </div>
                        {a.assistant_name && a.assistant_name !== "-" && (
                          <div>
                            <span className="text-muted-foreground text-[10px] block">Ajudante</span>
                            <span className="font-bold">{a.assistant_name}</span>
                          </div>
                        )}
                      </div>
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