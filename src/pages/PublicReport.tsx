"use client";

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Lock } from "lucide-react";

export default function PublicReport() {
  const { groupNumber } = useParams();
  const [groups, setGroups] = useState<{ id: string; group_number: number }[]>([]);
  const [publishers, setPublishers] = useState<{ id: string; full_name: string; privileges: string[] }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedPublisherId, setSelectedPublisherId] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [formData, setFormData] = useState({
    month: "",
    year: new Date().getFullYear(),
    participated: false,
    bible_studies: 0,
    hours: 0,
    notes: ""
  });

  useEffect(() => {
    checkAuth();
    calculateDefaultDate();
    loadGroups();
  }, [groupNumber]);

  useEffect(() => {
    if (formData.hours > 0 || formData.bible_studies > 0) {
      setFormData(prev => ({ ...prev, participated: true }));
    }
  }, [formData.hours, formData.bible_studies]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const calculateDefaultDate = () => {
    const now = new Date();
    const day = now.getDate();
    let month = now.getMonth() + 1;
    let year = now.getFullYear();

    // Regra: Dia 20 ou menos -> Mês anterior. Dia 21 ou mais -> Mês atual.
    if (day <= 20) {
      month = month - 1;
      if (month === 0) {
        month = 12;
        year = year - 1;
      }
    }

    setFormData(prev => ({ ...prev, month: month.toString(), year }));
  };

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("id, group_number").order("group_number");
    const allGroups = data || [];
    setGroups(allGroups);

    if (groupNumber) {
      const targetGroup = allGroups.find(g => g.group_number.toString() === groupNumber);
      if (targetGroup) {
        setSelectedGroupId(targetGroup.id);
        loadPublishers(targetGroup.id);
      }
    }
  };

  const loadPublishers = async (groupId: string) => {
    const { data } = await supabase
      .from("publishers")
      .select("id, full_name, privileges")
      .eq("group_id", groupId)
      .eq("status", "active")
      .order("full_name");
    setPublishers(data || []);
  };

  const handleGroupChange = (id: string) => {
    setSelectedGroupId(id);
    setSelectedPublisherId("");
    loadPublishers(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPublisherId) {
      toast.error("Por favor, selecione seu nome.");
      return;
    }

    setLoading(true);
    const publisher = publishers.find(p => p.id === selectedPublisherId);
    const group = groups.find(g => g.id === selectedGroupId);

    if (!publisher) {
      setLoading(false);
      toast.error("Publicador não encontrado.");
      return;
    }

    // Verificação de duplicidade rigorosa
    const { data: existingReports, error: checkError } = await supabase
      .from("preaching_reports")
      .select("id")
      .eq("reporter_name", publisher.full_name)
      .eq("month", parseInt(formData.month))
      .eq("year", formData.year);

    if (checkError) {
      console.error("[PublicReport] Erro ao verificar duplicidade:", checkError);
    }

    if (existingReports && existingReports.length > 0) {
      setLoading(false);
      toast.error("Relatório já enviado para esse mês. Caso queira corrigir a informação favor passar para o Superintendente do seu Grupo", {
        duration: 8000
      });
      return;
    }

    let pioneerStatus: "publicador" | "pioneiro_auxiliar" | "pioneiro_regular" = "publicador";
    if (publisher.privileges.includes("Pioneiro Regular")) pioneerStatus = "pioneiro_regular";
    else if (publisher.privileges.includes("Pioneiro Auxiliar")) pioneerStatus = "pioneiro_auxiliar";

    const { error } = await supabase.from("preaching_reports").insert([{
      reporter_name: publisher.full_name,
      group_id: group?.group_number,
      month: parseInt(formData.month),
      year: formData.year,
      hours: formData.hours,
      bible_studies: formData.bible_studies,
      notes: formData.notes,
      pioneer_status: pioneerStatus
    }]);

    setLoading(false);

    if (error) {
      console.error("Erro ao enviar relatório:", error);
      toast.error("Erro ao enviar relatório. Tente novamente mais tarde.");
    } else {
      setSubmitted(true);
      toast.success("Relatório enviado com sucesso!");
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center p-8">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl mb-2">Relatório Enviado!</CardTitle>
          <CardDescription className="text-lg">
            Obrigado por enviar seu relatório de serviço.
          </CardDescription>
          <Button className="mt-6 w-full" onClick={() => window.location.reload()}>
            Enviar outro relatório
          </Button>
        </Card>
      </div>
    );
  }

  const monthOptions = [
    { value: "1", label: "Janeiro" }, { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" }, { value: "4", label: "Abril" },
    { value: "5", label: "Maio" }, { value: "6", label: "Junho" },
    { value: "7", label: "Julho" }, { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" }, { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" }, { value: "12", label: "Dezembro" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="text-2xl">
            Relatório de Serviço {groupNumber ? `- Grupo ${groupNumber}` : ""}
          </CardTitle>
          <CardDescription className="text-primary-foreground/80">
            Envie seu relatório mensal de pregação
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!groupNumber && (
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select onValueChange={handleGroupChange} value={selectedGroupId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione seu grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className={groupNumber ? "col-span-2 space-y-2" : "space-y-2"}>
                <Label>Publicador</Label>
                <Select 
                  onValueChange={setSelectedPublisherId} 
                  value={selectedPublisherId}
                  disabled={!selectedGroupId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedGroupId ? "Selecione seu nome" : "Selecione o grupo primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {publishers.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Mês {!isLoggedIn && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Select 
                  value={formData.month} 
                  onValueChange={(val) => setFormData({...formData, month: val})}
                  disabled={!isLoggedIn}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Ano {!isLoggedIn && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                <Input 
                  type="number" 
                  value={formData.year} 
                  onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
                  disabled={!isLoggedIn}
                />
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-slate-100 rounded-md">
              <Checkbox 
                id="participated" 
                checked={formData.participated}
                onCheckedChange={(val) => setFormData({...formData, participated: !!val})}
              />
              <Label htmlFor="participated" className="text-sm font-normal leading-tight cursor-pointer">
                Marque se você participou em alguma modalidade do ministério durante o mês
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studies">Estudos Bíblicos</Label>
                <Input 
                  id="studies"
                  type="number" 
                  min="0"
                  className="w-full"
                  value={formData.bible_studies}
                  onChange={e => setFormData({...formData, bible_studies: parseInt(e.target.value) || 0})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Horas</Label>
                <Input 
                  id="hours"
                  type="number" 
                  min="0"
                  className="w-full"
                  value={formData.hours}
                  onChange={e => setFormData({...formData, hours: parseInt(e.target.value) || 0})}
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Se for pioneiro auxiliar, regular, especial ou missionario em campo
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Observação</Label>
              <Textarea 
                id="notes"
                placeholder="Alguma observação sobre seu serviço?"
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-semibold" disabled={loading}>
              {loading ? "Enviando..." : "Enviar Relatório"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}