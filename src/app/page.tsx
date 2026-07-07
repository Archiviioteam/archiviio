import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { textStyle } from "@/lib/typography";

export default function Home() {
  return (
    <div className="flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-8 p-8">
      <Card className="max-w-md">
        <CardContent className="flex flex-col gap-3 p-8 text-center">
          <h1 className={textStyle.display + " text-foreground"}>Archiviio</h1>
          <p className={textStyle.body + " text-muted-foreground"}>
            Professional workspace management for studios and freelancers.
          </p>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/signup">Create account</Link>
        </Button>
      </div>
    </div>
  );
}
