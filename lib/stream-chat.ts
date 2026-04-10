import "server-only";
import { StreamChat } from "stream-chat";

export const streamChat = StreamChat.getInstance(
  process.env.NEXT_PUBLIC_STREAM_AGENT_CHAT_API_KEY!,
  process.env.STREAM_AGENT_CHAT_SECRET_KEY!,
);
