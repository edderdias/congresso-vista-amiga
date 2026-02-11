import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Designation {
  id: string;
  designation_type: string;
  meeting_date: string;
  notes: string | null;
  profiles: { full_name: string };
}

interface Profile {
  id: string;
  full_name: string;
}

const ITEMS_PER_PAGE = 10;

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState<{
    user_id: string;
    designation_type: "sound" | "attendant" | "literature" | "cleaning" | "security";
    meeting_date: string;
    notes: string;
  }>({
    user_id: "",
    designation_type: "sound",
    meeting_date: "",
    notes: "",
  });

  useEffect(() => {
    loadDesignations();
    loadProfiles();
  }, []);

  const loadDesignations = async () => {
    const { data, error } = await supabase
      .from("designations")
      .select("*, profiles(full_name)")
      .order("meeting_date", { ascending: false });

    if (error) {
      toast({ title: "Erro ao carregar designações", description: error.message, variant: "destructive" });
    } else {
      setDesignations(data || []);
    }
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    setProfiles(data || []);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("designations").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Designação excluída" });
      loadDesignations();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from("designations").insert([formData]);

    if (error) {
      toast({ title: "Erro ao salvar designação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Designação salva com sucesso!" });
      setOpen(false);
      loadDesignations();
      setFormData({ user_id: "", designation_type: "sound", meeting_date: "", notes: "" });
    }
  };

  const designationTypes = [
    { value: "sound", label: "Som" },
    { value: "attendant", label: "Indicador" },
    { value: "literature", label: "Literatura" },
    { value: "cleaning", label: "Limpeza" },
    { value: "security", label: "Segurança" },
  ];

  const getTypeLabel = (type: string) => {
    return designationTypes.find(t => t.value === type)?.label || type;
  };

  const totalPages = Math.ceil(designations.length / ITEMS_PER_PAGE);
  const paginatedDesignations = designations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Designações</h1>
          <p className="text-muted-foreground">Gerencie as atribuições da congregação</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Designação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar Designação</DialogTitle>
                <DialogDescription>Atribua uma responsabilidade a um membro</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="user">Pessoa</Label>
                  <Select value={formData.user_id} onValueChange={(value) => setFormData({ ...formData, user_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma pessoa" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Designação</Label>
                  <Select value={formData.designation_type} onValueChange={(value: "sound" | "attendant" | "literature" | "cleaning" | "security") => setFormData({ ...formData, designation_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {designationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data da Reunião</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData({ ...formData, meeting_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full sm:w-auto">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Designações</CardTitle>
          <CardDescription>Lista completa de atribuições</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDesignations.map((designation) => (
                  <TableRow key={designation.id}>
                    <TableCell className="font-medium whitespace-nowrap">{designation.profiles?.full_name}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{getTypeLabel(designation.designation_type)}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{new Date(designation.meeting_date).toLocaleDateString('pt-BR')}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{designation.notes || "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Designação?</AlertDialogTitle>
                            <AlertDialogDescription>Deseja remover esta atribuição?</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(designation.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <PaginationControls 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={setCurrentPage} 
          />
        </CardContent>
      </Card>
    </div>
  );
}