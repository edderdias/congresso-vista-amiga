"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
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

export default function School() {
  const [data, setData] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    meeting_date: format(new Date(), "yyyy-MM-dd"),
    part_type: "Leitura da Bíblia",
    student_id: "",
    assistant_id: "none"
  });

  useEffect(() => { 
    loadData(); 
    loadPublishers();
  }, [filterMonth, filterYear]);

  const loadPublishers = async () => {
    const { data: pubs } = await supabase
      .from("publishers")
      .select("id, full_name, privileges")
      .eq("status", "active")
      .order("full_name");
    
    // Filtra apenas quem tem "Parte de Estudante"
    const students = pubs?.filter(p => p.privileges?.includes("Parte de Estudante")) || [];
    setPublishers(students);
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

      // Como não podemos alterar a estrutura para joins complexos, buscamos os nomes manualmente
      const { data: allPubs } = await supabase.from("publishers").select("id, full_name");
      
      const formatted = schoolData.map(item => ({
        ...item,
        student_name: allPubs?.find(p => p.id === item.student_id)?.full_name || "-",
        assistant_name: allPubs?.find(p => p.id === item.assistant_id)?.full_name || "-"
      }));

      setData(formatted);
    } catch (error: any) {
      console.error("[School] Erro ao carregar:", error);
      toast.error("Erro ao carregar dados da escola.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.student_id) return toast.error("Selecione o estudante principal");

    setLoading(true);
    const payload = {
      meeting_date: formData.meeting_date,
      part_type: formData.part_type,
      student_id: formData.student_id,
      assistant_id: formData.assistant_id === "none" ? null : formData.assistant_id
    };

    try {
      const { error } = editingId 
        ? await supabase.from("school_assignments").update(payload).eq("id", editingId)
        : await supabase.from("school_assignments").insert([payload]);

      if (error) throw error;

      toast.success("Designação salva!");
      setOpen(false);
      loadData();
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

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      meeting_date: item.meeting_date,
      part_type: item.part_type,
      student_id: item.student_id,
      assistant_id: item.assistant_id || "none"
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      meeting_date: format(new Date(), "yyyy-MM-dd"),
      part_type: "Leitura da Bíblia",
      student_id: "",
      assistant_id: "none"
    });
  };

  const parts = [
    "Leitura da Bíblia", "Iniciando Conversas 1", "Iniciando Conversas 2", 
    "Cultivando o Interesse", "Explicando suas crenças", 
    "Fazendo Discípulos 1", "Fazendo Discípulos 2", "Discurso"
  ];

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
            <DialogContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Nova"} Designação de Escola</DialogTitle>
                  <DialogDescription>Apenas publicadores com privilégio "Parte de Estudante" são listados.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.meeting_date} onChange={e => setFormData({...formData, meeting_date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Parte</Label>
                  <Select value={formData.part_type} onValueChange={v => setFormData({...formData, part_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{parts.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Principal</Label>
                  <Select value={formData.student_id} onValueChange={v => setFormData({...formData, student_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o estudante" /></SelectTrigger>
                    <SelectContent>
                      {publishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ajudante</Label>
                  <Select value={formData.assistant_id} onValueChange={v => setFormData({...formData, assistant_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o ajudante" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {publishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit" disabled={loading}>Salvar</Button></DialogFooter>
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
                  <TableHead>Principal</TableHead>
                  <TableHead>Ajudante</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma designação encontrada para este mês.</TableCell></TableRow>
                ) : (
                  data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{format(parseISO(item.meeting_date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="font-medium">{item.part_type}</TableCell>
                      <TableCell>{item.student_name}</TableCell>
                      <TableCell>{item.assistant_name}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover esta designação da escola?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim</AlertDialogAction></AlertDialogFooter>
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