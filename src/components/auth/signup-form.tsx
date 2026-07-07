"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatAuthError, formatClientError } from "@/lib/supabase/format-error";
import { getAuthCallbackUrl } from "@/lib/supabase/site-url";
import { setupWorkspaceForUser } from "@/lib/workspace";
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

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const normalizedEmail = email.trim().toLowerCase();
      const resolvedWorkspaceName = workspaceName.trim() || "My studio";

      const apiResponse = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          workspaceName: resolvedWorkspaceName,
        }),
      });

      let useClientSignup = apiResponse.status === 503;

      if (!apiResponse.ok && !useClientSignup) {
        let apiError = "Sign-up failed. Please try again.";
        try {
          const payload = (await apiResponse.json()) as { error?: string };
          if (payload.error) {
            apiError = payload.error;
          }
        } catch {
          // ignore JSON parse errors
        }

        setError(apiError);
        setLoading(false);
        return;
      }

      if (!useClientSignup) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (signInError) {
          setError(formatAuthError(signInError, "Account created but sign-in failed. Try logging in."));
          setLoading(false);
          return;
        }

        const {
          data: { user: signedInUser },
        } = await supabase.auth.getUser();

        if (!signedInUser) {
          setError("Account created but sign-in failed. Try logging in.");
          setLoading(false);
          return;
        }

        const result = await setupWorkspaceForUser(
          supabase,
          signedInUser.id,
          normalizedEmail,
          resolvedWorkspaceName
        );

        if ("error" in result) {
          setError(result.error);
          setLoading(false);
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const { data, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            workspace_name: resolvedWorkspaceName,
          },
        },
      });

      if (authError) {
        setError(formatAuthError(authError));
        setLoading(false);
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setError(
          "An account with this email already exists. Try signing in instead."
        );
        setLoading(false);
        return;
      }

      const signedUpUser = data.user;

      if (!data.session) {
        setInfo(
          "We sent a confirmation link to your email. Open it to finish creating your workspace."
        );
        setLoading(false);
        return;
      }

      if (!signedUpUser) {
        setError("Could not complete sign-up. Please try again.");
        setLoading(false);
        return;
      }

      const result = await setupWorkspaceForUser(
        supabase,
        signedUpUser.id,
        normalizedEmail,
        resolvedWorkspaceName
      );

      if ("error" in result) {
        setError(result.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (caughtError) {
      setError(formatClientError(caughtError, "Sign-up failed. Please try again."));
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create account</CardTitle>
        <CardDescription>
          Set up your studio workspace in a few steps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace">Workspace name</Label>
            <Input
              id="workspace"
              type="text"
              placeholder="Studio name"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              required
            />
          </div>
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
              minLength={6}
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {info ? <p className="text-sm text-muted-foreground">{info}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-foreground hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
