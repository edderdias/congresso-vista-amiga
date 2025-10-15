import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export default function Users() {
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    if (error) {
      toast({ title: "Erro ao carregar usuários", description: error.message, variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Usuários</h1>
        <p className="text-muted-foreground">Visualize todos os membros da congregação</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros Cadastrados</CardTitle>
          <CardDescription>Total de {profiles.length} membros</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Cadastrado em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {profile.full_name}
                    </div>
                  </TableCell>
                  <TableCell>{profile.email}</TableCell>
                  <TableCell>{profile.phone || "-"}</TableCell>
                  <TableCell>{new Date(profile.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
