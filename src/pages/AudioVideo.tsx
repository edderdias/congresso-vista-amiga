import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Monitor, Mic, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AudioVideo() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [formData, setFormData] = useState({
    operator_id: "none",
    video_operator_id: "none",
    mic_1_id: "none",
    mic_2_id: "none",
    stage_id: "none"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pubsResponse, meetingsResponse] = await Promise.all([
        supabase.from("publishers").select("id, full_name, privileges"),
        supabase.from("meetings").select("*, av_designations(*)").order("date", { ascending: false })
      ]);

      if (pubsResponse.data) setPublishers(pubsResponse.data);
      if (meetingsResponse.data) setMeetings(meetingsResponse.data);
    } catch (error) {
      console.error("[AudioVideo] Erro ao carregar dados", error);
    }
  };

  const handleDesignate = (meeting: any) => {
    setSelectedMeeting(meeting);
    const desig = meeting.av_designations?.[0];
    setFormData({
      operator_id: desig?.operator_id || "none",
      video_operator_id: desig?.video_operator_id || "none",
      mic_1_id: desig?.mic_1_id || "none",
      mic_2_id: desig?.mic_2_id || "none",
      stage_id: desig?.stage_id || "none"
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload: any = {
      meeting_id: selectedMeeting.id,
      operator_id: formData.operator_id === "none" ? null : formData.operator_id,
      video_operator_id: formData.video_operator_id === "none" ? null : formData.video_operator_id,
      mic_1_id: formData.mic_1_id === "none" ? null : formData.mic_1_id,
      mic_2_id: formData.mic_2_id === "none" ? null : formData.mic_2_id,
      stage_id: formData.stage_id === "none" ? null : formData.stage_id
    };

    // Usamos onConflict: 'meeting_id' para garantir que ele atualize se já existir
    const { error } = await supabase
      .from("av_designations")
      .upsert(payload, { onConflict: 'meeting_id' });
    
    setLoading(false);
    if (error) {
      toast.error("Erro ao salvar designação: " + error.message);
    } else {
      toast.success("Designação salva com sucesso!");
      setOpen(false);
      loadData();
    }
  };

  const getPubName = (id: string) => {
    if (!id || id === "none") return "-";
    const pub = publishers.find(p => p.id === id);
    return pub ? pub.full_name : "-";
  };

  const avPublishers = publishers.filter(p => p.privileges?.includes("Áudio e Video"));
  const micPublishers = publishers.filter(p => p.privileges?.includes("Microfone Volante"));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Áudio e Vídeo</h1>
        <p className="text-muted-foreground">Gerencie as designações técnicas para as reuniões</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programação de Áudio e Vídeo</CardTitle>
          <CardDescription>Lista de reuniões e seus respectivos operadores</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[180px]">Reunião</TableHead>
                  <TableHead>Operador de Áudio</TableHead>
                  <TableHead>Operador de Vídeo</TableHead>
                  <TableHead>Microfone 1</TableHead>
                  <TableHead>Microfone 2</TableHead>
                  <TableHead>Palco</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma reunião cadastrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  meetings.map(m => {
                    const d = m.av_designations?.[0];
                    return (
                      <TableRow key={m.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{format(parseISO(m.date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            <span className="text-xs text-muted-foreground">{m.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getPubName(d?.operator_id)}</TableCell>
                        <TableCell>{getPubName(d?.video_operator_id)}</TableCell>
                        <TableCell>{getPubName(d?.mic_1_id)}</TableCell>
                        <TableCell>{getPubName(d?.mic_2_id)}</TableCell>
                        <TableCell>{getPubName(d?.stage_id)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleDesignate(m)}>
                            {d ? <Pencil className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                            {d ? "Editar" : "Designar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Designar Áudio e Vídeo</DialogTitle>
              <DialogDescription>
                {selectedMeeting && (
                  <>Reunião de {format(parseISO(selectedMeeting.date), "dd/MM/yyyy")} ({selectedMeeting.type})</>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Operador de Áudio</Label>
                  <Select value={formData.operator_id} onValueChange={v => setFormData({...formData, operator_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {avPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Monitor className="h-4 w-4" /> Operador de Vídeo</Label>
                  <Select value={formData.video_operator_id} onValueChange={v => setFormData({...formData, video_operator_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {avPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mic className="h-4 w-4" /> Microfone 1</Label>
                  <Select value={formData.mic_1_id} onValueChange={v => setFormData({...formData, mic_1_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mic className="h-4 w-4" /> Microfone 2</Label>
                  <Select value={formData.mic_2_id} onValueChange={v => setFormData({...formData, mic_2_id: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2"><User className="h-4 w-4" /> Palco</Label>
                <Select value={formData.stage_id} onValueChange={v => setFormData({...formData, stage_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar Designação"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}