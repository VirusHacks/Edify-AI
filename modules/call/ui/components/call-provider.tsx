"use client";

import { LoaderIcon } from "lucide-react";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { generateAvatarUri } from "@/lib/avatar";

import { CallConnect } from "./call-connect";

interface CallProviderProps {
  meetingId: string;
  meetingName: string;
}

export const CallProvider = ({ meetingId, meetingName }: CallProviderProps) => {
  const { user, isLoading } = useKindeBrowserClient();

  if (isLoading || !user) {
    return (
      <div className="from-sidebar-accent to-sidebar flex h-screen items-center justify-center bg-radial">
        <LoaderIcon className="size-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <CallConnect
      meetingId={meetingId}
      meetingName={meetingName}
      userId={user.id}
      userName={user.given_name ?? user.email ?? "User"}
      userImage={
        user.picture ??
        generateAvatarUri({ seed: user.given_name ?? "User", variant: "initials" })
      }
    />
  );
};
