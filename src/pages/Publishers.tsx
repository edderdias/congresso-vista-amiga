import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, MapPin, Search, Filter, Users, Star, Clock, UserMinus } from "lucide-react";
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

const calculateYears = (dateString: string | null) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - date.getFullYear();
  const m = now.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < date.getDate())) {
    years--;
  }
  return years >= 0 ? years : 0;
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

  const [formData, setFormData] = useState({
    full_name: "", phone: "", birth_date: "", baptism_date: "", gender: "" as any,
    privileges: [] as string[], hope: "" as any, status: "active" as any, group_id: "none",
    is_indicator: false
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
    
    const payload = { 
      full_name: formData.full_name,
      phone: formData.phone || null,
      birth_date: formData.birth_date || null,
      baptism_date: formData.baptism_date || null,
      gender: formData.gender || null,
      hope: formData.hope || null,
      privileges: formData.privileges || [],
      status: formData.status,
      group_id: formData.group_id === "none" ? null : formData.group_id,
      is_indicator: formData.is_indicator
    };

    const { error } = editingId 
      ? await supabase.from("publishers").update(payload).eq("id", editingId)
      : await supabase.from("publishers").insert([payload]);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Salvo com sucesso!");
      setOpen(false);
      loadData();
    }
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

  const filtered = publishers.filter(p => {
    const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || p.group_id === filterGroup;
    
    let matchesStatus = true;
    if (filterStatus === "default") {
      matchesStatus = p.status === "active" || p.status === "repreendido";
    } else if (filterStatus !== "all") {
      matchesStatus = p.status === filterStatus;
    }

    const matchesPrivilege = filterPrivilege === "all" || p.privileges?.includes(filterPrivilege);
    return matchesSearch && matchesGroup && matchesStatus && matchesPrivilege;
  });

  const paginated = filtered.slice((currentPage - 1) * 10, currentPage * 10);

  const stats = {
    total: publishers.filter(p => p.status === 'active' || p.status === 'repreendido').length,
    regular: publishers.filter(p => p.privileges?.includes("Pioneiro Regular")).length,
    auxiliary: publishers.filter(p => p.privileges?.includes("Pioneiro Auxiliar")).length,
    inactive: publishers.filter(p => p.status === 'inactive').length
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = {
      active: "bg-green-500 hover:bg-green-600",
      inactive: "bg-yellow-500 hover:bg-yellow-600",
      removido: "bg-red-500 hover:bg-red-600",
      repreendido: "bg-blue-500 hover:bg-blue-600",
      mudou: "bg-gray-500 hover:bg-gray-600",
    };
    const labels: Record<string, string> = {
      active: "Ativo",
      inactive: "Inativo",
      removido: "Removido",
      repreendido: "Repreendido",
      mudou: "Mudou",
    };
    return (
      <Badge className={cn("text-white border-none", configs[status] || "bg-slate-500")}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Publicadores</h1>
          <p className="text-muted-foreground">Gerencie o cadastro de todos os membros</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="w-full sm:w-auto" onClick={() => { setEditingId(null); setFormData({full_name: "", phone: "", birth_date: "", baptism_date: "", gender: "", privileges: [], hope: "", status: "active", group_id: "none", is_indicator: false}); }}><Plus className="h-4 w-4 mr-2" /> Novo Publicador</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              <DialogHeader><DialogTitle>{editingId ? "Editar Publicador" : "Novo Publicador"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome</Label><Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Telefone</Label><Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="Ex: 11999999999" /></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={formData.birth_date || ""} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                    {formData.birth_date && (
                      <Badge variant="outline" className="whitespace-nowrap bg-slate-50">
                        {calculateYears(formData.birth_date)} anos
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Data de Batismo</Label>
                  <div className="flex items-center gap-2">
                    <Input type="date" value={formData.baptism_date || ""} onChange={e => setFormData({...formData, baptism_date: e.target.value})} />
                    {formData.baptism_date && (
                      <Badge variant="outline" className="whitespace-nowrap bg-slate-50">
                        {calculateYears(formData.baptism_date)} anos de batismo
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <RadioGroup value={formData.gender} onValueChange={v => setFormData({...formData, gender: v})} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="M" id="male" />
                      <Label htmlFor="male" className="font-normal cursor-pointer">Masculino</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="F" id="female" />
                      <Label htmlFor="female" className="font-normal cursor-pointer">Feminino</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>Esperança</Label>
                  <RadioGroup value={formData.hope} onValueChange={v => setFormData({...formData, hope: v})} className="flex gap-4 pt-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anointed" id="anointed" />
                      <Label htmlFor="anointed" className="font-normal cursor-pointer">Ungido</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other_sheep" id="other_sheep" />
                      <Label htmlFor="other_sheep" className="font-normal cursor-pointer">Outras Ovelhas</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      <SelectItem value="mudou">Mudou</SelectItem>
                      <SelectItem value="removido">Removido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded border border-blue-100">
                <Checkbox id="is_indicator" checked={formData.is_indicator} onCheckedChange={(v) => setFormData({...formData, is_indicator: !!v})} />
                <Label htmlFor="is_indicator" className="font-bold text-blue-800 cursor-pointer">Pode ser Indicador?</Label>
              </div>
              
              <div className="space-y-4">
                <Label className="font-bold text-primary">Privilégios</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-3 rounded bg-slate-50">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border p-3 rounded bg-slate-50">
                  {SECTIONS.reuniao.map(p => (
                    <div key={p} className="flex items-center space-x-2">
                      <Checkbox id={p} checked={formData.privileges.includes(p)} onCheckedChange={() => togglePriv(p)} />
                      <Label htmlFor={p} className="text-xs cursor-pointer">{p}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter><Button type="submit" className="w-full sm:w-auto">Salvar</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg text-white"><Users size={20} /></div>
            <div>
              <p className="text-xs text-blue-600 font-medium">Publicadores</p>
              <p className="text-xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500 rounded-lg text-white"><Star size={20} /></div>
            <div>
              <p className="text-xs text-amber-600 font-medium">Pion. Regulares</p>
              <p className="text-xl font-bold text-amber-900">{stats.regular}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg text-white"><Clock size={20} /></div>
            <div>
              <p className="text-xs text-green-600 font-medium">Pion. Auxiliares</p>
              <p className="text-xl font-bold text-green-900">{stats.auxiliary}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg text-white"><UserMinus size={20} /></div>
            <div>
              <p className="text-xs text-red-600 font-medium">Inativos</p>
              <p className="text-xl font-bold text-red-900">{stats.inactive}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por nome..." 
                className="pl-9"
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filterGroup} onValueChange={setFilterGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Grupos</SelectItem>
                  {groups.map(g => (
                    <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão (Ativos/Repreendidos)</SelectItem>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="repreendido">Repreendido</SelectItem>
                  <SelectItem value="mudou">Mudou</SelectItem>
                  <SelectItem value="removido">Removido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={filterPrivilege} onValueChange={setFilterPrivilege}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por Privilégio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Privilégios</SelectItem>
                  {PRIVILEGES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum publicador encontrado com esses filtros.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-bold whitespace-nowrap">{p.full_name}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {p.phone ? (
                          <a href={`https://wa.me/55${p.phone.replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:underline font-medium">
                            {p.phone}
                          </a>
                        ) : "-"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{p.group_number ? `Grupo ${p.group_number}` : "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {p.privileges?.filter((priv: string) => PRIVILEGES.includes(priv)).map((priv: string) => (
                            <Badge key={priv} variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              {priv}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(p.status)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" title="Mudou"><MapPin className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Confirmar Mudança?</AlertDialogTitle><AlertDialogDescription>Deseja marcar {p.full_name} como 'Mudou'?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleStatusChange(p.id, 'mudou')}>Sim</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <Button variant="ghost" size="icon" onClick={() => { setEditingId(p.id); setFormData({
                          full_name: p.full_name || "",
                          phone: p.phone || "",
                          birth_date: p.birth_date || "",
                          baptism_date: p.baptism_date || "",
                          gender: p.gender || "",
                          privileges: p.privileges || [],
                          hope: p.hope || "",
                          status: p.status || "active",
                          group_id: p.group_id || "none",
                          is_indicator: p.is_indicator || false
                        }); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Excluir Publicador?</AlertDialogTitle><AlertDialogDescription>Deseja remover {p.full_name} do sistema?</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, Excluir</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filtered.length/10)} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>
    </div>
  );
}