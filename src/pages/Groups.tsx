import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Groups() {
  const [groups, setGroups] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    group_number: 1,
    overseer_id: "none",
    assistant_id: "none",
    meeting_time: "",
    meeting_location: ""
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: groupsData } = await supabase.from("groups").select("*").order("group_number");
    const { data: pubsData } = await supabase.from("publishers").select("id, full_name, privileges, group_id");
    
    setPublishers(pubsData || []);
    setGroups(groupsData?.map(g => ({
      ...g,
      overseer_name: pubsData?.find(p => p.id === g.overseer_id)?.full_name || "-",
      assistant_name: pubsData?.find(p => p.id === g.assistant_id)?.full_name || "-",
      count: pubsData?.filter(p => p.group_id === g.id).length || 0
    })) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      group_number: formData.group_number,
      overseer_id: formData.overseer_id === "none" ? null : formData.overseer_id,
      assistant_id: formData.assistant_id === "none" ? null : formData.assistant_id,
      field_service_meeting: `${formData.meeting_time} - ${formData.meeting_location}`
    };

    const { error } = editingId 
      ? await supabase.from("groups").update(payload).eq("id", editingId)
      : await supabase.from("groups").insert([payload]);

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Grupo salvo!");
      setOpen(false);
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Grupo excluído");
      loadData();
    }
  };

  const eligible = publishers.filter(p => p.privileges?.some((pr: string) => pr === "Ancião" || pr === "Servo Ministérial"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Grupos</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => { setEditingId(null); setFormData({group_number: 1, overseer_id: "none", assistant_id: "none", meeting_time: "", meeting_location: ""}); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader><DialogTitle>Configurar Grupo</DialogTitle></DialogHeader>
              <div className="space-y-2">
                <Label>Número do Grupo</Label>
                <Input type="number" value={formData.group_number} onChange={e => setFormData({...formData, group_number: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Superintendente</Label>
                <Select value={formData.overseer_id} onValueChange={v => setFormData({...formData, overseer_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {eligible.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ajudante</Label>
                <Select value={formData.assistant_id} onValueChange={v => setFormData({...formData, assistant_id: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {eligible.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Horário da Saída</Label>
                  <Input type="time" value={formData.meeting_time} onChange={e => setFormData({...formData, meeting_time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Local da Saída</Label>
                  <Input placeholder="Ex: Salão do Reino" value={formData.meeting_location} onChange={e => setFormData({...formData, meeting_location: e.target.value})} />
                </div>
              </div>
              <DialogFooter><Button type="submit" className="w-full sm:w-auto">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Superintendente</TableHead>
                  <TableHead>Ajudante</TableHead>
                  <TableHead>Saída de Campo</TableHead>
                  <TableHead>Publicadores</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map(g => (
                  <TableRow key={g.id}>
                    <TableCell className="font-bold whitespace-nowrap">{g.group_number}</TableCell>
                    <TableCell className="whitespace-nowrap">{g.overseer_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{g.assistant_name}</TableCell>
                    <TableCell className="whitespace-nowrap">{g.field_service_meeting || "-"}</TableCell>
                    <TableCell>{g.count}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingId(g.id); setFormData({group_number: g.group_number, overseer_id: g.overseer_id || "none", assistant_id: g.assistant_id || "none", meeting_time: g.field_service_meeting?.split(" - ")[0] || "", meeting_location: g.field_service_meeting?.split(" - ")[1] || ""}); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir Grupo?</AlertDialogTitle><AlertDialogDescription>Deseja realmente excluir o grupo {g.group_number}?</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Não</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(g.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}