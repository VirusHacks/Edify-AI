import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center space-y-4 max-w-md">
        <FileQuestion className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-semibold">404 - Page Not Found</h1>
        <p className="text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center pt-4">
          <Button asChild variant="default">
            <Link href="/">Go to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/main-dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

