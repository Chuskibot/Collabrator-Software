// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import { LiveList } from "@liveblocks/client";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Example, real-time cursor coordinates
      // cursor: { x: number; y: number };
      isTyping?: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      // animals: LiveList<string>;
      chatMessages: LiveList<ChatMessage>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        color: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {
      type: "TYPING_START" | "TYPING_STOP";
    };
      // Example has two events, using a union
      // | { type: "PLAY" } 
      // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

// Define the ChatMessage type for use in the application
export type ChatMessage = {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  content: string;
  timestamp: number;
  reactions?: {
    emoji: string;
    users: string[];
  }[];
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name: string;
    size?: number;
    previewUrl?: string;
  }[];
};

export {};
