import type { ChatMessage, Config, Platform } from "@claude-cast/shared";
import { TwitchChatEngine } from "./chat-twitch";
import { YouTubeChatEngine } from "./chat-youtube";
import { KickChatEngine } from "./chat-kick";
import { addChatMessage } from "./state";

export interface ChatEngine {
  connect(): void;
  disconnect(): void;
  onMessage(handler: (msg: ChatMessage) => void): void;
}

export function createChatEngine(
  platform: Platform,
  channel: string,
  config: Config
): ChatEngine {
  let engine: ChatEngine;

  switch (platform) {
    case "twitch":
      engine = new TwitchChatEngine(channel);
      break;
    case "youtube":
      engine = new YouTubeChatEngine(channel, config.youtubeApiKey);
      break;
    case "kick":
      engine = new KickChatEngine(channel);
      break;
  }

  // Auto-store messages in state
  engine.onMessage((msg) => {
    addChatMessage(msg);
  });

  return engine;
}
