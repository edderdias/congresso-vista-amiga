"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Attendance() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), "MM"));
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "Meio de Semana",
    in_person: 0,
    zoom: 0
  });

  useEffect(() => { loadData(); }, [filterMonth, filterYear]);

  const loadData = async () => {
    try {
      const start = `${filterYear}-${filterMonth}-01`;
      const end = format(endOfMonth(parseISO(start)), "yyyy-MM-dd");

      const { data: attendanceData, error } = await supabase
        .from("attendance")
        .select("*")
        .gte("date", start)
        .lte("date", end)
        .order("date", { ascending: false });

      if (error) throw error;
      setData(attendanceData || []);
    } catch (error: any) {
      console.error("[Attendance] Erro ao carregar:", error);
      toast.error("Erro ao carregar dados. Verifique se a tabela existe.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      date: formData.date,
      type: formData.type,
      in_person: Number(formData.in_person),
      zoom: Number(formData.zoom),
      total: Number(formData.in_person) + Number(formData.zoom)
    };

    try {
      const { error } = editingId 
        ? await supabase.from("attendance").update(payload).eq("id", editingId)
        : await supabase.from("attendance").insert([payload]);

      if (error) throw error;

      toast.success("Salvo com sucesso!");
      setOpen(false);
      loadData();
    } catch (error: any) {
      console.error("[Attendance] Erro ao salvar:", error);
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      date: item.date,
      type: item.type,
      in_person: item.in_person,
      zoom: item.zoom
    });
    setOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      date: format(new Date(), "yyyy-MM-dd"),
      type: "Meio de Semana",
      in_person: 0,
      zoom: 0
    });
  };

  const midweek = data.filter(d => d.type === "Meio de Semana");
  const weekend = data.filter(d => d.type === "Final de Semana");

  const totalMidweek = midweek.reduce((acc, curr) => acc + curr.total, 0);
  const avgMidweek = midweek.length > 0 ? Math.round(totalMidweek / midweek.length) : 0;

  const totalWeekend = weekend.reduce((acc, curr) => acc + curr.total, 0);
  const avgWeekend = weekend.length > 0 ? Math.round(totalWeekend / weekend.length) : 0;

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
          <h1 className="text-3xl font-bold">Assistência</h1>
          <p className="text-muted-foreground">Controle de presença nas reuniões</p>
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
                <DialogHeader><DialogTitle>{editingId ? "Editar" : "Lançar"} Assistência</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Meio de Semana">Meio de Semana</SelectItem>
                        <SelectItem value="Final de Semana">Final de Semana</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Presencial</Label>
                    <Input type="number" value={formData.in_person} onChange={e => setFormData({...formData, in_person: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Zoom</Label>
                    <Input type="number" value={formData.zoom} onChange={e => setFormData({...formData, zoom: parseInt(e.target.value) || 0})} />
                  </div>
                </div>
                <DialogFooter><Button type="submit" disabled={loading}>Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-blue-800">Total Meio de Semana</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-900">{totalMidweek}</div></CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-green-800">Média Meio de Semana</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-900">{avgMidweek}</div></CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-purple-800">Total Fim de Semana</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-purple-900">{totalWeekend}</div></CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-100">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-orange-800">Média Fim de Semana</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-orange-900">{avgWeekend}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Presencial</TableHead>
                  <TableHead>Zoom</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro este mês.</TableCell></TableRow>
                ) : (
                  data.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="whitespace-nowrap">{format(parseISO(item.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell className="whitespace-nowrap">{item.type}</TableCell>
                      <TableCell>{item.in_person}</TableCell>
                      <TableCell>{item.zoom}</TableCell>
                      <TableCell className="font-bold">{item.total}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle><AlertDialogDescription>Deseja remover este registro?</AlertDialogDescription></AlertDialogHeader>
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