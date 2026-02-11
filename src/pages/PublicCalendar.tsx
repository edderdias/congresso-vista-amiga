import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor, Brush, Info, Award, Mic, User, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function PublicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cleaning, setCleaning] = useState<any[]>([]);
  const [av, setAv] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [congregationName, setCongregationName] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, [currentMonth]);

  const loadData = async () => {
    setLoading(true);
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    try {
      // Buscamos todos os dados necessários para o período
      const [pubs, meets, clean, avDesig, generalDesig, settings] = await Promise.all([
        supabase.from("publishers").select("id, full_name"),
        supabase.from("meetings").select("*").gte("date", start).lte("date", end),
        supabase.from("cleaning_schedules").select("*, groups(group_number)").lte('start_date', end).gte('end_date', start),
        supabase.from("av_designations").select("*"),
        supabase.from("designations").select("*, profiles(full_name)").gte("meeting_date", start).lte("meeting_date", end),
        supabase.from("settings").select("congregation_name").single()
      ]);

      setPublishers(pubs.data || []);
      setMeetings(meets.data || []);
      setCleaning(clean.data || []);
      setAv(avDesig.data || []);
      setDesignations(generalDesig.data || []);
      if (settings.data) setCongregationName(settings.data.congregation_name);
    } catch (error) {
      console.error("[PublicCalendar] Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPubName = (id: string) => {
    if (!id || id === "none") return "-";
    return publishers.find(p => p.id === id)?.full_name || "-";
  };

  const calendarDays = eachDayOfInterval({ 
    start: startOfWeek(startOfMonth(currentMonth), {weekStartsOn: 1}), 
    end: endOfWeek(endOfMonth(currentMonth), {weekStartsOn: 1}) 
  });

  const getDesignationLabel = (type: string) => {
    const types: Record<string, string> = {
      sound: "Som",
      attendant: "Indicador",
      literature: "Literatura",
      cleaning: "Limpeza",
      security: "Segurança"
    };
    return types[type] || type;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-bold text-primary flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" /> Calendário da Congregação {congregationName && `- ${congregationName}`}
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
                      const start = parseISO(s.start_date);
                      const end = parseISO(s.end_date);
                      return isWithinInterval(day, { start, end });
                    } catch (e) {
                      return false;
                    }
                  });
                  const dayDesigs = designations.filter(d => d.meeting_date === dayStr);
                  
                  return (
                    <div key={i} className={cn("min-h-[160px] p-2 border-r border-b bg-white transition-colors hover:bg-slate-50/50", !format(day, 'MM').includes(format(currentMonth, 'MM')) && "bg-slate-50 opacity-40")}>
                      <span className="text-sm font-bold text-slate-400">{format(day, 'd')}</span>
                      <div className="mt-2 space-y-2">
                        {dayMeets.map(m => {
                          const d = av.find(a => a.meeting_id === m.id);
                          return (
                            <div key={m.id} onClick={() => setSelectedEvent({ type: 'meeting', data: m, av: d })} className="p-2 rounded bg-blue-50 border border-blue-100 space-y-1 cursor-pointer hover:bg-blue-100 transition-colors shadow-sm">
                              <div className="text-[10px] font-bold text-blue-800 uppercase truncate">{m.type}</div>
                              {d && (
                                <div className="text-[9px] text-blue-600 space-y-0.5">
                                  {(d.operator_id || d.video_operator_id) && (
                                    <div className="flex items-center gap-1"><Monitor size={8} /> A/V Definido</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {dayDesigs.map(d => (
                          <div key={d.id} onClick={() => setSelectedEvent({ type: 'designation', data: d })} className="p-2 rounded bg-purple-50 border border-purple-100 space-y-1 cursor-pointer hover:bg-purple-100 transition-colors shadow-sm">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-purple-800">
                              <Award size={10} /> {getDesignationLabel(d.designation_type)}
                            </div>
                            <div className="text-[9px] text-purple-600 truncate">{d.profiles?.full_name}</div>
                          </div>
                        ))}
                        {dayClean.map(s => (
                          <div key={s.id} onClick={() => setSelectedEvent({ type: 'cleaning', data: s })} className="p-2 rounded bg-red-50 border border-green-100 cursor-pointer hover:bg-green-100 transition-colors shadow-sm">
                            <div className="flex items-center gap-1 text-[10px] font-bold text-green-800">
                              <Brush size={10} /> {s.group_id ? `Grupo ${s.groups?.group_number}` : s.notes}
                            </div>
                            <div className="text-[8px] text-green-600">{s.cleaning_type}</div>
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
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Info className="h-6 w-6 text-primary" /> Detalhes da Programação
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {selectedEvent?.type === 'meeting' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                    <div><Label className="text-muted-foreground text-xs">Reunião</Label><p className="font-bold text-blue-800">{selectedEvent.data.type}</p></div>
                    <div><Label className="text-muted-foreground text-xs">Data</Label><p className="font-bold">{selectedEvent.data.date ? format(parseISO(selectedEvent.data.date), "dd/MM/yyyy") : "-"}</p></div>
                  </div>
                  {selectedEvent.av ? (
                    <div className="space-y-3 border-t pt-4">
                      <Label className="text-primary font-bold flex items-center gap-2"><Monitor className="h-4 w-4" /> Designações de Áudio e Vídeo</Label>
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Mic size={14} /> Áudio:</span> 
                          <span className="font-semibold">{getPubName(selectedEvent.av.operator_id)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Video size={14} /> Vídeo:</span> 
                          <span className="font-semibold">{getPubName(selectedEvent.av.video_operator_id)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Mic size={14} /> Microfone 1:</span> 
                          <span className="font-semibold">{getPubName(selectedEvent.av.mic_1_id)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><Mic size={14} /> Microfone 2:</span> 
                          <span className="font-semibold">{getPubName(selectedEvent.av.mic_2_id)}</span>
                        </div>
                        <div className="flex justify-between border-b pb-1">
                          <span className="text-muted-foreground flex items-center gap-1"><User size={14} /> Palco:</span> 
                          <span className="font-semibold">{getPubName(selectedEvent.av.stage_id)}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhuma designação de A/V registrada para esta reunião.</p>
                  )}
                </>
              ) : selectedEvent?.type === 'designation' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                    <div><Label className="text-muted-foreground text-xs">Tipo</Label><p className="font-bold text-purple-800">{getDesignationLabel(selectedEvent.data.designation_type)}</p></div>
                    <div><Label className="text-muted-foreground text-xs">Data</Label><p className="font-bold">{selectedEvent.data.meeting_date ? format(parseISO(selectedEvent.data.meeting_date), "dd/MM/yyyy") : "-"}</p></div>
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-primary font-bold flex items-center gap-2"><Award className="h-4 w-4" /> Designado</Label>
                    <p className="text-xl font-bold mt-1">{selectedEvent.data.profiles?.full_name}</p>
                  </div>
                  {selectedEvent.data.notes && (
                    <div className="border-t pt-4">
                      <Label className="text-muted-foreground text-xs">Observações</Label>
                      <p className="text-sm bg-slate-50 p-2 rounded mt-1">{selectedEvent.data.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                    <div><Label className="text-muted-foreground text-xs">Tipo de Limpeza</Label><p className="font-bold text-green-800">{selectedEvent?.data.cleaning_type}</p></div>
                    <div><Label className="text-muted-foreground text-xs">Semana</Label><p className="font-bold">{selectedEvent?.data.start_date ? format(parseISO(selectedEvent.data.start_date), "dd/MM") : "-"} a {selectedEvent?.data.end_date ? format(parseISO(selectedEvent.data.end_date), "dd/MM") : "-"}</p></div>
                  </div>
                  <div className="border-t pt-4">
                    <Label className="text-primary font-bold flex items-center gap-2"><Brush className="h-4 w-4" /> Responsável</Label>
                    <p className="text-xl font-bold mt-1">{selectedEvent?.data.group_id ? `Grupo ${selectedEvent.data.groups?.group_number}` : selectedEvent?.data.notes}</p>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <footer className="text-center text-muted-foreground text-sm py-8">
          <p>© Copyright 2026 Eder Dias | Desenvolvido por Eder Dias</p>
        </footer>
      </div>
    </div>
  );
}