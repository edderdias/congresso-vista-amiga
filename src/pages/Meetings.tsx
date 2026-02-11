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
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Meeting {
  id: string;
  date: string;
  type: string;
}

export default function Meetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ date: "", type: "Meio de Semana" });

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    const { data } = await supabase.from("meetings").select("*").order("date", { ascending: false });
    setMeetings(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let error;
    if (editingId) {
      const { error: err } = await supabase.from("meetings").update(formData).eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from("meetings").insert([formData]);
      error = err;
    }

    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Reunião salva!");
      setOpen(false);
      loadMeetings();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("meetings").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Reunião excluída");
      loadMeetings();
    }
  };

  const handleEdit = (m: Meeting) => {
    setEditingId(m.id);
    setFormData({ date: m.date, type: m.type });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Reuniões</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditingId(null); }}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto" onClick={() => setFormData({ date: "", type: "Meio de Semana" })}>
              <Plus className="h-4 w-4 mr-2" /> Nova Reunião
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar" : "Adicionar"} Reunião</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Meio de Semana">Meio de Semana</SelectItem>
                      <SelectItem value="Final de Semana">Final de Semana</SelectItem>
                      <SelectItem value="Visita do Viajante (Meio de Semana)">Visita do Viajante (Meio de Semana)</SelectItem>
                      <SelectItem value="Visita do Viajante (Final de Semana)">Visita do Viajante (Final de Semana)</SelectItem>
                      <SelectItem value="Celebração">Celebração</SelectItem>
                      <SelectItem value="Especial">Especial</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {meetings.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">{format(parseISO(m.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell className="whitespace-nowrap">{m.type}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Reunião?</AlertDialogTitle>
                            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
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