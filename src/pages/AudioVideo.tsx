import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";

export default function AudioVideo() {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
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
    const { data: meetingsData } = await supabase
      .from("meetings")
      .select("*, av_designations(*)")
      .order("date", { ascending: false });
    
    const { data: pubsData } = await supabase.from("publishers").select("id, full_name, privileges");
    
    setMeetings(meetingsData || []);
    setPublishers(pubsData || []);
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
    const payload = {
      meeting_id: selectedMeeting.id,
      operator_id: formData.operator_id === "none" ? null : formData.operator_id,
      video_operator_id: formData.video_operator_id === "none" ? null : formData.video_operator_id,
      mic_1_id: formData.mic_1_id === "none" ? null : formData.mic_1_id,
      mic_2_id: formData.mic_2_id === "none" ? null : formData.mic_2_id,
      stage_id: formData.stage_id === "none" ? null : formData.stage_id
    };

    const { error } = await supabase.from("av_designations").upsert(payload, { onConflict: 'meeting_id' });
    
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Designação salva!");
      setOpen(false);
      loadData();
    }
  };

  const getPubName = (id: string) => publishers.find(p => p.id === id)?.full_name || "-";

  // Filtros de publicadores por designação
  const avPublishers = publishers.filter(p => p.privileges?.includes("Áudio e Video"));
  const micPublishers = publishers.filter(p => p.privileges?.includes("Microfone Volante"));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Áudio e Vídeo</h1>
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reunião</TableHead>
                <TableHead>Operador de Áudio</TableHead>
                <TableHead>Operador de Vídeo</TableHead>
                <TableHead>Microfone 1</TableHead>
                <TableHead>Microfone 2</TableHead>
                <TableHead>Palco</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meetings.map(m => {
                const d = m.av_designations?.[0];
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {format(parseISO(m.date), "dd/MM")} - {m.type}
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
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Designar Áudio e Vídeo</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Operador de Áudio</Label>
                <Select value={formData.operator_id} onValueChange={v => setFormData({...formData, operator_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {avPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Operador de Vídeo</Label>
                <Select value={formData.video_operator_id} onValueChange={v => setFormData({...formData, video_operator_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {avPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Microfone 1</Label>
                <Select value={formData.mic_1_id} onValueChange={v => setFormData({...formData, mic_1_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Microfone 2</Label>
                <Select value={formData.mic_2_id} onValueChange={v => setFormData({...formData, mic_2_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Palco</Label>
                <Select value={formData.stage_id} onValueChange={v => setFormData({...formData, stage_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {micPublishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}