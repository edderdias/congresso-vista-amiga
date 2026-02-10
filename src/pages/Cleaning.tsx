"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface CleaningSchedule {
  id: string;
  group_id: string;
  start_date: string;
  end_date: string;
  cleaning_type: 'weekly' | 'post_meeting';
  notes: string | null;
  groups?: { group_number: number };
}

interface Group {
  id: string;
  group_number: number;
}

export default function Cleaning() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [schedules, setSchedules] = useState<CleaningSchedule[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    group_id: "",
    date: undefined as Date | undefined,
    cleaning_type: "weekly" as 'weekly' | 'post_meeting',
    notes: ""
  });

  useEffect(() => {
    loadData();
  }, [currentMonth]);

  const loadData = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const { data: groupsData } = await supabase.from("groups").select("id, group_number").order("group_number");
    setGroups(groupsData || []);

    const { data: schedulesData } = await supabase
      .from("cleaning_schedules")
      .select("*, groups(group_number)")
      .or(`start_date.gte.${start},end_date.lte.${end}`);
    
    setSchedules(schedulesData || []);
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.group_id || !formData.date) {
      toast.error("Preencha o grupo e a data da semana.");
      return;
    }

    setLoading(true);
    const weekStart = startOfWeek(formData.date, { weekStartsOn: 1 }); // Segunda
    const weekEnd = endOfWeek(formData.date, { weekStartsOn: 1 }); // Domingo

    const { error } = await supabase.from("cleaning_schedules").insert([{
      group_id: formData.group_id,
      start_date: format(weekStart, 'yyyy-MM-dd'),
      end_date: format(weekEnd, 'yyyy-MM-dd'),
      cleaning_type: formData.cleaning_type,
      notes: formData.notes
    }]);

    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Designação salva!");
      setOpen(false);
      setFormData({ group_id: "", date: undefined, cleaning_type: "weekly", notes: "" });
      loadData();
    }
  };

  // Gerar dias do calendário
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter(s => {
      const start = parseISO(s.start_date);
      const end = parseISO(s.end_date);
      return isWithinInterval(day, { start, end });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Escala de Limpeza</h1>
          <p className="text-muted-foreground">Organização semanal da limpeza do Salão do Reino</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Lançar Designação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Nova Designação de Limpeza</DialogTitle>
                <DialogDescription>Selecione a semana e o grupo responsável.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Grupo Responsável</Label>
                  <Select value={formData.group_id} onValueChange={val => setFormData({...formData, group_id: val})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Escolha a Semana (Qualquer dia da semana)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? (
                          `Semana de ${format(startOfWeek(formData.date, { weekStartsOn: 1 }), "dd/MM")} até ${format(endOfWeek(formData.date, { weekStartsOn: 1 }), "dd/MM")}`
                        ) : "Selecione um dia"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => setFormData({...formData, date})}
                        initialFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Limpeza</Label>
                  <Select value={formData.cleaning_type} onValueChange={(val: any) => setFormData({...formData, cleaning_type: val})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal (Geral)</SelectItem>
                      <SelectItem value="post_meeting">Pós Reunião</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <CardTitle className="text-xl capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handlePrevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" onClick={handleNextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-7 border-b bg-slate-50/50">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="py-3 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              const daySchedules = getSchedulesForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div 
                  key={i} 
                  className={cn(
                    "min-h-[120px] p-2 border-r border-b last:border-r-0 relative transition-colors hover:bg-slate-50/30",
                    !isCurrentMonth && "bg-slate-50/50 text-muted-foreground/50"
                  )}
                >
                  <span className={cn(
                    "text-sm font-medium",
                    isSameDay(day, new Date()) && "bg-primary text-primary-foreground w-6 h-6 flex items-center justify-center rounded-full"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  <div className="mt-2 space-y-1">
                    {daySchedules.map(s => (
                      <div 
                        key={s.id} 
                        className={cn(
                          "text-[10px] p-1 rounded border leading-tight",
                          s.cleaning_type === 'weekly' 
                            ? "bg-blue-50 border-blue-200 text-blue-700" 
                            : "bg-green-50 border-green-200 text-green-700"
                        )}
                      >
                        <div className="font-bold">Grupo {s.groups?.group_number}</div>
                        <div>{s.cleaning_type === 'weekly' ? 'Semanal' : 'Pós Reunião'}</div>
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