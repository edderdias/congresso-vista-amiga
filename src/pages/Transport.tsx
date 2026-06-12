"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Users, UserPlus, ArrowLeft, MessageCircle, Save, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO, eachDayOfInterval, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Transport() {
  const [arrangements, setArrangements] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedArrangement, setSelectedArrangement] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  // Arrangement Modal State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: "assembleia",
    start_date: "",
    end_date: "",
    is_total_value: true,
    total_price: "",
    daily_costs: {} as Record<string, string>
  });

  // Member Modal State
  const [memberOpen, setMemberOpen] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [memberFormData, setMemberFormData] = useState({
    publisher_id: "",
    name: "",
    phone: "",
    observation: ""
  });

  // Payment Modal State
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadArrangements();
    loadPublishers();
  }, []);

  const loadArrangements = async () => {
    const { data, error } = await supabase
      .from("transport_arrangements")
      .select("*, transport_members(count), transport_daily_costs(*)")
      .order("start_date", { ascending: false });
    
    if (error) toast.error("Erro ao carregar arranjos");
    else setArrangements(data || []);
  };

  const loadPublishers = async () => {
    const { data } = await supabase
      .from("publishers")
      .select("id, full_name, phone")
      .neq("status", "removido")
      .order("full_name");
    setPublishers(data || []);
  };

  const loadMembers = async (arrangementId: string) => {
    const { data, error } = await supabase
      .from("transport_members")
      .select(`
        *,
        publisher:publishers(full_name, phone),
        payments:transport_payments(*)
      `)
      .eq("arrangement_id", arrangementId);
    
    if (error) toast.error("Erro ao carregar membros");
    else setMembers(data || []);
  };

  const handleSaveArrangement = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.type === "assembleia" ? formData.start_date : formData.end_date,
      is_total_value: formData.is_total_value,
      total_price: formData.is_total_value ? parseFloat(formData.total_price) : null
    };

    let arrangementId = editingId;
    if (editingId) {
      const { error } = await supabase.from("transport_arrangements").update(payload).eq("id", editingId);
      if (error) { toast.error("Erro ao atualizar"); setLoading(false); return; }
    } else {
      const { data, error } = await supabase.from("transport_arrangements").insert([payload]).select().single();
      if (error) { toast.error("Erro ao criar"); setLoading(false); return; }
      arrangementId = data.id;
    }

    // Handle daily costs if not total value
    if (!formData.is_total_value && arrangementId) {
      await supabase.from("transport_daily_costs").delete().eq("arrangement_id", arrangementId);
      const dailyPayloads = Object.entries(formData.daily_costs).map(([date, cost]) => ({
        arrangement_id: arrangementId,
        date,
        cost: parseFloat(cost) || 0
      }));
      if (dailyPayloads.length > 0) {
        await supabase.from("transport_daily_costs").insert(dailyPayloads);
      }
    }

    setLoading(false);
    setOpen(false);
    toast.success("Arranjo salvo!");
    loadArrangements();
  };

  const handleDeleteArrangement = async (id: string) => {
    const { error } = await supabase.from("transport_arrangements").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído!"); loadArrangements(); }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArrangement) return;

    const publisher = publishers.find(p => p.id === memberFormData.publisher_id);
    const payload = {
      arrangement_id: selectedArrangement.id,
      publisher_id: isMember ? memberFormData.publisher_id : null,
      name: isMember ? publisher?.full_name : memberFormData.name,
      phone: isMember ? publisher?.phone : memberFormData.phone,
      observation: memberFormData.observation
    };

    const { error } = await supabase.from("transport_members").insert([payload]);
    if (error) toast.error("Erro ao cadastrar pessoa");
    else {
      toast.success("Pessoa cadastrada!");
      setMemberOpen(false);
      loadArrangements();
      if (activeTab === "members") loadMembers(selectedArrangement.id);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const { error } = await supabase.from("transport_members").delete().eq("id", id);
    if (error) toast.error("Erro ao remover");
    else {
      toast.success("Removido!");
      loadMembers(selectedArrangement.id);
      loadArrangements();
    }
  };

  const handleLaunchPayments = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    setLoading(true);
    await supabase.from("transport_payments").delete().eq("member_id", selectedMember.id);

    const paymentPayloads = Object.entries(paymentData).map(([date, amount]) => ({
      member_id: selectedMember.id,
      date: date === "total" ? null : date,
      amount: parseFloat(amount) || 0
    }));

    const { error } = await supabase.from("transport_payments").insert(paymentPayloads);
    setLoading(false);
    if (error) toast.error("Erro ao salvar pagamentos");
    else {
      toast.success("Pagamentos salvos!");
      setPaymentOpen(false);
      loadMembers(selectedArrangement.id);
    }
  };

  const openEditArrangement = async (arr: any) => {
    setEditingId(arr.id);
    const { data: dailyCosts } = await supabase.from("transport_daily_costs").select("*").eq("arrangement_id", arr.id);
    const costsMap: Record<string, string> = {};
    dailyCosts?.forEach(c => costsMap[c.date] = c.cost.toString());

    setFormData({
      type: arr.type,
      start_date: arr.start_date,
      end_date: arr.end_date,
      is_total_value: arr.is_total_value,
      total_price: arr.total_price?.toString() || "",
      daily_costs: costsMap
    });
    setOpen(true);
  };

  const openLaunchPayments = (member: any) => {
    setSelectedMember(member);
    const data: Record<string, string> = {};
    if (selectedArrangement.is_total_value) {
      const totalPay = member.payments.find((p: any) => p.date === null);
      data["total"] = totalPay?.amount.toString() || "";
    } else {
      member.payments.forEach((p: any) => {
        if (p.date) data[p.date] = p.amount.toString();
      });
    }
    setPaymentData(data);
    setPaymentOpen(true);
  };

  const getDays = () => {
    if (!formData.start_date || !formData.end_date || formData.type === "assembleia") return [];
    try {
      return eachDayOfInterval({
        start: parseISO(formData.start_date),
        end: parseISO(formData.end_date)
      });
    } catch (e) { return []; }
  };

  const getArrangementDays = (arr: any) => {
    if (!arr.start_date || !arr.end_date || arr.type === "assembleia") return [parseISO(arr.start_date)];
    try {
      return eachDayOfInterval({
        start: parseISO(arr.start_date),
        end: parseISO(arr.end_date)
      });
    } catch (e) { return []; }
  };

  const calculateMemberTotal = (member: any) => {
    return member.payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            {activeTab === "members" && (
              <Button variant="ghost" size="icon" onClick={() => setActiveTab("list")}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <h1 className="text-3xl font-bold">Transporte</h1>
          </div>
          {activeTab === "list" && (
            <Button onClick={() => { 
              setEditingId(null); 
              setFormData({type: "assembleia", start_date: "", end_date: "", is_total_value: true, total_price: "", daily_costs: {}}); 
              setOpen(true); 
            }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Arranjo
            </Button>
          )}
        </div>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>Arranjos de Transporte</CardTitle>
              <CardDescription>Gerencie os transportes para congressos e assembleias</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Evento</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead>Valor por Dia</TableHead>
                    <TableHead>Pessoas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {arrangements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum arranjo cadastrado.</TableCell>
                    </TableRow>
                  ) : (
                    arrangements.map(arr => (
                      <TableRow key={arr.id}>
                        <TableCell className="font-bold capitalize">
                          {arr.type} {arr.name ? `- ${arr.name}` : ""}
                        </TableCell>
                        <TableCell>
                          {arr.type === "assembleia" 
                            ? format(parseISO(arr.start_date), "dd/MM/yyyy")
                            : `${format(parseISO(arr.start_date), "dd/MM")} a ${format(parseISO(arr.end_date), "dd/MM/yyyy")}`
                          }
                        </TableCell>
                        <TableCell>
                          {arr.is_total_value ? `R$ ${arr.total_price?.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          {!arr.is_total_value ? (
                            <div className="text-xs space-y-1">
                              {arr.transport_daily_costs?.map((c: any) => (
                                <div key={c.id}>{format(parseISO(c.date), "dd/MM")}: R$ {c.cost.toFixed(2)}</div>
                              ))}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>{arr.transport_members?.[0]?.count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" title="Ver Membros" onClick={() => { setSelectedArrangement(arr); loadMembers(arr.id); setActiveTab("members"); }}>
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" title="Cadastrar Pessoa" onClick={() => { setSelectedArrangement(arr); setIsMember(true); setMemberFormData({publisher_id: "", name: "", phone: "", observation: ""}); setMemberOpen(true); }}>
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditArrangement(arr)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir Arranjo?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta ação removerá todos os membros e pagamentos vinculados.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Não</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteArrangement(arr.id)} className="bg-destructive">Sim, Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle className="capitalize">
                Membros: {selectedArrangement?.type} ({selectedArrangement && format(parseISO(selectedArrangement.start_date), "dd/MM/yyyy")})
              </CardTitle>
              <CardDescription>Lista de pessoas cadastradas neste transporte</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Valor Pago</TableHead>
                    <TableHead>Valor Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Ninguém cadastrado ainda.</TableCell>
                    </TableRow>
                  ) : (
                    members.map(m => (
                      <TableRow key={m.id}>
                        <TableCell className="font-bold">{m.name}</TableCell>
                        <TableCell>
                          {m.phone ? (
                            <a href={`https://wa.me/55${m.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center text-green-600 hover:underline">
                              <MessageCircle className="h-4 w-4 mr-1" /> {m.phone}
                            </a>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-green-600 font-bold">
                          R$ {calculateMemberTotal(m).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          R$ {selectedArrangement?.is_total_value ? selectedArrangement.total_price?.toFixed(2) : "Variável"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="outline" size="sm" onClick={() => openLaunchPayments(m)}>
                              Lançar Valores
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Pessoa?</AlertDialogTitle>
                                  <AlertDialogDescription>Deseja remover {m.name} deste transporte?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Não</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMember(m.id)} className="bg-destructive">Sim, Remover</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Arrangement Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveArrangement} className="space-y-4">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Novo"} Arranjo de Transporte</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-2">
              <Label>Tipo de Evento</Label>
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assembleia">Assembleia</SelectItem>
                  <SelectItem value="congresso">Congresso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{formData.type === "assembleia" ? "Data" : "Data Inicial"}</Label>
                <Input type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
              </div>
              {formData.type === "congresso" && (
                <div className="space-y-2">
                  <Label>Data Final</Label>
                  <Input type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                </div>
              )}
            </div>

            {formData.type === "congresso" && (
              <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded border">
                <Checkbox id="total" checked={formData.is_total_value} onCheckedChange={v => setFormData({...formData, is_total_value: !!v})} />
                <Label htmlFor="total" className="cursor-pointer">Valor Total do Período?</Label>
              </div>
            )}

            {formData.is_total_value ? (
              <div className="space-y-2">
                <Label>Valor Total (R$)</Label>
                <Input type="number" step="0.01" value={formData.total_price} onChange={e => setFormData({...formData, total_price: e.target.value})} required />
              </div>
            ) : (
              <div className="space-y-3 border-t pt-3">
                <Label className="font-bold">Valores por Dia</Label>
                {getDays().map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  return (
                    <div key={dateStr} className="flex items-center justify-between gap-4">
                      <span className="text-sm">{format(day, "dd/MM (EEEE)", { locale: ptBR })}</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="w-32" 
                        placeholder="R$ 0,00"
                        value={formData.daily_costs[dateStr] || ""}
                        onChange={e => setFormData({
                          ...formData, 
                          daily_costs: {...formData.daily_costs, [dateStr]: e.target.value}
                        })}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Salvar Arranjo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Member Modal */}
      <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
        <DialogContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Cadastrar Pessoa no Transporte</DialogTitle>
              <DialogDescription>Adicione um membro da congregação ou um convidado.</DialogDescription>
            </DialogHeader>

            <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded border">
              <Checkbox id="is_member" checked={isMember} onCheckedChange={v => setIsMember(!!v)} />
              <Label htmlFor="is_member" className="cursor-pointer">É membro da congregação?</Label>
            </div>

            {isMember ? (
              <div className="space-y-2">
                <Label>Selecionar Publicador</Label>
                <Select value={memberFormData.publisher_id} onValueChange={v => setMemberFormData({...memberFormData, publisher_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o nome" /></SelectTrigger>
                  <SelectContent>
                    {publishers.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nome Completo</Label>
                  <Input value={memberFormData.name} onChange={e => setMemberFormData({...memberFormData, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={memberFormData.phone} onChange={e => setMemberFormData({...memberFormData, phone: e.target.value})} placeholder="(00) 00000-0000" />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Observação</Label>
              <Input value={memberFormData.observation} onChange={e => setMemberFormData({...memberFormData, observation: e.target.value})} />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">Cadastrar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent>
          <form onSubmit={handleLaunchPayments} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Lançar Valores: {selectedMember?.name}</DialogTitle>
              <DialogDescription>Informe os valores pagos por esta pessoa.</DialogDescription>
            </DialogHeader>

            {selectedArrangement?.is_total_value ? (
              <div className="space-y-2">
                <Label>Valor Pago (Total)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={paymentData["total"] || ""} 
                  onChange={e => setPaymentData({"total": e.target.value})} 
                  placeholder="R$ 0,00"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {selectedArrangement && getArrangementDays(selectedArrangement).map(day => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  return (
                    <div key={dateStr} className="flex items-center justify-between gap-4">
                      <span className="text-sm">{format(day, "dd/MM (EEEE)", { locale: ptBR })}</span>
                      <Input 
                        type="number" 
                        step="0.01" 
                        className="w-32" 
                        placeholder="R$ 0,00"
                        value={paymentData[dateStr] || ""}
                        onChange={e => setPaymentData({...paymentData, [dateStr]: e.target.value})}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Salvando..." : "Salvar Pagamentos"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}