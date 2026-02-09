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
import { PaginationControls } from "@/components/PaginationControls";

interface Group {
  id: string;
  group_number: number;
  overseer_id: string | null;
  assistant_id: string | null;
  field_service_meeting: string | null;
  overseer_name?: string;
  assistant_name?: string;
  publisher_count?: number;
}

interface EligiblePublisher {
  id: string;
  full_name: string;
}

const formSchema = z.object({
  group_number: z.coerce.number().min(1, "O número do grupo é obrigatório e deve ser maior que 0."),
  overseer_id: z.string().nullable().optional(),
  assistant_id: z.string().nullable().optional(),
  field_service_meeting: z.string().nullable().optional(),
});

const ITEMS_PER_PAGE = 10;

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [eligiblePublishers, setEligiblePublishers] = useState<EligiblePublisher[]>([]);
  const [open, setOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      group_number: 1,
      overseer_id: "none",
      assistant_id: "none",
      field_service_meeting: "",
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 1. Buscar todos os grupos
      const { data: groupsData, error: groupsError } = await supabase
        .from("groups")
        .select("*")
        .order("group_number", { ascending: true });

      if (groupsError) throw groupsError;

      // 2. Buscar todos os publicadores para mapear nomes e contar por grupo
      const { data: pubsData, error: pubsError } = await supabase
        .from("publishers")
        .select("id, full_name, group_id, privileges");

      if (pubsError) throw pubsError;

      // 3. Filtrar publicadores elegíveis (Anciãos/Servos)
      const eligible = pubsData?.filter(p => 
        p.privileges?.includes("Ancião") || p.privileges?.includes("Servo Ministerial")
      ) || [];
      setEligiblePublishers(eligible.map(p => ({ id: p.id, full_name: p.full_name })));

      // 4. Combinar os dados no frontend
      const formattedGroups = groupsData.map(group => {
        const overseer = pubsData.find(p => p.id === group.overseer_id);
        const assistant = pubsData.find(p => p.id === group.assistant_id);
        const count = pubsData.filter(p => p.group_id === group.id).length;

        return {
          ...group,
          overseer_name: overseer?.full_name || "-",
          assistant_name: assistant?.full_name || "-",
          publisher_count: count
        };
      });

      setGroups(formattedGroups);
    } catch (error: any) {
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroupId(group.id);
    form.reset({
      group_number: group.group_number,
      overseer_id: group.overseer_id || "none",
      assistant_id: group.assistant_id || "none",
      field_service_meeting: group.field_service_meeting || "",
    });
    setOpen(true);
  };

  const handleView = (group: Group) => {
    toast({
      title: `Detalhes do Grupo ${group.group_number}`,
      description: `Superintendente: ${group.overseer_name}, Ajudante: ${group.assistant_name}. Total de ${group.publisher_count} publicadores.`,
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const dataToSave = {
      group_number: values.group_number,
      overseer_id: values.overseer_id === "none" ? null : values.overseer_id,
      assistant_id: values.assistant_id === "none" ? null : values.assistant_id,
      field_service_meeting: values.field_service_meeting || null,
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
      loadData();
    }
  };

  const handleCloseDialog = () => {
    setOpen(false);
    form.reset();
    setEditingGroupId(null);
  };

  const totalPages = Math.ceil(groups.length / ITEMS_PER_PAGE);
  const paginatedGroups = groups.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
                        <FormLabel>Superintendente (Ancião/Servo)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um responsável" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {eligiblePublishers.map((pub) => (
                              <SelectItem key={pub.id} value={pub.id}>
                                {pub.full_name}
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
                        <FormLabel>Ajudante (Ancião/Servo)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um ajudante" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {eligiblePublishers.map((pub) => (
                              <SelectItem key={pub.id} value={pub.id}>
                                {pub.full_name}
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
              {paginatedGroups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.group_number}</TableCell>
                  <TableCell>{group.overseer_name}</TableCell>
                  <TableCell>{group.assistant_name}</TableCell>
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