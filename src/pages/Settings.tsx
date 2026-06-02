"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Save, ShieldAlert } from "lucide-react";
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
    shared_congregations: [] as string[],
    prevent_duplicate_designations: true,
    prevent_duplicate_students: true
  });

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from("settings").select("*").single();
    if (data) setFormData({
      ...data,
      shared_congregations: Array.isArray(data.shared_congregations) ? data.shared_congregations : [],
      prevent_duplicate_designations: data.prevent_duplicate_designations ?? true,
      prevent_duplicate_students: data.prevent_duplicate_students ?? true
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Configurações</h1>
      
      <Card>
        <CardHeader><CardTitle>Dados da Congregação</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome da Congregação</Label><Input value={formData.congregation_name} onChange={e => setFormData({...formData, congregation_name: e.target.value})} /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
          </div>

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 text-primary font-bold mb-2">
              <ShieldAlert size={18} />
              <span>Regras de Validação</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 p-3 border rounded bg-slate-50">
                <Checkbox id="dup_desig" checked={formData.prevent_duplicate_designations} onCheckedChange={v => setFormData({...formData, prevent_duplicate_designations: !!v})} />
                <Label htmlFor="dup_desig" className="cursor-pointer">Impedir orador repetido na mesma reunião</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded bg-slate-50">
                <Checkbox id="dup_stud" checked={formData.prevent_duplicate_students} onCheckedChange={v => setFormData({...formData, prevent_duplicate_students: !!v})} />
                <Label htmlFor="dup_stud" className="cursor-pointer">Impedir estudante repetido na mesma reunião</Label>
              </div>
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full"><Save className="h-4 w-4 mr-2" /> Salvar Configurações</Button>
        </CardContent>
      </Card>
    </div>
  );
}