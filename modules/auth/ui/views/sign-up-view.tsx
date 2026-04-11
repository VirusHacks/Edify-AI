"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "@/components/ui/button";

export const SignUpView = () => {
  const { isLoading } = useKindeBrowserClient();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 p-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <img src="/logo.svg" alt="logo" className="size-16" />
        <h1 className="text-2xl font-bold">Let&apos;s get started</h1>
        <p className="text-muted-foreground">Create your account</p>
      </div>
      <Button asChild disabled={!!isLoading}>
        <RegisterLink>Continue with Kinde</RegisterLink>
      </Button>
    </div>
  );
};
