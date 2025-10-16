import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Territory {
  id: string;
  number: string;
  name: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  profiles: { full_name: string } | null;
}

interface Profile {
  id: string;
  full_name: string;
}

export default function Territories() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<{
    number: string;
    name: string;
    description: string;
    status: "available" | "assigned" | "completed";
    assigned_to: string;
  }>({
    number: "",
    name: "",
    description: "",
    status: "available",
    assigned_to: "none", // Inicializa com "none"
  });

  useEffect(() => {
    loadTerritories();
    loadProfiles();
  }, []);

  const loadTerritories = async () => {
    const { data, error } = await supabase
      .from("territories")
      .select("*, profiles(full_name)")
      .order("number");

    if (error) {
      toast({ title: "Erro ao carregar territórios", description: error.message, variant: "destructive" });
    } else {
      setTerritories(data || []);
    }
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name").order("full_name");
    setProfiles(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToInsert = {
      ...formData,
      assigned_to: formData.assigned_to === "none" ? null : formData.assigned_to, // Converte "none" para null
      assigned_date: formData.assigned_to === "none" ? null : new Date().toISOString(), // Define assigned_date se houver atribuição
    };

    const { error } = await supabase.from("territories").insert([dataToInsert]);

    if (error) {
      toast({ title: "Erro ao salvar território", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Território salvo com sucesso!" });
      setOpen(false);
      loadTerritories();
      setFormData({ number: "", name: "", description: "", status: "available", assigned_to: "none" }); // Reseta para "none"
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      available: { variant: "secondary", label: "Disponível" },
      assigned: { variant: "default", label: "Atribuído" },
      completed: { variant: "outline", label: "Concluído" },
    };
    const config = variants[status] || variants.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Territórios</h1>
          <p className="text-muted-foreground">Gerencie os territórios da congregação</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Território
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Adicionar Território</DialogTitle>
                <DialogDescription>Cadastre um novo território</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: "available" | "assigned" | "completed") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Disponível</SelectItem>
                      <SelectItem value="assigned">Atribuído</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned">Atribuído a</Label>
                  <Select value={formData.assigned_to} onValueChange={(value) => setFormData({ ...formData, assigned_to: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem> {/* Adicionado item "Nenhum" */}
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {territories.map((territory) => (
          <Card key={territory.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Território {territory.number}</CardTitle>
                {getStatusBadge(territory.status)}
              </div>
              <CardDescription>{territory.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">{territory.description || "Sem descrição"}</p>
                {territory.profiles && (
                  <p className="font-medium">
                    Atribuído a: <span className="text-primary">{territory.profiles.full_name}</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}