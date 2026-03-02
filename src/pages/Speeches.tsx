"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Speeches() {
  const [data, setData] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    meeting_id: "",
    title: "",
    speaker: "",
    congregation: ""
  });

  useEffect(() => { 
    loadData(); 
    loadMeetings();
  }, [filterMonth, filterYear]);

  const loadMeetings = async () => {
    const { data } = await supabase
      .from("meetings")
      .select("*")
      .or('type.eq.Final de Semana,type.eq.Visita do Viajante (Final de Semana)')
      .order("date", { ascending: false });
    setMeetings(data || []);
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
      console.error("[Speeches] Erro ao carregar:", error);
      toast.error(`Erro ao carregar discursos: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meeting_id) return toast.error("Selecione a reunião");

    setLoading(true);
    const selectedMeeting = meetings.find(m => m.id === formData.meeting_id);

    const payload = {
      date: selectedMeeting.date,
      title: formData.title,
      speaker: formData.speaker,
      congregation: formData.congregation
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
      console.error("[Speeches] Erro ao salvar:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("speeches").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    const meeting = meetings.find(m => m.date === item.date);
    setFormData({
      meeting_id: meeting?.id || "",
      title: item.title,
      speaker: item.speaker,
      congregation: item.congregation
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      meeting_id: "",
      title: "",
      speaker: "",
      congregation: ""
    });
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
          <h1 className="text-3xl font-bold">Discursos</h1>
          <p className="text-muted-foreground">Programação de discursos públicos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
          </Select>
          <Input type="number" className="w-[100px]" value={filterYear} onChange={e => setFilterYear(e.target.value)} />
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar" : "Novo"} Discurso</DialogTitle>
                  <DialogDescription>Selecione uma reunião de final de semana cadastrada.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label>Reunião (Fim de Semana)</Label>
                  <Select value={formData.meeting_id} onValueChange={(v) => setFormData({...formData, meeting_id: v})}>
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
                  <Label>Tema / Número</Label>
                  <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: 123 - O que é o Reino?" required />
                </div>
                <div className="space-y-2">
                  <Label>Orador</Label>
                  <Input value={formData.speaker} onChange={e => setFormData({...formData, speaker: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Congregação</Label>
                  <Input value={formData.congregation} onChange={e => setFormData({...formData, congregation: e.target.value})} required />
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
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover este discurso?</AlertDialogDescription></AlertDialogHeader>
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