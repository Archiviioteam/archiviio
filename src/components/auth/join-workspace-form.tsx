"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatClientError } from "@/lib/supabase/format-error";
import { ensureUserWorkspace } from "@/lib/workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type JoinWorkspaceFormProps = {
  token: string;
  workspaceName: string;
  invitedEmail: string;
};

export function JoinWorkspaceForm({
  token,
  workspaceName,
  invitedEmail,
}: JoinWorkspaceFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(invitedEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setEmail(invitedEmail);
  }, [invitedEmail]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      let payload: { error?: string } | null = null;
      try {
        payload = (await response.json()) as { error?: string };
      } catch {
        payload = null;
      }

      if (!response.ok) {
        setError(payload?.error || "Impossibile completare l'invito. Riprova.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(
          "Account creato, ma l'accesso automatico non è riuscito. Prova ad accedere dalla pagina di login."
        );
        setLoading(false);
        return;
      }

      const workspaceResult = await ensureUserWorkspace(supabase);
      if ("error" in workspaceResult) {
        setError(workspaceResult.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(formatClientError(caughtError, "Impossibile completare l'invito. Riprova."));
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Unisciti allo spazio di {workspaceName}</CardTitle>
        <CardDescription>
          Inserisci la tua email e scegli una password per entrare nel workspace condiviso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              readOnly
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              placeholder="Scegli una password"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Accesso in corso..." : "Entra"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
