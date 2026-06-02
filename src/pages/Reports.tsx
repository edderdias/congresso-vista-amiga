"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Search, FileCheck, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PaginationControls } from "@/components/PaginationControls";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Reports() {
  const [reports, setReports] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [allActivePublishers, setAllActivePublishers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [showMissing, setShowMissing] = useState(false);

  const [formData, setFormData] = useState({
    group_id: "",
    publisher_id: "",
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear(),
    hours: 0,
    bible_studies: 0,
    notes: "",
    participated: false,
    pioneer_status: "publicador" as any,
  });

  useEffect(() => {
    loadReports();
    loadGroups();
    loadAllActivePublishers();
  }, [filterMonth, filterGroup, filterYear]);

  const loadGroups = async () => {
    const { data } = await supabase.from("groups").select("*").order("group_number");
    setGroups(data || []);
  };

  const loadAllActivePublishers = async () => {
    const { data } = await supabase
      .from("publishers")
      .select("*, groups(group_number)")
      .in("status", ["active", "repreendido"])
      .order("full_name");
    setAllActivePublishers(data || []);
  };

  const loadReports = async () => {
    let query = supabase
      .from("preaching_reports")
      .select("*")
      .eq("year", filterYear)
      .order("month", { ascending: false })
      .order("reporter_name", { ascending: true });

    if (filterMonth !== "all") query = query.eq("month", parseInt(filterMonth));
    if (filterGroup !== "all") query = query.eq("group_id", parseInt(filterGroup));

    const { data } = await query;
    setReports(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const publisher = allActivePublishers.find(p => p.id === formData.publisher_id);
    const group = groups.find(g => g.id === formData.group_id);

    const reportData = {
      publisher_id: formData.publisher_id,
      reporter_name: publisher?.full_name,
      group_id: group?.group_number,
      month: parseInt(formData.month),
      year: formData.year,
      hours: formData.hours,
      bible_studies: formData.bible_studies,
      notes: formData.notes,
      pioneer_status: formData.pioneer_status,
    };

    const { error } = editingReportId 
      ? await supabase.from("preaching_reports").update(reportData).eq("id", editingReportId)
      : await supabase.from("preaching_reports").insert([reportData]);

    if (error) toast.error("Erro ao salvar");
    else { toast.success("Salvo!"); setOpen(false); loadReports(); }
  };

  const getDisplayData = () => {
    if (!showMissing) {
      return reports.filter(r => r.reporter_name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    const targetMonth = filterMonth === "all" ? (new Date().getMonth() + 1) : parseInt(filterMonth);
    const reportedIds = new Set(reports.filter(r => r.month === targetMonth && r.year === filterYear).map(r => r.publisher_id));
    
    return allActivePublishers.filter(p => {
      const matchesSearch = p.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = filterGroup === "all" || p.group_id === groups.find(g => g.group_number.toString() === filterGroup)?.id;
      return matchesSearch && matchesGroup && !reportedIds.has(p.id);
    }).map(p => ({
      id: p.id,
      reporter_name: p.full_name,
      group_id: p.groups?.group_number || null,
      month: targetMonth,
      year: filterYear,
      isMissing: true
    }));
  };

  const filteredData = getDisplayData();
  const paginatedData = filteredData.slice((currentPage - 1) * 10, currentPage * 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Relatórios</h1>
        <Button onClick={() => { setEditingReportId(null); setFormData({group_id: "", publisher_id: "", month: (new Date().getMonth() + 1).toString(), year: new Date().getFullYear(), hours: 0, bible_studies: 0, notes: "", participated: false, pioneer_status: "publicador"}); setOpen(true); }}><Plus className="h-4 w-4 mr-2" /> Novo Relatório</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <Input placeholder="Pesquisar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Array.from({length: 12}, (_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{format(new Date(2024, i, 1), "MMMM", {locale: ptBR})}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {groups.map(g => <SelectItem key={g.id} value={g.group_number.toString()}>Grupo {g.group_number}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))} />
            <div className="flex items-center space-x-2 pb-2">
              <Checkbox id="missing" checked={showMissing} onCheckedChange={(v) => setShowMissing(!!v)} />
              <Label htmlFor="missing" className="font-bold text-red-600">Falta relatar</Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Mês/Ano</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Estudos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.map(r => {
                const isInactive = !r.isMissing && (r.hours === 0 && r.bible_studies === 0 && !r.notes?.toLowerCase().includes("participou"));
                return (
                  <TableRow key={r.id} className={cn(r.isMissing ? "bg-red-50/50" : "", isInactive ? "text-red-600 font-bold" : "")}>
                    <TableCell className="font-medium">{r.reporter_name}</TableCell>
                    <TableCell>Grupo {r.group_id}</TableCell>
                    <TableCell>{r.month}/{r.year}</TableCell>
                    <TableCell>{r.isMissing ? "-" : r.hours}</TableCell>
                    <TableCell>{r.isMissing ? "-" : r.bible_studies}</TableCell>
                    <TableCell className="text-right">
                      {!r.isMissing && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingReportId(r.id);
                            const pub = allActivePublishers.find(p => p.id === r.publisher_id || p.full_name === r.reporter_name);
                            setFormData({
                              group_id: groups.find(g => g.group_number === r.group_id)?.id || "",
                              publisher_id: pub?.id || "",
                              month: r.month.toString(),
                              year: r.year,
                              hours: r.hours,
                              bible_studies: r.bible_studies,
                              notes: r.notes || "",
                              participated: r.hours > 0 || r.bible_studies > 0,
                              pioneer_status: r.pioneer_status
                            });
                            setOpen(true);
                          }}><Pencil className="h-4 w-4" /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Excluir?</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Não</AlertDialogCancel><AlertDialogAction onClick={() => supabase.from("preaching_reports").delete().eq("id", r.id).then(() => loadReports())}>Sim</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <PaginationControls currentPage={currentPage} totalPages={Math.ceil(filteredData.length/10)} onPageChange={setCurrentPage} />
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader><DialogTitle>Relatório de Serviço</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Grupo</Label>
                <Select value={formData.group_id} onValueChange={v => setFormData({...formData, group_id: v, publisher_id: ""})}>
                  <SelectTrigger><SelectValue placeholder="Grupo" /></SelectTrigger>
                  <SelectContent>{groups.map(g => <SelectItem key={g.id} value={g.id}>Grupo {g.group_number}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Publicador</Label>
                <Select value={formData.publisher_id} onValueChange={v => setFormData({...formData, publisher_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Publicador" /></SelectTrigger>
                  <SelectContent>{allActivePublishers.filter(p => p.group_id === formData.group_id).map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Horas</Label><Input type="number" value={formData.hours} onChange={e => setFormData({...formData, hours: parseInt(e.target.value) || 0})} /></div>
              <div className="space-y-2"><Label>Estudos</Label><Input type="number" value={formData.bible_studies} onChange={e => setFormData({...formData, bible_studies: parseInt(e.target.value) || 0})} /></div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <RadioGroup value={formData.pioneer_status} onValueChange={v => setFormData({...formData, pioneer_status: v})}>
                <div className="flex items-center space-x-2"><RadioGroupItem value="publicador" id="p1" /><Label htmlFor="p1">Publicador</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="pioneiro_auxiliar" id="p2" /><Label htmlFor="p2">Pioneiro Auxiliar</Label></div>
                <div className="flex items-center space-x-2"><RadioGroupItem value="pioneiro_regular" id="p3" /><Label htmlFor="p3">Pioneiro Regular</Label></div>
              </RadioGroup>
            </div>
            <div className="space-y-2"><Label>Observação</Label><Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}