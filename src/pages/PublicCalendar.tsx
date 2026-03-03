import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor, Brush, Info, BookOpen, Mic2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function PublicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cleaning, setCleaning] = useState<any[]>([]);
  const [av, setAv] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [school, setSchool] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const [pubs, meets, clean, avDesig, theocratic, schoolDesig] = await Promise.all([
        supabase.from("publishers").select("id, full_name"),
        supabase.from("meetings").select("*").gte("date", start).lte("date", end),
        supabase.from("cleaning_schedules").select("*, groups(group_number)").lte('start_date', end).gte('end_date', start),
        supabase.from("av_designations").select("*"),
        supabase.from("designations").select("*").gte("meeting_date", start).lte("meeting_date", end),
        supabase.from("school_assignments").select("*").gte("meeting_date", start).lte("meeting_date", end)
      ]);

      setPublishers(pubs.data || []);
      setMeetings(meets.data || []);
      setCleaning(clean.data || []);
      setAv(avDesig.data || []);
      setDesignations(theocratic.data || []);
      setSchool(schoolDesig.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados do calendário:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPubName = (id: string) => publishers.find(p => p.id === id)?.full_name || "-";

  const calendarDays = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(currentMonth), {weekStartsOn: 1}), 
    end: endOfWeek(endOfMonth(currentMonth), {weekStartsOn: 1}) 
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" /> Calendário da Congregação
          </h1>
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}><ChevronLeft /></Button>
            <span className="text-xl font-bold capitalize min-w-[150px] text-center">{format(currentMonth, "MMMM yyyy", { locale: ptBR })}</span>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}><ChevronRight /></Button>
          </div>
        </div>

        <Card className="shadow-xl border-none overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-7 bg-primary text-primary-foreground">
              {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(d => (
                <div key={d} className="py-3 text-center text-sm font-bold border-r border-primary-foreground/20 last:border-0">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {loading ? (
                <div className="col-span-7 h-64 flex items-center justify-center text-muted-foreground">
                  Carregando calendário...
                </div>
              ) : (
                calendarDays.map((day, i) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const dayMeets = meetings.filter(m => m.date === dayStr);
                  
                  const dayClean = cleaning.filter(s => {
                    if (!s.start_date || !s.end_date) return false;
                    try {
                      return isWithinInterval(day, { 
                        start: parseISO(s.start_date), 
                        end: parseISO(s.end_date) 
                      });
                    } catch (e) {
                      return false;
                    }
                  });
                  
                  return (
                    <div key={i} className={cn("min-h-[150px] p-2 border-r border-b bg-white", !isSameMonth(day, currentMonth) && "bg-slate-50 opacity-40")}>
                      <span className="text-sm font-bold text-slate-400">{format(day, 'd')}</span>
                      <div className="mt-2 space-y-2">
                        {dayMeets.map(m => {
                          const dAv = av.find(a => a.meeting_id === m.id);
                          const dTheocratic = designations.filter(d => d.meeting_date === m.date);
                          const dSchool = school.filter(s => s.meeting_date === m.date);
                          
                          return (
                            <div key={m.id} onClick={() => setSelectedEvent({ 
                              type: 'meeting', 
                              data: m, 
                              av: dAv,
                              designations: dTheocratic,
                              school: dSchool
                            })} className="p-2 rounded bg-blue-50 border border-blue-100 space-y-1 cursor-pointer hover:bg-blue-100 transition-colors">
                              <div className="text-[10px] font-bold text-blue-800 uppercase truncate">{m.type}</div>
                              {dAv && (
                                <div className="text-[9px] text-blue-600 space-y-0.5">
                                  <div className="flex items-center gap-1"><Monitor size={8} /> {getPubName(dAv.operator_id)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayClean.map(s => (
                          <div 
                            key={s.id} 
                            onClick={() => setSelectedEvent({ type: 'cleaning', data: s })} 
                            className={cn(
                              "p-2 rounded border cursor-pointer transition-colors",
                              s.cleaning_type === "Semanal" 
                                ? "bg-red-50 border-red-100 hover:bg-red-100" 
                                : "bg-green-50 border-green-100 hover:bg-green-100"
                            )}
                          >
                            <div className={cn(
                              "flex items-center gap-1 text-[10px] font-bold",
                              s.cleaning_type === "Semanal" ? "text-red-800" : "text-green-800"
                            )}>
                              <Brush size={10} /> {s.group_id ? `Grupo ${s.groups?.group_number}` : s.notes}
                            </div>
                            <div className={cn(
                              "text-[8px]",
                              s.cleaning_type === "Semanal" ? "text-red-600" : "text-green-600"
                            )}>{s.cleaning_type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Detalhes da Designação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {selectedEvent?.type === 'meeting' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                    <div><Label className="text-muted-foreground text-xs">Reunião</Label><p className="font-bold text-sm">{selectedEvent.data.type}</p></div>
                    <div><Label className="text-muted-foreground text-xs">Data</Label><p className="font-bold text-sm">{selectedEvent.data.date ? format(parseISO(selectedEvent.data.date), "dd/MM/yyyy") : "-"}</p></div>
                  </div>

                  {selectedEvent.av && (
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-primary font-bold flex items-center gap-2"><Monitor className="h-4 w-4" /> Áudio e Vídeo</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg">
                        <div><span className="text-muted-foreground">Áudio:</span> {getPubName(selectedEvent.av.operator_id)}</div>
                        <div><span className="text-muted-foreground">Vídeo:</span> {getPubName(selectedEvent.av.video_operator_id)}</div>
                        <div><span className="text-muted-foreground">Mic 1:</span> {getPubName(selectedEvent.av.mic_1_id)}</div>
                        <div><span className="text-muted-foreground">Mic 2:</span> {getPubName(selectedEvent.av.mic_2_id)}</div>
                        <div className="col-span-2"><span className="text-muted-foreground">Palco:</span> {getPubName(selectedEvent.av.stage_id)}</div>
                      </div>
                    </div>
                  )}

                  {selectedEvent.designations?.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-primary font-bold flex items-center gap-2"><Mic2 className="h-4 w-4" /> Programação da Reunião</Label>
                      <div className="space-y-2">
                        {selectedEvent.designations.map((d: any, i: number) => (
                          <div key={i} className="flex justify-between items-start text-xs border-b border-slate-100 pb-1 last:border-0">
                            <div className="flex-1">
                              <span className="font-bold text-slate-700">{d.designation_type}</span>
                              {d.notes && <p className="text-[10px] text-muted-foreground italic">{d.notes}</p>}
                            </div>
                            <span className="font-medium">{getPubName(d.user_id)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvent.school?.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                      <Label className="text-primary font-bold flex items-center gap-2"><BookOpen className="h-4 w-4" /> Escola do Ministério</Label>
                      <div className="space-y-3">
                        {selectedEvent.school.map((s: any, i: number) => (
                          <div key={i} className="bg-slate-50 p-2 rounded border border-slate-100">
                            <div className="text-[10px] font-bold text-primary uppercase mb-1">{s.part_type}</div>
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex items-center gap-1"><User size={10} className="text-muted-foreground" /> {getPubName(s.student_id)}</div>
                              {s.assistant_id && (
                                <div className="flex items-center gap-1"><Users size={10} className="text-muted-foreground" /> {getPubName(s.assistant_id)}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label className="text-muted-foreground">Tipo</Label><p className="font-bold">Limpeza {selectedEvent?.data.cleaning_type}</p></div>
                    <div><Label className="text-muted-foreground">Semana</Label><p className="font-bold">{selectedEvent?.data.start_date ? format(parseISO(selectedEvent.data.start_date), "dd/MM") : "-"} a {selectedEvent?.data.end_date ? format(parseISO(selectedEvent.data.end_date), "dd/MM") : "-"}</p></div>
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-primary font-bold">Responsável</Label>
                    <p className="text-lg font-bold">{selectedEvent?.data.group_id ? `Grupo ${selectedEvent.data.groups?.group_number}` : selectedEvent?.data.notes}</p>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedEvent(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <footer className="text-center text-muted-foreground text-sm py-8">
        <p>© Copyright 2026 Eder Dias | Desenvolvido por Eder Dias</p>
      </footer>
    </div>
  );
}