"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, BookOpen, User, Building } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Speeches() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    title: "",
    speaker: "",
    congregation: ""
  });

  useEffect(() => { loadData(); }, [filterMonth, filterYear]);

  const loadData = async () => {
    const start = `${filterYear}-${filterMonth}-01`;
    const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

    const { data: speechesData, error } = await supabase
      .from("speeches")
      .select("*")
      .gte("date", start)
      .lte("date", end)
      .order("date", { ascending: false });

    if (error) toast.error("Erro ao carregar discursos");
    else setData(speechesData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = editingId 
      ? await supabase.from("speeches").update(formData).eq("id", editingId)
      : await supabase.from("speeches").insert([formData]);

    setLoading(false);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Discurso salvo!");
      setOpen(false);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("speeches").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      title: item.title,
      speaker: item.speaker,
      congregation: item.congregation
    });
    setOpen(true);
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
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditingId(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Adicionar</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Discurso</DialogTitle></DialogHeader>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
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