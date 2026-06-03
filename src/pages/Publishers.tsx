"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MapPin, Search, Filter, Users, Star, Clock, UserMinus, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { PublisherCard } from "@/components/PublisherCard";

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
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("default");
  const [filterPrivilege, setFilterPrivilege] = useState("all");

  // Card State
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedPubForCard, setSelectedPubForCard] = useState<any>(null);
  const [pubReports, setPubReports] = useState<any[]>([]);

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

  const handleViewCard = async (pub: any) => {
    setSelectedPubForCard(pub);
    const { data } = await supabase
      .from("preaching_reports")
      .select("*")
      .eq("publisher_id", pub.id)
      .order("year", { ascending: false })
      .order("month", { ascending: false });
    
    setPubReports(data || []);
    setCardOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      full_name: formData.full_name,
      phone: formData.phone || null,
      birth_date: formData.birth_date || null,
      baptism_date: formData.baptism_date || null,
      gender: formData.gender || null,
      hope: formData.hope || null,
      privileges: formData.privileges || [],
      status: formData.status,
      group_id: formData.group_id === "none" ? null : formData.group_id
    };

    const { error } = editingId 
      ? await supabase.from("publishers").update(payload).eq("id", editingId)
      : await supabase.from("publishers").insert([payload]);

    if (error) toast.error("Erro ao salvar");
    else { toast.success("Salvo!"); setOpen(false); loadData(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("publishers").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); loadData(); }
  };

  const filtered = publishers.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || p.group_id === filterGroup;
    const matchesStatus = filterStatus === "default" ? (p.status === "active" || p.status === "repreendido") : (filterStatus === "all" || p.status === filterStatus);
    const matchesPrivilege = filterPrivilege === "all" || p.privileges?.includes(filterPrivilege);
    return matchesSearch && matchesGroup && matchesStatus && matchesPrivilege;
  });

  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Publicadores</h1>
        <Button onClick={() => { setEditingId(null); setFormData({full_name: "", phone: "", birth_date: "", baptism_date: "", gender: "", privileges: [], hope: "", status: "active", group_id: "none"}); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo Publicador</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Grupos</SelectItem>
                {groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Ativos/Repreendidos</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrivilege} onValueChange={setFilterPrivilege}>
              <SelectTrigger><SelectValue placeholder="Privilégio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Privilégios</SelectItem>
                {PRIVILEGES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Privilégios</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-bold">{p.full_name}</TableCell>
                  <TableCell>{p.group_number ? `Grupo ${p.group_number}` : "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.privileges?.slice(0, 2).map((priv: string) => (
                        <Badge key={priv} variant="secondary" className="text-[10px]">{priv}</Badge>
                      ))}
                      {p.privileges?.length > 2 && <Badge variant="outline" className="text-[10px]">+{p.privileges.length - 2}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" title="Cartão S-21" onClick={() => handleViewCard(p)}>
                        <FileText className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setFormData({
                        full_name: p.full_name, phone: p.phone || "", birth_date: p.birth_date || "", baptism_date: p.baptism_date || "",
                        gender: p.gender || "", privileges: p.privileges || [], hope: p.hope || "", status: p.status || "active", group_id: p.group_id || "none"
                      }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>Sim</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filtered.length/10)} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <PublisherCard publisher={selectedPubForCard} reports={pubReports} open={cardOpen} onOpenChange={setCardOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Novo"} Publicador</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome</Label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div className="space-y-2"><Label>Nascimento</Label><Input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} /></div>
              <div className="space-y-2"><Label>Batismo</Label><Input type="date" value={formData.baptism_date} onChange={e => setFormData({...formData, baptism_date: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sexo</Label>
                <RadioGroup value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="M" id="m" /><Label htmlFor="m">M</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="F" id="f" /><Label htmlFor="f">F</Label></div>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label>Esperança</Label>
                <RadioGroup value={formData.hope} onValueChange={v => setFormData({...formData, hope: v})} className="flex gap-4">
                  <div className="flex items-center space-x-2"><RadioGroupItem value="anointed" id="a" /><Label htmlFor="a">Ungido</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="other_sheep" id="o" /><Label htmlFor="o">Outras Ovelhas</Label></div>
                </RadioGroup>
              </div>
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
                    <SelectItem value="repreendido">Repreendido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Privilégios</Label>
              <div className="grid grid-cols-3 gap-2 border p-3 rounded bg-slate-50">
                {PRIVILEGES.map(p => (
                  <div key={p} className="flex items-center space-x-2">
                    <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={(v) => setFormData({...formData, privileges: v ? [...formData.privileges, p] : formData.privileges.filter(x => x !== p)})} />
                    <Label htmlFor={p} className="text-xs">{p}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}