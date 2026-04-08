import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";

export default function MeetingPrint() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<any>(null);
  const [av, setAv] = useState<any>(null);
  const [designations, setDesignations] = useState<any[]>([]);
  const [school, setSchool] = useState<any[]>([]);
  const [speech, setSpeech] = useState<any>(null);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: meet } = await supabase.from("meetings").select("*").eq("id", id).single();
      if (!meet) return;
      setMeeting(meet);

      const [pubs, avDesig, theocratic, schoolDesig, speechData] = await Promise.all([
        supabase.from("publishers").select("id, full_name"),
        supabase.from("av_designations").select("*").eq("meeting_id", id).maybeSingle(),
        supabase.from("designations").select("*").eq("meeting_date", meet.date),
        supabase.from("school_assignments").select("*").eq("meeting_date", meet.date),
        supabase.from("speeches").select("*").eq("date", meet.date).maybeSingle()
      ]);

      setPublishers(pubs.data || []);
      setAv(avDesig.data);
      setDesignations(theocratic.data || []);
      setSchool(schoolDesig.data || []);
      setSpeech(speechData.data);
    } catch (error) {
      console.error("Erro ao carregar dados para impressão:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPubName = (id: string) => publishers.find(p => p.id === id)?.full_name || "-";
  const findDesig = (type: string) => designations.find(d => d.designation_type === type);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (!meeting) return <div className="p-8 text-center">Reunião não encontrada.</div>;

  const isMidweek = meeting.type === "Meio de Semana" || meeting.type.includes("Viajante (Meio de Semana)");

  return (
    <div className="min-h-screen bg-white p-4 md:p-8 print:p-0">
      <div className="max-w-4xl mx-auto space-y-8 print:space-y-4">
        <div className="flex justify-between items-center print:hidden">
          <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Button>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
        </div>

        <div className="border-2 border-black p-6 space-y-6">
          <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-2xl font-bold uppercase">Programação da Reunião</h1>
            <p className="text-lg font-semibold">{format(parseISO(meeting.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
            <p className="text-md italic">{meeting.type}</p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="font-bold border-b border-black uppercase text-sm">Áudio e Vídeo</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="font-medium">Áudio:</span> <span>{getPubName(av?.operator_id)}</span>
                <span className="font-medium">Vídeo:</span> <span>{getPubName(av?.video_operator_id)}</span>
                <span className="font-medium">Mic 1:</span> <span>{getPubName(av?.mic_1_id)}</span>
                <span className="font-medium">Mic 2:</span> <span>{getPubName(av?.mic_2_id)}</span>
                <span className="font-medium">Palco:</span> <span>{getPubName(av?.stage_id)}</span>
                <span className="font-medium">Indicador:</span> <span>{getPubName(av?.external_indicator_id)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-bold border-b border-black uppercase text-sm">Designações Gerais</h2>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Presidente:</span> <span>{getPubName(findDesig("Presidente")?.user_id)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Oração Inicial:</span> <span>{getPubName(findDesig("Oração Inicial")?.user_id)}</span>
                </div>
                {!isMidweek && (
                  <div className="flex justify-between">
                    <span className="font-medium">Leitor Sentinela:</span> <span>{getPubName(findDesig("Leitura A Sentinela")?.user_id)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Oração Final:</span> <span>{getPubName(findDesig("Oração Final")?.user_id)}</span>
                </div>
              </div>
            </div>
          </div>

          {isMidweek ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="font-bold border-b border-black uppercase text-sm">Tesouros da Palavra de Deus</h2>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Tesouro:</span> <span>{getPubName(findDesig("Tesouro")?.user_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Joias Espirituais:</span> <span>{getPubName(findDesig("Joias Espirituais")?.user_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Leitura da Bíblia:</span> <span>{getPubName(school.find(s => s.part_type === "Leitura da Bíblia")?.student_id)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-bold border-b border-black uppercase text-sm">Faça seu melhor no ministério</h2>
                <div className="grid grid-cols-1 gap-3 text-sm">
                  {school.filter(s => s.part_type !== "Leitura da Bíblia").map((s, i) => (
                    <div key={i} className="flex justify-between border-b border-dotted border-gray-400 pb-1">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{s.part_type}</span>
                        <span className="text-xs italic">Ajudante: {getPubName(s.assistant_id)}</span>
                      </div>
                      <span className="font-bold">{getPubName(s.student_id)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-bold border-b border-black uppercase text-sm">Nossa Vida Cristã</h2>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  {designations.filter(d => d.designation_type === "Nossa Vida Cristã").map((d, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="font-medium">{d.notes}:</span> <span>{getPubName(d.user_id)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="font-medium">Estudo de Livro:</span> <span>{getPubName(findDesig("Estudo de Livro")?.user_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Leitura do Livro:</span> <span>{getPubName(findDesig("Leitura do Livro")?.user_id)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="font-bold border-b border-black uppercase text-sm">Discurso Público</h2>
              <div className="p-4 bg-gray-50 border border-black">
                <p className="font-bold text-lg">{speech?.title || "Tema não definido"}</p>
                <p className="text-md">Orador: <span className="font-bold">{speech?.speaker || "-"}</span></p>
                <p className="text-sm italic">Congregação: {speech?.congregation || "-"}</p>
              </div>
            </div>
          )}

          <div className="text-center pt-8 text-[10px] text-gray-500">
            Gerado em {format(new Date(), "dd/MM/yyyy HH:mm")}
          </div>
        </div>
      </div>
    </div>
  );
}