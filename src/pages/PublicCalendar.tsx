import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isWithinInterval, parseISO, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Monitor, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cleaning, setCleaning] = useState<any[]>([]);
  const [av, setAv] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);

  useEffect(() => { loadData(); }, [currentMonth]);

  const loadData = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

    const [pubs, meets, clean, avDesig] = await Promise.all([
      supabase.from("publishers").select("id, full_name"),
      supabase.from("meetings").select("*").gte("date", start).lte("date", end),
      supabase.from("cleaning_schedules").select("*, groups(group_number)").or(`start_date.gte.${start},end_date.lte.${end}`),
      supabase.from("av_designations").select("*")
    ]);

    setPublishers(pubs.data || []);
    setMeetings(meets.data || []);
    setCleaning(clean.data || []);
    setAv(avDesig.data || []);
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
              {calendarDays.map((day, i) => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dayMeets = meetings.filter(m => m.date === dayStr);
                const dayClean = cleaning.filter(s => isWithinInterval(day, { start: parseISO(s.start_date), end: parseISO(s.end_date) }));
                
                return (
                  <div key={i} className={cn("min-h-[150px] p-2 border-r border-b bg-white", !format(day, 'MM').includes(format(currentMonth, 'MM')) && "bg-slate-50 opacity-40")}>
                    <span className="text-sm font-bold text-slate-400">{format(day, 'd')}</span>
                    <div className="mt-2 space-y-2">
                      {dayMeets.map(m => {
                        const d = av.find(a => a.meeting_id === m.id);
                        return (
                          <div key={m.id} className="p-2 rounded bg-blue-50 border border-blue-100 space-y-1">
                            <div className="text-[10px] font-bold text-blue-800 uppercase">{m.type}</div>
                            {d && (
                              <div className="text-[9px] text-blue-600 space-y-0.5">
                                <div className="flex items-center gap-1"><Monitor size={8} /> {getPubName(d.operator_id)}</div>
                                <div className="flex items-center gap-1"><Monitor size={8} /> {getPubName(d.video_operator_id)}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {dayClean.map(s => (
                        <div key={s.id} className="p-2 rounded bg-green-50 border border-green-100">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-green-800">
                            <Brush size={10} /> {s.group_id ? `Grupo ${s.groups?.group_number}` : s.notes}
                          </div>
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
    </div>
  );
}