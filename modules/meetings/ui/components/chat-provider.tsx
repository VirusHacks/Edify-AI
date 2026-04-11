"use client";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoadingState } from "@/components/loading-state";

import { ChatUI } from "./chat-ui";

interface ChatProviderProps {
  meetingId: string;
  meetingName: string;
}

export const ChatProvider = ({ meetingId, meetingName }: ChatProviderProps) => {
  const { user, isLoading } = useKindeBrowserClient();

  if (isLoading || !user) {
    return (
      <LoadingState
        title="Loading..."
        description="Please wait while we load the chat"
      />
    );
  }

  return (
    <ChatUI
      meetingId={meetingId}
      meetingName={meetingName}
      userId={user.id}
      userName={user.given_name ?? user.email ?? "User"}
      userImage={user.picture ?? ""}
    />
  );
};
