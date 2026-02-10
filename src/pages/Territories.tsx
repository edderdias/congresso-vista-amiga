import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Eye, Map as MapIcon, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { PaginationControls } from "@/components/PaginationControls";

interface Territory {
  id: string;
  number: string;
  name: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  image_url?: string | null;
  map_url?: string | null;
  publisher_name?: string;
}

interface MalePublisher {
  id: string;
  full_name: string;
}

const ITEMS_PER_PAGE = 6;

export default function Territories() {
  const [territories, setTerritories] = useState<Territory[]>([]);
  const [malePublishers, setMalePublishers] = useState<MalePublisher[]>([]);
  const [open, setOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedTerritory, setSelectedTerritory] = useState<Territory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [formData, setFormData] = useState({
    number: "",
    name: "",
    description: "",
    status: "available" as "available" | "assigned" | "completed",
    assigned_to: "none",
    image_url: "",
    map_url: ""
  });

  useEffect(() => {
    loadTerritories();
    loadMalePublishers();
  }, []);

  const loadTerritories = async () => {
    try {
      const { data: territoriesData, error } = await supabase
        .from("territories")
        .select("*")
        .order("number");

      if (error) throw error;

      // Buscar nomes dos publicadores separadamente para evitar erros de relacionamento
      const { data: pubsData } = await supabase.from("publishers").select("id, full_name");
      
      const formatted = territoriesData.map(t => ({
        ...t,
        publisher_name: pubsData?.find(p => p.id === t.assigned_to)?.full_name
      }));

      setTerritories(formatted);
    } catch (error: any) {
      toast({ title: "Erro ao carregar territórios", description: error.message, variant: "destructive" });
    }
  };

  const loadMalePublishers = async () => {
    const { data } = await supabase
      .from("publishers")
      .select("id, full_name")
      .eq("gender", "M")
      .order("full_name");
    setMalePublishers(data || []);
  };

  const handleEdit = (territory: Territory) => {
    setEditingId(territory.id);
    setFormData({
      number: territory.number,
      name: territory.name,
      description: territory.description || "",
      status: territory.status as any,
      assigned_to: territory.assigned_to || "none",
      image_url: territory.image_url || "",
      map_url: territory.map_url || ""
    });
    setOpen(true);
  };

  const handleView = (territory: Territory) => {
    setSelectedTerritory(territory);
    setViewOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      number: "",
      name: "",
      description: "",
      status: "available",
      assigned_to: "none",
      image_url: "",
      map_url: ""
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      number: formData.number,
      name: formData.name,
      description: formData.description || null,
      status: formData.status,
      assigned_to: formData.assigned_to === "none" ? null : formData.assigned_to,
      image_url: formData.image_url || null,
      map_url: formData.map_url || null,
      assigned_date: formData.assigned_to !== "none" ? new Date().toISOString() : null,
    };

    let error;
    if (editingId) {
      const { error: err } = await supabase.from("territories").update(dataToSave).eq("id", editingId);
      error = err;
    } else {
      const { error: err } = await supabase.from("territories").insert([dataToSave]);
      error = err;
    }

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Território salvo com sucesso." });
      setOpen(false);
      resetForm();
      loadTerritories();
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

  const totalPages = Math.ceil(territories.length / ITEMS_PER_PAGE);
  const paginatedTerritories = territories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Territórios</h1>
          <p className="text-muted-foreground">Gerencie os territórios da congregação</p>
        </div>
        <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Território
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Território" : "Adicionar Território"}</DialogTitle>
                <DialogDescription>Preencha os dados do território abaixo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="number">Número</Label>
                    <Input id="number" value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image_url">URL da Imagem</Label>
                  <Input id="image_url" placeholder="https://exemplo.com/imagem.jpg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="map_url">URL do Mapa (Google Maps)</Label>
                  <Input id="map_url" placeholder="https://goo.gl/maps/..." value={formData.map_url} onChange={e => setFormData({...formData, map_url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(val: any) => setFormData({...formData, status: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="assigned">Atribuído</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assigned">Atribuído a (Masculino)</Label>
                    <Select value={formData.assigned_to} onValueChange={val => setFormData({...formData, assigned_to: val})}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {malePublishers.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal de Visualização */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedTerritory && (
            <>
              <DialogHeader>
                <DialogTitle>Território {selectedTerritory.number} - {selectedTerritory.name}</DialogTitle>
                <div className="mt-2">{getStatusBadge(selectedTerritory.status)}</div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedTerritory.image_url && (
                  <div className="aspect-video w-full overflow-hidden rounded-lg border">
                    <img src={selectedTerritory.image_url} alt={selectedTerritory.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Descrição</Label>
                  <p className="text-sm">{selectedTerritory.description || "Sem descrição disponível."}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Atribuído a</Label>
                    <p className="font-medium">{selectedTerritory.publisher_name || "Ninguém"}</p>
                  </div>
                  {selectedTerritory.map_url && (
                    <div>
                      <Label className="text-muted-foreground">Mapa</Label>
                      <a href={selectedTerritory.map_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline">
                        <MapIcon className="mr-1 h-4 w-4" /> Ver no Google Maps
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {paginatedTerritories.map((territory) => (
          <Card key={territory.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
            <div className="aspect-video w-full bg-slate-100 relative">
              {territory.image_url ? (
                <img src={territory.image_url} alt={territory.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                {getStatusBadge(territory.status)}
              </div>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">T-{territory.number}</CardTitle>
              <CardDescription className="font-medium text-foreground">{territory.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {territory.description || "Sem descrição"}
              </p>
              {territory.publisher_name && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Atribuído: </span>
                  <span className="font-semibold text-primary">{territory.publisher_name}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t bg-slate-50/50 p-3 flex justify-between gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleView(territory)}>
                <Eye className="h-4 w-4 mr-1" /> Ver
              </Button>
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(territory)}>
                <Pencil className="h-4 w-4 mr-1" /> Editar
              </Button>
              {territory.map_url && (
                <Button variant="ghost" size="icon" asChild>
                  <a href={territory.map_url} target="_blank" rel="noopener noreferrer">
                    <MapIcon className="h-4 w-4 text-primary" />
                  </a>
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
      <PaginationControls 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage} 
      />
    </div>
  );
}