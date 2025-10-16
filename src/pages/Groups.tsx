import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Group {
  id: string;
  group_number: number;
  overseer_id: string | null;
  assistant_id: string | null;
  field_service_meeting: string | null;
  publisher_count: number;
  overseer: { full_name: string } | null;
  assistant: { full_name: string } | null;
}

interface Profile {
  id: string;
  full_name: string;
}

const formSchema = z.object({
  group_number: z.coerce.number().min(1, "O número do grupo é obrigatório e deve ser maior que 0."),
  overseer_id: z.string().uuid().nullable().optional(),
  assistant_id: z.string().uuid().nullable().optional(),
  field_service_meeting: z.string().nullable().optional(),
  publisher_count: z.coerce.number().min(0, "O número de publicadores não pode ser negativo.").optional(),
});

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_number: 1,
      overseer_id: "",
      assistant_id: "",
      field_service_meeting: "",
      publisher_count: 0,
    },
  });

  useEffect(() => {
    loadGroups();
    loadProfiles();
  }, []);

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from("groups")
      .select("*, overseer:profiles!groups_overseer_id_fkey(full_name), assistant:profiles!groups_assistant_id_fkey(full_name)")
      .order("group_number", { ascending: true });

    if (error) {
      toast({ title: "Erro ao carregar grupos", description: error.message, variant: "destructive" });
    } else {
      setGroups(data || []);
    }
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    setProfiles(data || []);
  };

  const handleEdit = (group: Group) => {
    setEditingGroupId(group.id);
    form.reset({
      group_number: group.group_number,
      overseer_id: group.overseer_id || "",
      assistant_id: group.assistant_id || "",
      field_service_meeting: group.field_service_meeting || "",
      publisher_count: group.publisher_count,
    });
    setOpen(true);
  };

  const handleView = (group: Group) => {
    toast({
      title: `Detalhes do Grupo ${group.group_number}`,
      description: `Superintendente: ${group.overseer?.full_name || 'N/A'}, Ajudante: ${group.assistant?.full_name || 'N/A'}`,
    });
    // In a real app, this would navigate to a detailed view page
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataToSave = {
      group_number: values.group_number,
      overseer_id: values.overseer_id || null,
      assistant_id: values.assistant_id || null,
      field_service_meeting: values.field_service_meeting || null,
      publisher_count: values.publisher_count || 0,
    };

    let error = null;
    if (editingGroupId) {
      const { error: updateError } = await supabase
        .from("groups")
        .update(dataToSave)
        .eq("id", editingGroupId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from("groups").insert([dataToSave]);
      error = insertError;
    }

    if (error) {
      toast({ title: "Erro ao salvar grupo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Grupo salvo com sucesso!" });
      setOpen(false);
      form.reset();
      setEditingGroupId(null);
      loadGroups();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    form.reset();
    setEditingGroupId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Grupos</h1>
          <p className="text-muted-foreground">Gerencie os grupos de serviço de campo</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <DialogHeader>
                  <DialogTitle>{editingGroupId ? "Editar Grupo" : "Adicionar Grupo"}</DialogTitle>
                  <DialogDescription>Preencha os detalhes do grupo</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <FormField
                    control={form.control}
                    name="group_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número do Grupo</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Ex: 1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overseer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Superintendente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um superintendente (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="assistant_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ajudante</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ajudante (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="publisher_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Publicadores</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" placeholder="Ex: 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="field_service_meeting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Saída de Campo</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ex: Sábado, 9h, Salão do Reino" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit">{editingGroupId ? "Salvar Alterações" : "Salvar"}</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os Grupos</CardTitle>
          <CardDescription>Lista completa dos grupos de serviço de campo</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Superintendente</TableHead>
                <TableHead>Ajudante</TableHead>
                <TableHead>Publicadores</TableHead>
                <TableHead>Saída de Campo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.group_number}</TableCell>
                  <TableCell>{group.overseer?.full_name || "-"}</TableCell>
                  <TableCell>{group.assistant?.full_name || "-"}</TableCell>
                  <TableCell>{group.publisher_count}</TableCell>
                  <TableCell>{group.field_service_meeting || "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleView(group)} className="mr-2">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(group)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}