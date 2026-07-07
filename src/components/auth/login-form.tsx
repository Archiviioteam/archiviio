"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/auth/routes";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, formatClientError } from "@/lib/supabase/format-error";
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

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("error");
    if (authError === "auth_callback_failed") {
      setError("Sign-in could not be completed. Please try again.");
    }
    if (authError === "email_link_expired") {
      setError("This email link has expired. Request a new one.");
    }
    if (authError === "workspace_setup_failed") {
      setError("Your account was created but workspace setup failed.");
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(formatAuthError(authError, "Sign-in failed. Please try again."));
        setLoading(false);
        return;
      }

      const workspaceResult = await ensureUserWorkspace(supabase);
      if ("error" in workspaceResult) {
        setError(workspaceResult.error);
        setLoading(false);
        return;
      }

      router.push(getSafeRedirectPath(searchParams.get("next")));
      router.refresh();
    } catch (caughtError) {
      setError(formatClientError(caughtError, "Sign-in failed. Please try again."));
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Access your workspace with your email and password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/signup" className="text-foreground hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
