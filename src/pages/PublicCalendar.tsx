import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor, Brush, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function PublicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cleaning, setCleaning] = useState<any[]>([]);
  const [av, setAv] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      const [pubs, meets, clean, avDesig] = await Promise.all([
        supabase.from("publishers").select("id, full_name"),
        supabase.from("meetings").select("*").gte("date", start).lte("date", end),
        supabase.from("cleaning_schedules").select("*, groups(group_number)").lte('start_date', end).gte('end_date', start),
        supabase.from("av_designations").select("*")
      ]);

      setPublishers(pubs.data || []);
      setMeetings(meets.data || []);
      setCleaning(clean.data || []);
      setAv(avDesig.data || []);
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
                      return isWithinInterval(day, { start: parseISO(s.start_date), end: parseISO(s.end_date) });
                    } catch (e) {
                      return false;
                    }
                  });
                  
                  return (
                    <div key={i} className={cn("min-h-[150px] p-2 border-r border-b bg-white", !format(day, 'MM').includes(format(currentMonth, 'MM')) && "bg-slate-50 opacity-40")}>
                      <span className="text-sm font-bold text-slate-400">{format(day, 'd')}</span>
                      <div className="mt-2 space-y-2">
                        {dayMeets.map(m => {
                          const d = av.find(a => a.meeting_id === m.id);
                          return (
                            <div key={m.id} onClick={() => setSelectedEvent({ type: 'meeting', data: m, av: d })} className="p-2 rounded bg-blue-50 border border-blue-100 space-y-1 cursor-pointer hover:bg-blue-100 transition-colors">
                              <div className="text-[10px] font-bold text-blue-800 uppercase">{m.type}</div>
                              {d && (
                                <div className="text-[9px] text-blue-600 space-y-0.5">
                                  <div className="flex items-center gap-1"><Monitor size={8} /> {getPubName(d.operator_id)}</div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayClean.map(s => (
                          <div key={s.id} onClick={() => setSelectedEvent({ type: 'cleaning', data: s })} className="p-2 rounded bg-green-50 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-800">
                              <Brush size={10} /> {s.group_id ? `Grupo ${s.groups?.group_number}` : s.notes}
                            </div>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Detalhes da Designação
              </DialogTitle>
              <DialogDescription asChild>
                <div className="space-y-4 pt-4">
                  {selectedEvent?.type === 'meeting' ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label className="text-muted-foreground">Reunião</Label><p className="font-bold">{selectedEvent.data.type}</p></div>
                        <div><Label className="text-muted-foreground">Data</Label><p className="font-bold">{selectedEvent.data.date ? format(parseISO(selectedEvent.data.date), "dd/MM/yyyy") : "-"}</p></div>
                      </div>
                      {selectedEvent.av && (
                        <div className="space-y-2 border-t pt-4">
                          <Label className="text-primary font-bold">Áudio e Vídeo</Label>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Áudio:</span> {getPubName(selectedEvent.av.operator_id)}</div>
                            <div><span className="text-muted-foreground">Vídeo:</span> {getPubName(selectedEvent.av.video_operator_id)}</div>
                            <div><span className="text-muted-foreground">Mic 1:</span> {getPubName(selectedEvent.av.mic_1_id)}</div>
                            <div><span className="text-muted-foreground">Mic 2:</span> {getPubName(selectedEvent.av.mic_2_id)}</div>
                            <div><span className="text-muted-foreground">Palco:</span> {getPubName(selectedEvent.av.stage_id)}</div>
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
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>

        <footer className="text-center text-muted-foreground text-sm py-8">
          <p>© Copyright 2026 Eder Dias | Desenvolvido por Eder Dias</p>
        </footer>
      </div>
    </div>
  );
}