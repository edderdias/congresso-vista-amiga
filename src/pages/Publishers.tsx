"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MapPin, Search, Users, Star, Clock, UserMinus, FileText, MessageCircle } from "lucide-react";
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
import { differenceInYears, parseISO, isValid } from "date-fns";

const SECTIONS = {
  privileges: ["Ancião", "Servo Ministerial", "Pioneiro Regular", "Pioneiro Auxiliar", "Publicador Batizado", "Publicador não Batizado"],
  reuniao: [
    "Presidência Vida e Ministério", "Oração", "Tesouro", "Parte de Estudante", 
    "Encontre Joias", "Nossa Vida Cristã", "Necessidade Locais", 
    "Dirigente Est. de Livro", "Leitura do Livro", "Presidência Final de Semana", "Leitura A Sentinela"
  ],
  mecanicas: ["Indicador", "Microfone Volante", "Áudio e Vídeo"],
  pregacao: ["Limpeza", "Manutenção", "TPL"]
};

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

  const handleStatusMudou = async (id: string) => {
    const { error } = await supabase
      .from("publishers")
      .update({ status: 'mudou' })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado para 'Mudou'");
      loadData();
    }
  };

  const filtered = publishers.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || p.group_id === filterGroup;
    const matchesStatus = filterStatus === "default" ? (p.status === "active" || p.status === "repreendido") : (filterStatus === "all" || p.status === filterStatus);
    const matchesPrivilege = filterPrivilege === "all" || p.privileges?.includes(filterPrivilege);
    return matchesSearch && matchesGroup && matchesStatus && matchesPrivilege;
  });

  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  const stats = {
    total: publishers.filter(p => p.status !== 'mudou').length,
    regPioneers: publishers.filter(p => p.privileges?.includes("Pioneiro Regular") && p.status !== 'mudou').length,
    auxPioneers: publishers.filter(p => p.privileges?.includes("Pioneiro Auxiliar") && p.status !== 'mudou').length,
    inactive: publishers.filter(p => p.status === 'inactive').length
  };

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    return differenceInYears(new Date(), date);
  };

  const togglePrivilege = (p: string) => {
    setFormData(prev => ({
      ...prev,
      privileges: prev.privileges.includes(p) 
        ? prev.privileges.filter(x => x !== p) 
        : [...prev.privileges, p]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Publicadores</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de todos os membros</p>
        </div>
        <Button onClick={() => { setEditingId(null); setFormData({full_name: "", phone: "", birth_date: "", baptism_date: "", gender: "", privileges: [], hope: "", status: "active", group_id: "none"}); setOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> Novo Publicador
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-blue-600 rounded-lg text-white"><Users size={20} /></div>
            <div>
              <p className="text-xs text-blue-600 font-bold uppercase">Publicadores</p>
              <p className="text-2xl font-black text-blue-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-amber-500 rounded-lg text-white"><Star size={20} /></div>
            <div>
              <p className="text-xs text-amber-600 font-bold uppercase">Pion. Regulares</p>
              <p className="text-2xl font-black text-amber-900">{stats.regPioneers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-green-500 rounded-lg text-white"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-green-600 font-bold uppercase">Pion. Auxiliares</p>
              <p className="text-2xl font-black text-green-900">{stats.auxPioneers}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardContent className="pt-4 flex items-center gap-4">
            <div className="p-2 bg-red-500 rounded-lg text-white"><UserMinus size={20} /></div>
            <div>
              <p className="text-xs text-red-600 font-bold uppercase">Inativos</p>
              <p className="text-2xl font-black text-red-900">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar por nome..." className="pl-9" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue placeholder="Todos os Grupos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Grupos</SelectItem>
                {groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="Padrão (Ativos/Repreendidos)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Padrão (Ativos/Repreendidos)</SelectItem>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
                <SelectItem value="mudou">Repreendido</SelectItem>
                <SelectItem value="mudou">Mudou</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrivilege} onValueChange={setFilterPrivilege}>
              <SelectTrigger><SelectValue placeholder="Todos os Privilégios" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Privilégios</SelectItem>
                {SECTIONS.privileges.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>WhatsApp</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Privilégios</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map(p => {
                const mainPrivileges = p.privileges?.filter((priv: string) => SECTIONS.privileges.includes(priv)) || [];
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-bold">{p.full_name}</TableCell>
                    <TableCell className="text-green-600 font-medium">{p.phone || "-"}</TableCell>
                    <TableCell>{p.group_number ? `Grupo ${p.group_number}` : "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mainPrivileges.slice(0, 2).map((priv: string) => (
                          <Badge key={priv} variant="secondary" className="text-[10px] bg-green-100 text-green-800 border-green-200">{priv}</Badge>
                        ))}
                        {mainPrivileges.length > 2 && <Badge variant="outline" className="text-[10px]">+{mainPrivileges.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        "text-[10px] font-bold",
                        p.status === 'active' ? "bg-green-500" : p.status === 'inactive' ? "bg-red-500" : "bg-slate-500"
                      )}>
                        {p.status === 'active' ? 'Ativo' : p.status === 'inactive' ? 'Inativo' : p.status === 'repreendido' ? 'Repreendido' : 'Mudou'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Mudou-se">
                              <MapPin className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar mudança?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Deseja marcar {p.full_name} como "Mudou"? Ele deixará de aparecer na lista padrão e nas estatísticas ativas.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleStatusMudou(p.id)} className="bg-blue-600">
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button variant="ghost" size="icon" title="Cartão S-21" onClick={() => handleViewCard(p)}>
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setFormData({
                          full_name: p.full_name, phone: p.phone || "", birth_date: p.birth_date || "", baptism_date: p.baptism_date || "",
                          gender: p.gender || "", privileges: p.privileges || [], hope: p.hope || "", status: p.status || "active", group_id: p.group_id || "none"
                        }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-red-600">Sim</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filtered.length/10)} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <PublisherCard publisher={selectedPubForCard} reports={pubReports} open={cardOpen} onOpenChange={setCardOpen} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-8 py-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-blue-900">{editingId ? "Editar" : "Novo"} Publicador</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-blue-900 font-bold">Nome</Label>
                <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required className="border-blue-100 focus:border-blue-300" />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-bold">Telefone</Label>
                <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="border-blue-100 focus:border-blue-300" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Data de Nascimento</Label>
                  <Input type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} className="border-blue-100" />
                </div>
                <div className="pb-2 text-sm text-muted-foreground">
                  {calculateAge(formData.birth_date)} anos
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-blue-900 font-bold">Data de Batismo</Label>
                  <Input type="date" value={formData.baptism_date} onChange={e => setFormData({...formData, baptism_date: e.target.value})} className="border-blue-100" />
                </div>
                <div className="pb-2 text-sm text-muted-foreground">
                  {calculateAge(formData.baptism_date)} anos de batismo
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-blue-900 font-bold">Sexo</Label>
                <RadioGroup value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="M" id="m" className="text-blue-600 border-blue-200" />
                    <Label htmlFor="m" className="cursor-pointer">Masculino</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="F" id="f" className="text-blue-600 border-blue-200" />
                    <Label htmlFor="f" className="cursor-pointer">Feminino</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <Label className="text-blue-900 font-bold">Esperança</Label>
                <RadioGroup value={formData.hope} onValueChange={v => setFormData({...formData, hope: v})} className="flex gap-6">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="anointed" id="a" className="text-blue-600 border-blue-200" />
                    <Label htmlFor="a" className="cursor-pointer">Ungido</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="other_sheep" id="o" className="text-blue-600 border-blue-200" />
                    <Label htmlFor="o" className="cursor-pointer">Outras Ovelhas</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-blue-900 font-bold">Grupo</Label>
                <Select value={formData.group_id} onValueChange={v => setFormData({...formData, group_id: v})}>
                  <SelectTrigger className="border-blue-100"><SelectValue placeholder="Selecione o grupo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-900 font-bold">Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                  <SelectTrigger className="border-blue-100"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="repreendido">Repreendido</SelectItem>
                    <SelectItem value="mudou">Mudou</SelectItem>
                    <SelectItem value="removido">Removido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-blue-600 border-b-2 border-blue-100 pb-2 mb-4">Privilégios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SECTIONS.privileges.map(p => (
                  <div key={p} className="flex items-center space-x-3">
                    <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePrivilege(p)} className="border-blue-200 data-[state=checked]:bg-blue-500" />
                    <Label htmlFor={p} className="text-sm cursor-pointer">{p}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-blue-600 border-b-2 border-blue-100 pb-2 mb-4">Designações - Reunião</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SECTIONS.reuniao.map(p => (
                  <div key={p} className="flex items-center space-x-3">
                    <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePrivilege(p)} className="border-blue-200 data-[state=checked]:bg-blue-500" />
                    <Label htmlFor={p} className="text-sm cursor-pointer">{p}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-600 border-b-2 border-blue-100 pb-2 mb-4">Atividades Mecânicas</h3>
                <div className="space-y-4">
                  {SECTIONS.mecanicas.map(p => (
                    <div key={p} className="flex items-center space-x-3">
                      <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePrivilege(p)} className="border-blue-200 data-[state=checked]:bg-blue-500" />
                      <Label htmlFor={p} className="text-sm cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-blue-600 border-b-2 border-blue-100 pb-2 mb-4">Pregação e Extras</h3>
                <div className="space-y-4">
                  {SECTIONS.pregacao.map(p => (
                    <div key={p} className="flex items-center space-x-3">
                      <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePrivilege(p)} className="border-blue-200 data-[state=checked]:bg-blue-500" />
                      <Label htmlFor={p} className="text-sm cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 border-t">
              <Button type="submit" className="w-full md:w-auto bg-blue-600 hover:bg-blue-700">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}