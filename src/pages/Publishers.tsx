import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInYears, parseISO, isValid } from "date-fns";

interface Publisher {
  id: string;
  full_name: string;
  phone: string | null;
  birth_date: string | null;
  baptism_date: string | null;
  gender: 'M' | 'F' | null;
  privileges: string[];
  hope: 'anointed' | 'other_sheep' | null;
  status: 'active' | 'inactive';
  group_id: string | null;
  groups?: { group_number: number } | null;
}

const PRIVILEGE_OPTIONS = [
  "Publicador não batizado",
  "Publicador batizado",
  "Pioneiro regular",
  "Pioneiro auxiliar",
  "Pioneiro especial",
  "Servo ministerial",
  "Ancião"
];

export default function Publishers() {
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [groups, setGroups] = useState<{ id: string, group_number: number }[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPrivilege, setFilterPrivilege] = useState("all");

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    birth_date: "",
    baptism_date: "",
    gender: "" as 'M' | 'F' | "",
    privileges: [] as string[],
    hope: "" as 'anointed' | 'other_sheep' | "",
    status: "active" as 'active' | 'inactive',
    group_id: "none"
  });

  useEffect(() => {
    loadPublishers();
    loadGroups();
  }, []);

  const loadPublishers = async () => {
    const { data, error } = await supabase
      .from("publishers")
      .select("*, groups(group_number)")
      .order("full_name");

    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setPublishers(data || []);
    }
  };

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("id, group_number").order("group_number");
    setGroups(data || []);
  };

  const calculateAge = (dateStr: string) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (!isValid(date)) return null;
    return differenceInYears(new Date(), date);
  };

  const handlePrivilegeChange = (privilege: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      privileges: checked 
        ? [...prev.privileges, privilege]
        : prev.privileges.filter(p => p !== privilege)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const dataToSave = {
      ...formData,
      group_id: formData.group_id === "none" ? null : formData.group_id,
      gender: formData.gender || null,
      hope: formData.hope || null,
      birth_date: formData.birth_date || null,
      baptism_date: formData.baptism_date || null,
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from("publishers").update(dataToSave).eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from("publishers").insert([dataToSave]);
      error = err;
    }

    setLoading(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Publicador salvo com sucesso." });
      setOpen(false);
      resetForm();
      loadPublishers();
    }
  };

  const handleEdit = (pub: Publisher) => {
    setEditingId(pub.id);
    setFormData({
      full_name: pub.full_name,
      phone: pub.phone || "",
      birth_date: pub.birth_date || "",
      baptism_date: pub.baptism_date || "",
      gender: pub.gender || "",
      privileges: pub.privileges || [],
      hope: pub.hope || "",
      status: pub.status,
      group_id: pub.group_id || "none"
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este publicador?")) return;
    
    const { error } = await supabase.from("publishers").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Excluído", description: "Publicador removido com sucesso." });
      loadPublishers();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      full_name: "",
      phone: "",
      birth_date: "",
      baptism_date: "",
      gender: "",
      privileges: [],
      hope: "",
      status: "active",
      group_id: "none"
    });
  };

  const filteredPublishers = publishers.filter(pub => {
    const matchesSearch = pub.full_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === "all" || pub.group_id === filterGroup;
    const matchesStatus = filterStatus === "all" || pub.status === filterStatus;
    const matchesPrivilege = filterPrivilege === "all" || pub.privileges.includes(filterPrivilege);
    return matchesSearch && matchesGroup && matchesStatus && matchesPrivilege;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Publicadores</h1>
          <p className="text-muted-foreground">Gerencie os membros da congregação</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Publicador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Publicador" : "Cadastrar Novo Publicador"}</DialogTitle>
                <DialogDescription>Preencha os dados do publicador abaixo.</DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Contato</Label>
                    <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="birth">Data de Nascimento</Label>
                    <div className="flex items-center gap-2">
                      <Input id="birth" type="date" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
                      {formData.birth_date && <Badge variant="outline" className="whitespace-nowrap">{calculateAge(formData.birth_date)} anos</Badge>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baptism">Data de Batismo</Label>
                    <div className="flex items-center gap-2">
                      <Input id="baptism" type="date" value={formData.baptism_date} onChange={e => setFormData({...formData, baptism_date: e.target.value})} />
                      {formData.baptism_date && <Badge variant="outline" className="whitespace-nowrap">{calculateAge(formData.baptism_date)} anos de batismo</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Sexo</Label>
                    <RadioGroup value={formData.gender} onValueChange={(val: 'M' | 'F') => setFormData({...formData, gender: val})} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="M" id="m" />
                        <Label htmlFor="m">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="F" id="f" />
                        <Label htmlFor="f">Feminino</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Esperança</Label>
                    <RadioGroup value={formData.hope} onValueChange={(val: 'anointed' | 'other_sheep') => setFormData({...formData, hope: val})} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anointed" id="ungido" />
                        <Label htmlFor="ungido">Ungido</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other_sheep" id="ovelhas" />
                        <Label htmlFor="ovelhas">Outras Ovelhas</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Privilégios (pode marcar mais de um)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {PRIVILEGE_OPTIONS.map(priv => (
                      <div key={priv} className="flex items-center space-x-2">
                        <Checkbox 
                          id={priv} 
                          checked={formData.privileges.includes(priv)} 
                          onCheckedChange={(checked) => handlePrivilegeChange(priv, !!checked)}
                        />
                        <Label htmlFor={priv} className="text-sm font-normal">{priv}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Grupo</Label>
                    <Select value={formData.group_id} onValueChange={val => setFormData({...formData, group_id: val})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grupo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {groups.map(g => (
                          <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val: 'active' | 'inactive') => setFormData({...formData, status: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativo</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={loading}>{loading ? "Salvando..." : "Salvar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Publicadores</CardTitle>
          <CardDescription>Filtre e gerencie os publicadores cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Pesquisar por nome..." 
                className="pl-8" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Grupos</SelectItem>
                {groups.map(g => (
                  <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPrivilege} onValueChange={setFilterPrivilege}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Privilégio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Privilégios</SelectItem>
                {PRIVILEGE_OPTIONS.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Privilégios</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPublishers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum publicador encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPublishers.map((pub) => (
                    <TableRow key={pub.id}>
                      <TableCell className="font-medium">{pub.full_name}</TableCell>
                      <TableCell>{pub.phone || "-"}</TableCell>
                      <TableCell>{pub.groups ? `Grupo ${pub.groups.group_number}` : "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {pub.privileges.map(p => (
                            <Badge key={p} variant="secondary" className="text-[10px]">{p}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={pub.status === 'active' ? 'default' : 'destructive'}>
                          {pub.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(pub)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(pub.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}