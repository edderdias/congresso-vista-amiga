import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Filter, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SECTIONS = {
  reuniao: [
    "Presidência Vida e Ministério", "Oração", "Tesouro", "Parte de Estudante", 
    "Encontre Joias", "Nossa Vida Cristã", "Necessidade Locais", 
    "Dirigente Est. de Livro", "Leitura do Livro", "Presidência Final de Semana", "Leitura A Sentinela"
  ],
  mecanicas: ["Indicador", "Microfone Volante", "Áudio e Vídeo"],
  pregacao: ["Limpeza", "Manutenção", "TPL"]
};

const PRIVILEGES = ["Ancião", "Servo Ministérial", "Pioneiro Regular", "Pioneiro Auxiliar", "Publicador Batizado", "Publicador não Batizado"];

export default function Publishers() {
  const [publishers, setPublishers] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    full_name: "", phone: "", birth_date: "", baptism_date: "", gender: "" as any,
    privileges: [] as string[], hope: "" as any, status: "active" as any, group_id: "none"
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const { data: groupsData } = await supabase.from("groups").select("*").order("group_number");
    const { data: pubsData } = await supabase.from("publishers").select("*").order("full_name");
    setGroups(groupsData || []);
    setPublishers(pubsData?.map(p => ({...p, group_number: groupsData?.find(g => g.id === p.group_id)?.group_number})) || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, group_id: formData.group_id === "none" ? null : formData.group_id };
    const { error } = editingId 
      ? await supabase.from("publishers").update(payload).eq("id", editingId)
      : await supabase.from("publishers").insert([payload]);

    if (error) toast.error("Erro ao salvar");
    else { toast.success("Salvo!"); setOpen(false); loadData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("publishers").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Publicador excluído"); loadData(); }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await supabase.from("publishers").update({ status }).eq("id", id);
    toast.success("Status atualizado");
    loadData();
  };

  const togglePriv = (p: string) => {
    setFormData(prev => ({
      ...prev,
      privileges: prev.privileges.includes(p) ? prev.privileges.filter(x => x !== p) : [...prev.privileges, p]
    }));
  };

  const filtered = publishers.filter(p => p.full_name.toLowerCase().includes(searchTerm.toLowerCase()));
  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Publicadores</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={() => setEditingId(null)}><Plus className="h-4 w-4 mr-2" /> Novo</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <DialogHeader><DialogTitle>Dados do Publicador</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Ex: 11999999999" /></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={formData.group_id} onValueChange={v => setFormData({...formData, group_id: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="mudou">Mudou</SelectItem>
                      <SelectItem value="removido">Removido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="font-bold text-primary">Privilégios</Label>
                <div className="grid grid-cols-3 gap-2 border p-3 rounded bg-slate-50">
                  {PRIVILEGES.map(p => (
                    <div key={p} className="flex items-center space-x-2">
                      <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePriv(p)} />
                      <Label htmlFor={p} className="text-xs cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="font-bold text-primary">Designações - Reunião</Label>
                <div className="grid grid-cols-3 gap-2 border p-3 rounded bg-slate-50">
                  {SECTIONS.reuniao.map(p => (
                    <div key={p} className="flex items-center space-x-2">
                      <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePriv(p)} />
                      <Label htmlFor={p} className="text-xs cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <Label className="font-bold text-primary">Atividades Mecânicas</Label>
                  <div className="space-y-2 border p-3 rounded bg-slate-50">
                    {SECTIONS.mecanicas.map(p => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePriv(p)} />
                        <Label htmlFor={p} className="text-xs cursor-pointer">{p}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="font-bold text-primary">Pregação e Extras</Label>
                  <div className="space-y-2 border p-3 rounded bg-slate-50">
                    {SECTIONS.pregacao.map(p => (
                      <div key={p} className="flex items-center space-x-2">
                        <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePriv(p)} />
                        <Label htmlFor={p} className="text-xs cursor-pointer">{p}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4"><Input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.full_name}</TableCell>
                  <TableCell>
                    {p.phone ? (
                      <a href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:underline font-medium">
                        {p.phone}
                      </a>
                    ) : "-"}
                  </TableCell>
                  <TableCell>{p.group_number ? `Grupo ${p.group_number}` : "-"}</TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Mudou"><MapPin className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar Mudança?</AlertDialogTitle><AlertDialogDescription>Deseja marcar {p.full_name} como 'Mudou'?</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleStatusChange(p.id, 'mudou')}>Sim</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setFormData({...p, group_id: p.group_id || "none"}); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Excluir Publicador?</AlertDialogTitle></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>Sim</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filtered.length/10)} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </div>
  );
}