import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, ShieldCheck, UserCheck, UserX, Key } from "lucide-react";
import { PaginationControls } from "@/components/PaginationControls";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: 'pending' | 'active' | 'inactive';
  role: 'admin' | 'user';
  permissions: Record<string, boolean>;
  created_at: string;
}

const PAGES = [
  { id: "dashboard", name: "Dashboard" },
  { id: "reports", name: "Relatórios" },
  { id: "groups", name: "Grupos" },
  { id: "publishers", name: "Publicadores" },
  { id: "meetings", name: "Reuniões" },
  { id: "audio-video", name: "Áudio e Vídeo" },
  { id: "cleaning", name: "Limpeza" },
  { id: "designations", name: "Designações" },
  { id: "school", name: "Escola" },
  { id: "territories", name: "Territórios" },
  { id: "users", name: "Gerenciar Usuários" },
];

const ITEMS_PER_PAGE = 10;

export default function Users() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Estados para Modais
  const [editOpen, setEditOpen] = useState(false);
  const [permOpen, setPermOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Estados de formulário
  const [editData, setEditData] = useState({ full_name: "", role: "user", password: "" });
  const [permData, setPermData] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProfiles();
    checkCurrentUser();
  }, []);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
    setCurrentUser(profile);
  };

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (error) {
      toast.error("Erro ao carregar usuários: " + error.message);
    } else {
      setProfiles(data || []);
    }
  };

  const handleStatusChange = async (user: Profile, newStatus: 'active' | 'inactive') => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus })
      .eq("id", user.id);

    if (error) {
      toast.error("Erro ao atualizar status: " + error.message);
    } else {
      toast.success(`Usuário ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso!`);
      loadProfiles();
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);

    const updates: any = {
      full_name: editData.full_name,
      role: editData.role,
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", selectedUser.id);

    if (profileError) {
      toast.error("Erro ao atualizar perfil: " + profileError.message);
      setLoading(false);
      return;
    }

    toast.success("Usuário atualizado com sucesso!");
    setEditOpen(false);
    loadProfiles();
    setLoading(false);
  };

  const handlePermSubmit = async () => {
    if (!selectedUser) return;
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ permissions: permData })
      .eq("id", selectedUser.id);

    if (error) {
      toast.error("Erro ao atualizar permissões: " + error.message);
    } else {
      toast.success("Permissões atualizadas!");
      setPermOpen(false);
      loadProfiles();
    }
    setLoading(false);
  };

  const openEdit = (user: Profile) => {
    setSelectedUser(user);
    setEditData({ full_name: user.full_name, role: user.role, password: "" });
    setEditOpen(true);
  };

  const openPerm = (user: Profile) => {
    setSelectedUser(user);
    setPermData(user.permissions || {});
    setPermOpen(true);
  };

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const totalPages = Math.ceil(profiles.length / ITEMS_PER_PAGE);
  const paginatedProfiles = profiles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">Aprovação e controle de acesso ao sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros Cadastrados</CardTitle>
          <CardDescription>Total de {profiles.length} membros</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProfiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{profile.full_name}</p>
                        <p className="text-xs text-muted-foreground">{profile.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={profile.status === 'active' ? 'secondary' : profile.status === 'pending' ? 'outline' : 'destructive'}>
                      {profile.status === 'active' ? 'Ativo' : profile.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {profile.status === 'pending' && (
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleStatusChange(profile, 'active')}>
                          <UserCheck className="h-4 w-4 mr-1" /> Aprovar
                        </Button>
                      )}
                      
                      <Button size="sm" variant="ghost" onClick={() => openEdit(profile)}>
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button size="sm" variant="ghost" onClick={() => openPerm(profile)}>
                        <ShieldCheck className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="ghost" className={profile.status === 'active' ? "text-destructive" : "text-green-600"}>
                            {profile.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmar alteração?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja realmente {profile.status === 'active' ? 'desativar' : 'ativar'} o acesso de {profile.full_name}?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Não</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleStatusChange(profile, profile.status === 'active' ? 'inactive' : 'active')}>
                              Sim, confirmar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Usuário</DialogTitle>
              <DialogDescription>Altere os dados básicos e perfil do usuário.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input value={editData.full_name} onChange={e => setEditData({...editData, full_name: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Perfil</Label>
                <Select 
                  value={editData.role} 
                  onValueChange={val => setEditData({...editData, role: val})}
                  disabled={currentUser?.role !== 'admin'}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuário Comum</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> Nova Senha (opcional)</Label>
                <Input type="password" placeholder="Deixe em branco para manter" value={editData.password} onChange={e => setEditData({...editData, password: e.target.value})} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Permissões */}
      <Dialog open={permOpen} onOpenChange={setPermOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Permissões de Acesso</DialogTitle>
            <DialogDescription>Selecione as páginas que {selectedUser?.full_name} pode acessar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {PAGES.map(page => (
              <div key={page.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={page.id} 
                  checked={permData[page.id] || false}
                  onCheckedChange={(checked) => setPermData({...permData, [page.id]: !!checked})}
                />
                <Label htmlFor={page.id} className="cursor-pointer">{page.name}</Label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handlePermSubmit} disabled={loading}>Salvar Permissões</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}