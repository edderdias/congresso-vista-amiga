import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function MeetingPrint() {
  const { year, month } = useParams();
  const navigate = useNavigate();
  const [weeks, setWeeks] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (year && month) loadData();
  }, [year, month]);

  const loadData = async () => {
    setLoading(true);
    try {
      const start = `${year}-${month}-01`;
      const monthStart = startOfMonth(parseISO(start));
      const monthEnd = endOfMonth(monthStart);

      const [pubs, meets, avDesig, theocratic, schoolDesig, speechesData, cleaningData, setts] = await Promise.all([
        supabase.from("publishers").select("id, full_name"),
        supabase.from("meetings").select("*").gte("date", format(monthStart, 'yyyy-MM-dd')).lte("date", format(monthEnd, 'yyyy-MM-dd')).order("date", { ascending: true }),
        supabase.from("av_designations").select("*"),
        supabase.from("designations").select("*").gte("meeting_date", format(monthStart, 'yyyy-MM-dd')).lte("meeting_date", format(monthEnd, 'yyyy-MM-dd')),
        supabase.from("school_assignments").select("*").gte("meeting_date", format(monthStart, 'yyyy-MM-dd')).lte("meeting_date", format(monthEnd, 'yyyy-MM-dd')),
        supabase.from("speeches").select("*").gte("date", format(monthStart, 'yyyy-MM-dd')).lte("date", format(monthEnd, 'yyyy-MM-dd')),
        supabase.from("cleaning_schedules").select("*, groups(group_number)").gte("end_date", format(monthStart, 'yyyy-MM-dd')).lte("start_date", format(monthEnd, 'yyyy-MM-dd')),
        supabase.from("settings").select("*").single()
      ]);

      setPublishers(pubs.data || []);
      setSettings(setts.data);

      // Group by week
      const groupedWeeks: any[] = [];
      let current = startOfWeek(monthStart, { weekStartsOn: 1 });
      
      while (current <= monthEnd) {
        const wStart = current;
        const wEnd = endOfWeek(current, { weekStartsOn: 1 });
        
        const weekMeetings = (meets.data || []).filter(m => {
          const d = parseISO(m.date);
          return d >= wStart && d <= wEnd;
        });

        if (weekMeetings.length > 0) {
          const midweek = weekMeetings.find(m => m.type.includes("Meio de Semana"));
          const weekend = weekMeetings.find(m => m.type.includes("Final de Semana") || m.type === "Especial" || m.type === "Celebração");
          
          const weekCleaning = (cleaningData.data || []).find(c => {
            const cStart = parseISO(c.start_date);
            const cEnd = parseISO(c.end_date);
            return isWithinInterval(wStart, { start: cStart, end: cEnd }) || isWithinInterval(wEnd, { start: cStart, end: cEnd });
          });

          groupedWeeks.push({
            start: wStart,
            end: wEnd,
            midweek,
            weekend,
            cleaning: weekCleaning,
            av: avDesig.data || [],
            designations: theocratic.data || [],
            school: schoolDesig.data || [],
            speeches: speechesData.data || []
          });
        }
        current = addDays(wEnd, 1);
      }

      setWeeks(groupedWeeks);
    } catch (error) {
      console.error("Erro ao carregar dados para impressão:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPubName = (id: string) => publishers.find(p => p.id === id)?.full_name || "-";
  
  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-0">
        <div className="flex justify-between items-center print:hidden mb-8">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir Tudo</Button>
        </div>

        <style>{`
          @media print {
            .week-container { page-break-after: always; border: none !important; padding: 0 !important; margin: 0 !important; }
            .week-container:last-child { page-break-after: auto; }
            body { padding: 0; margin: 0; }
          }
          .week-container {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto 40px auto;
            border: 1px solid #ccc;
            padding: 20px;
            color: #333;
            background: white;
          }
          .print-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 5px; margin-bottom: 10px; }
          .lugar { font-size: 14px; }
          .titulo { font-size: 18px; font-weight: bold; }
          .data-destaque { background-color: #3e5a84; color: white; padding: 10px; font-weight: bold; text-align: center; margin-bottom: 15px; text-transform: uppercase; }
          .week-container h2 { border-bottom: 1px dotted #ccc; padding-bottom: 5px; margin-top: 25px; margin-bottom: 10px; font-size: 16px; text-transform: uppercase; }
          .tabela-designacoes { width: 100%; border-collapse: collapse; font-size: 14px; }
          .tabela-designacoes th, .tabela-designacoes td { border: 1px solid #ccc; padding: 5px; text-align: left; }
          .tabela-designacoes th { background-color: #a0a0a0; color: white; }
          .col-pequena { width: 30px; background-color: #a0a0a0; color: white; text-align: center; }
          .secao-limpeza { display: flex; align-items: flex-start; margin-top: 15px; font-size: 14px; }
          .info-limpeza { margin-right: 20px; }
          .limpeza-headers, .limpeza-body { display: flex; }
          .limpeza-item { width: 100px; border: 1px solid #ccc; padding: 5px; text-align: center; }
          .limpeza-headers .limpeza-item { background-color: #707070; color: white; }
          .limpeza-body .limpeza-item.grupo { background-color: #4CAF50; color: white; width: 202px; }
          .nota-importante { color: red; font-size: 12px; flex: 1; margin: 0; }
          .info-reuniao { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 10px; }
          .secao-reuniao { margin-bottom: 10px; border-collapse: collapse; width: 100%; font-size: 14px; }
          .secao-header { color: white; padding: 5px; font-weight: bold; }
          .tesouros { background-color: #606060; }
          .ministerio { background-color: #f7b731; color: black; }
          .vida-crista { background-color: #9e1c1c; }
          .item-reuniao td { padding: 5px; vertical-align: top; border-bottom: 1px solid #ede9df; }
          .tempo { width: 50px; font-weight: bold; }
          .designados { text-align: right; font-weight: bold; }
          .sub-header { background-color: #d0d0d0; font-weight: bold; }
          .reuniao-fim-semana-item { margin-bottom: 10px; font-size: 14px; display: flex; justify-content: space-between; align-items: start; border-bottom: 1px solid #ede9df; padding-bottom: 5px; }
          .reuniao-fim-semana-item .tempo { width: 60px; font-weight: bold; }
          .reuniao-fim-semana-item .tema { flex: 1; margin-left: 10px; }
          .reuniao-fim-semana-item .designados { width: auto; text-align: right; font-weight: bold; }
          .leitor-box { background-color: #d0d0d0; padding: 2px 5px; font-weight: bold; display: inline-block; margin-bottom: 2px; font-size: 11px; }
        `}</style>

        {weeks.map((week, idx) => {
          const avMid = week.av.find((a: any) => a.meeting_id === week.midweek?.id);
          const avEnd = week.av.find((a: any) => a.meeting_id === week.weekend?.id);
          
          const findDesig = (list: any[], date: string, type: string) => list.find(d => d.meeting_date === date && d.designation_type === type);
          
          return (
            <div key={idx} className="week-container">
              <header className="print-header">
                <div className="lugar">{settings?.congregation_name || "Congregação"}</div>
                <div className="titulo">Programação da Semana</div>
              </header>

              <div className="data-destaque">
                Semana de<br />
                {format(week.start, "dd", { locale: ptBR })} A {format(week.end, "dd 'DE' MMMM", { locale: ptBR })}
              </div>

              <h2>Designações Mecânicas</h2>

              <table className="tabela-designacoes">
                <thead>
                  <tr>
                    <th colSpan={3}>Áudio e Vídeo</th>
                    <th colSpan={2}>Indicadores</th>
                  </tr>
                  <tr>
                    <th className="col-pequena"></th>
                    <th>Operador</th>
                    <th>Microfones Volante</th>
                    <th>Interno e Palco</th>
                    <th>Externo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="col-pequena">Q</td>
                    <td>{getPubName(avMid?.operator_id)}</td>
                    <td>{getPubName(avMid?.mic_1_id)}, {getPubName(avMid?.mic_2_id)}</td>
                    <td>{getPubName(avMid?.stage_id)}</td>
                    <td>{getPubName(avMid?.external_indicator_id)}</td>
                  </tr>
                  <tr>
                    <td className="col-pequena">D</td>
                    <td>{getPubName(avEnd?.operator_id)}</td>
                    <td>{getPubName(avEnd?.mic_1_id)}, {getPubName(avEnd?.mic_2_id)}</td>
                    <td>{getPubName(avEnd?.stage_id)}</td>
                    <td>{getPubName(avEnd?.external_indicator_id)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="secao-limpeza">
                <div className="info-limpeza">
                  <div className="limpeza-headers">
                    <div className="limpeza-item">Semanal</div>
                    <div className="limpeza-item">Pós-Reunião</div>
                  </div>
                  <div className="limpeza-body">
                    <div className="limpeza-item grupo">
                      {week.cleaning ? (week.cleaning.group_id ? `Grupo ${week.cleaning.groups?.group_number}` : week.cleaning.notes) : "-"}
                    </div>
                  </div>
                </div>
                <p className="nota-importante">Verifique com antecedência as designações. Revise as orientações para a limpeza, áudio e vídeo e para indicadores antes de cumprir as designações.</p>
              </div>

              {week.midweek && (
                <>
                  <h2>Reunião de Meio de Semana</h2>
                  <div className="info-reuniao">
                    <div><strong>Presidente:</strong> {getPubName(findDesig(week.designations, week.midweek.date, "Presidente")?.user_id)}</div>
                    <div><strong>Orações:</strong> {getPubName(findDesig(week.designations, week.midweek.date, "Oração Inicial")?.user_id)} / {getPubName(findDesig(week.designations, week.midweek.date, "Oração Final")?.user_id)}</div>
                  </div>

                  <table className="secao-reuniao">
                    <tbody>
                      <tr className="secao-header tesouros">
                        <td colSpan={3}>TESOUROS DA PALAVRA DE DEUS</td>
                      </tr>
                      <tr className="item-reuniao">
                        <td className="tempo">10min</td>
                        <td className="tema">{findDesig(week.designations, week.midweek.date, "Tesouro")?.notes || "Tesouro"}</td>
                        <td className="designados">{getPubName(findDesig(week.designations, week.midweek.date, "Tesouro")?.user_id)}</td>
                      </tr>
                      <tr className="item-reuniao">
                        <td className="tempo">10min</td>
                        <td className="tema">Joias Espirituais</td>
                        <td className="designados">{getPubName(findDesig(week.designations, week.midweek.date, "Joias Espirituais")?.user_id)}</td>
                      </tr>
                      <tr className="item-reuniao">
                        <td className="tempo">04min</td>
                        <td className="tema">Leitura da Bíblia</td>
                        <td className="designados">{getPubName(week.school.find((s: any) => s.meeting_date === week.midweek.date && s.part_type === "Leitura da Bíblia")?.student_id)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table className="secao-reuniao">
                    <tbody>
                      <tr className="secao-header ministerio">
                        <td colSpan={3}>FAÇA SEU MELHOR NO MINISTÉRIO</td>
                      </tr>
                      {week.school.filter((s: any) => s.meeting_date === week.midweek.date && s.part_type !== "Leitura da Bíblia").map((s: any, i: number) => (
                        <tr key={i} className="item-reuniao">
                          <td className="tempo">{s.part_type.split(" - ")[0]}</td>
                          <td className="tema">{s.part_type.split(" - ")[1]}</td>
                          <td className="designados">
                            {getPubName(s.student_id)}
                            {s.assistant_id && <>, {getPubName(s.assistant_id)}</>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <table className="secao-reuniao">
                    <tbody>
                      <tr className="secao-header vida-crista">
                        <td colSpan={3}>NOSSA VIDA CRISTÃ</td>
                      </tr>
                      {week.designations.filter((d: any) => d.meeting_date === week.midweek.date && d.designation_type === "Nossa Vida Cristã").map((d: any, i: number) => (
                        <tr key={i} className="item-reuniao">
                          <td className="tempo">{d.notes?.split(" - ")[0] || "-"}</td>
                          <td className="tema">{d.notes?.split(" - ")[1] || d.notes}</td>
                          <td className="designados">{getPubName(d.user_id)}</td>
                        </tr>
                      ))}
                      <tr className="sub-header">
                        <td></td>
                        <td>Dirigente</td>
                        <td className="designados">Leitor</td>
                      </tr>
                      <tr className="item-reuniao">
                        <td className="tempo">30min</td>
                        <td className="tema">Estudo Bíblico de Congregação</td>
                        <td>{getPubName(findDesig(week.designations, week.midweek.date, "Estudo de Livro")?.user_id)}</td>
                        <td className="designados">{getPubName(findDesig(week.designations, week.midweek.date, "Leitura do Livro")?.user_id)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}

              {week.weekend && (
                <>
                  <h2>Reunião de Final de Semana</h2>
                  <div className="info-reuniao">
                    <div><strong>Presidente:</strong> {getPubName(findDesig(week.designations, week.weekend.date, "Presidente")?.user_id)}</div>
                    <div><strong>Oração:</strong> {getPubName(findDesig(week.designations, week.weekend.date, "Oração Inicial")?.user_id)}</div>
                  </div>

                  {week.speeches.find((s: any) => s.date === week.weekend.date) && (
                    <div className="reuniao-fim-semana-item">
                      <div className="tempo">30min</div>
                      <div className="tema">{week.speeches.find((s: any) => s.date === week.weekend.date).title}</div>
                      <div className="designados">
                        {week.speeches.find((s: any) => s.date === week.weekend.date).speaker}, {week.speeches.find((s: any) => s.date === week.weekend.date).congregation}
                      </div>
                    </div>
                  )}

                  <div className="reuniao-fim-semana-item">
                    <div className="tempo">1h15min</div>
                    <div className="tema">Estudo da revista A Sentinela</div>
                    <div className="designados">
                      <div className="leitor-box">Leitor</div><br />
                      {getPubName(findDesig(week.designations, week.weekend.date, "Leitura A Sentinela")?.user_id)}
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}