"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Cleaning() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    group_id: "",
    date: undefined as Date | undefined,
    cleaning_type: "Semanal",
    notes: "",
    shared_name: ""
  });

  useEffect(() => { loadData(); }, [currentMonth]);

  const loadData = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data: groupsData } = await supabase.from("groups").select("*").order("group_number");
    const { data: setts } = await supabase.from("settings").select("*").single();
    const { data: scheds } = await supabase.from("cleaning_schedules").select("*, groups(group_number)").or(`start_date.gte.${start},end_date.lte.${end}`);
    
    setGroups(groupsData || []);
    setSettings(setts);
    setSchedules(scheds || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date) return toast.error("Selecione a data");

    setLoading(true);
    const weekStart = startOfWeek(formData.date, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(formData.date, { weekStartsOn: 1 });

    const payload = {
      group_id: formData.shared_name && formData.shared_name !== "none" ? null : formData.group_id,
      start_date: format(weekStart, 'yyyy-MM-dd'),
      end_date: format(weekEnd, 'yyyy-MM-dd'),
      cleaning_type: formData.cleaning_type,
      notes: formData.shared_name && formData.shared_name !== "none" ? formData.shared_name : formData.notes
    };

    const { error } = editingId 
      ? await supabase.from("cleaning_schedules").update(payload).eq("id", editingId)
      : await supabase.from("cleaning_schedules").insert([payload]);

    setLoading(false);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Salvo!"); setOpen(false); loadData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cleaning_schedules").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadData(); }
  };

  const handleEdit = (s: any) => {
    setEditingId(s.id);
    setFormData({
      group_id: s.group_id || "",
      date: parseISO(s.start_date),
      cleaning_type: s.cleaning_type || "Semanal",
      notes: s.notes || "",
      shared_name: s.group_id ? "none" : s.notes
    });
    setOpen(true);
  };

  const calendarDays = eachDayOfInterval({ start: startOfWeek(startOfMonth(currentMonth), {weekStartsOn: 1}), end: endOfWeek(endOfMonth(currentMonth), {weekStartsOn: 1}) });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Escala de Limpeza</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => { setEditingId(null); setFormData({group_id: "", date: undefined, cleaning_type: "Semanal", notes: "", shared_name: ""}); }}><Plus className="h-4 w-4 mr-2" /> Lançar Designação</Button></DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader><DialogTitle>Designação de Limpeza</DialogTitle></DialogHeader>
              
              {settings?.is_shared_building && settings?.shared_congregations?.length > 0 && (
                <div className="space-y-2 border p-3 rounded bg-red-50">
                  <Label className="text-red-700 font-bold">Prédio Dividido - Selecione a Congregação:</Label>
                  <Select value={formData.shared_name} onValueChange={v => setFormData({...formData, shared_name: v, group_id: ""})}>
                    <SelectTrigger><SelectValue placeholder="Selecione se for outra congregação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma (Nossa Congregação)</SelectItem>
                      {settings.shared_congregations.map((c: string) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(!formData.shared_name || formData.shared_name === "none") && (
                <div className="space-y-2">
                  <Label>Grupo Responsável</Label>
                  <Select value={formData.group_id} onValueChange={v => setFormData({...formData, group_id: v})}>
                    <SelectTrigger><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                    <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Tipo de Limpeza</Label>
                <Select value={formData.cleaning_type} onValueChange={v => setFormData({...formData, cleaning_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Semanal">Semanal</SelectItem>
                    <SelectItem value="Pós Reunião">Geral</SelectItem>
                    <SelectItem value="Geral">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Escolha a Semana</Label>
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" className="w-full text-left"><CalendarIcon className="mr-2 h-4 w-4" /> {formData.date ? format(formData.date, "dd/MM/yyyy") : "Selecione"}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.date} onSelect={d => setFormData({...formData, date: d})} locale={ptBR} /></PopoverContent>
                </Popover>
              </div>

              <DialogFooter><Button type="submit" disabled={loading}>Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="capitalize">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b bg-slate-50/50">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => <div key={day} className="py-2 text-center text-xs font-bold text-muted-foreground border-r">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const dayScheds = schedules.filter(s => isWithinInterval(day, { start: parseISO(s.start_date), end: parseISO(s.end_date) }));
              return (
                <div key={i} className={cn("min-h-[120px] p-1 border-r border-b", !isSameMonth(day, currentMonth) && "bg-slate-50/50 opacity-50")}>
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  <div className="mt-1 space-y-1">
                    {dayScheds.map(s => (
                      <div key={s.id} className={cn("text-[9px] p-1 rounded border font-bold group relative", !s.group_id ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700")}>
                        <div className="flex justify-between items-center">
                          <span>{!s.group_id ? s.notes : `G${s.groups?.group_number}`}</span>
                          <div className="hidden group-hover:flex gap-1">
                            <button onClick={() => handleEdit(s)}><Pencil size={8} /></button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><button><Trash2 size={8} /></button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(s.id)}>Sim</AlertDialogAction></AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                        <div className="opacity-70">{s.cleaning_type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}