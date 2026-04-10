"use client";

import { ReactNode, useEffect, useState } from "react";
import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { usePathname } from "next/navigation";

import { tokenProvider } from "./streamAction.action";

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const { user, isAuthenticated } = useKindeBrowserClient();
  const pathname = usePathname();

  // Only initialize Stream client on meeting-related routes
  const isMeetingRoute = pathname?.includes('/meeting') || pathname?.includes('/call');

  useEffect(() => {
    if (!isMeetingRoute || !isAuthenticated || !user) {
      setVideoClient(undefined);
      return;
    }
    if (!API_KEY) throw new Error("Stream API key is missing");

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user?.id,
        name: user?.given_name || user?.id,
        image: user?.picture || undefined,
      },
      tokenProvider,  
    });

    setVideoClient(client);

    return () => {
      client.disconnectUser();
    };
  }, [user, isAuthenticated, isMeetingRoute]);

  // If we have a video client, wrap with StreamVideo
  if (videoClient) {
    return <StreamVideo client={videoClient}>{children}</StreamVideo>;
  }

  // Otherwise render children without StreamVideo wrapper
  // Individual pages can handle their own loading/authentication states
  return <>{children}</>;
};

export default StreamVideoProvider;