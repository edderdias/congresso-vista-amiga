import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    congregation_name: "",
    coordinator_name: "",
    secretary_name: "",
    service_overseer_name: "",
    address: "",
    is_shared_building: false,
    shared_congregations: [] as string[]
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("*").single();
    if (data) setFormData({
      ...data,
      shared_congregations: Array.isArray(data.shared_congregations) ? data.shared_congregations : []
    });
  };

  const handleSave = async () => {
    setLoading(true);
    const { data: existing } = await supabase.from("settings").select("id").single();
    
    const { error } = existing 
      ? await supabase.from("settings").update(formData).eq("id", existing.id)
      : await supabase.from("settings").insert([formData]);

    setLoading(false);
    if (error) toast.error("Erro ao salvar");
    else toast.success("Configurações salvas!");
  };

  const addShared = () => setFormData({...formData, shared_congregations: [...formData.shared_congregations, ""]});
  const removeShared = (index: number) => setFormData({...formData, shared_congregations: formData.shared_congregations.filter((_, i) => i !== index)});
  const updateShared = (index: number, val: string) => {
    const newArr = [...formData.shared_congregations];
    newArr[index] = val;
    setFormData({...formData, shared_congregations: newArr});
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      
      <Card>
        <CardHeader><CardTitle>Dados da Congregação</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome da Congregação</Label><Input value={formData.congregation_name} onChange={e => setFormData({...formData, congregation_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Coordenador</Label><Input value={formData.coordinator_name} onChange={e => setFormData({...formData, coordinator_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Secretário</Label><Input value={formData.secretary_name} onChange={e => setFormData({...formData, secretary_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Superintendente de Serviço</Label><Input value={formData.service_overseer_name} onChange={e => setFormData({...formData, service_overseer_name: e.target.value})} /></div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2 mb-4">
              <Checkbox id="shared" checked={formData.is_shared_building} onCheckedChange={(v) => setFormData({...formData, is_shared_building: !!v})} />
              <Label htmlFor="shared" className="font-bold">Prédio Dividido?</Label>
            </div>

            {formData.is_shared_building && (
              <div className="space-y-3 pl-6">
                <Label>Congregações que dividem o prédio:</Label>
                {formData.shared_congregations.map((name, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={name} onChange={e => updateShared(i, e.target.value)} placeholder="Nome da congregação" />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Congregação?</AlertDialogTitle>
                          <AlertDialogDescription>Deseja remover esta congregação da lista de compartilhamento?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Não</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeShared(i)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sim, Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addShared}><Plus className="h-4 w-4 mr-1" /> Adicionar Congregação</Button>
              </div>
            )}
          </div>

          <div className="pt-6"><Button onClick={handleSave} disabled={loading} className="w-full"><Save className="h-4 w-4 mr-2" /> Salvar Configurações</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}