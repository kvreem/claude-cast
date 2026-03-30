import type { ChatMessage } from "@claude-cast/shared";
import type { ChatEngine } from "./chat-engine";

const KICK_API_BASE = "https://kick.com/api/v2/channels";

export class KickChatEngine implements ChatEngine {
  private channel: string;
  private handlers: Array<(msg: ChatMessage) => void> = [];
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private chatroomId: number | null = null;

  constructor(channel: string) {
    this.channel = channel.toLowerCase();
  }

  connect(): void {
    this.resolveChatroomId().then(() => {
      if (this.chatroomId) {
        this.connectWebSocket();
      }
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
    this.ws = null;
  }

  onMessage(handler: (msg: ChatMessage) => void): void {
    this.handlers.push(handler);
  }

  private async resolveChatroomId(): Promise<void> {
    try {
      const res = await fetch(`${KICK_API_BASE}/${this.channel}`);
      const data = (await res.json()) as {
        chatroom?: { id?: number };
      };
      this.chatroomId = data.chatroom?.id || null;
    } catch {
      this.chatroomId = null;
    }
  }

  private connectWebSocket(): void {
    if (!this.chatroomId) return;

    // Kick uses Pusher for WebSocket chat
    const KICK_PUSHER_KEY = "32cbd69e4b950bf97679";
    const wsUrl =
      `wss://ws-us2.pusher.com/app/${KICK_PUSHER_KEY}` +
      `?protocol=7&client=js&version=7.6.0&flash=false`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      // Subscribe to the chatroom channel
      const subscribeMsg = JSON.stringify({
        event: "pusher:subscribe",
        data: { channel: `chatrooms.${this.chatroomId}.v2` },
      });
      this.ws?.send(subscribeMsg);
    };

    this.ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(String(event.data)) as {
          event?: string;
          data?: string;
        };

        if (parsed.event === "App\\Events\\ChatMessageEvent" && parsed.data) {
          const chatData = JSON.parse(parsed.data) as {
            sender?: { username?: string; identity?: { color?: string; badges?: Array<{ type?: string }> } };
            content?: string;
          };

          const user = chatData.sender?.username || "Unknown";
          const text = chatData.content || "";
          if (!text) return;

          const color = chatData.sender?.identity?.color || this.generateColor(user);
          const badges = chatData.sender?.identity?.badges?.map((b) => b.type || "") || [];

          const msg: ChatMessage = {
            user,
            text,
            color,
            timestamp: Date.now(),
            platform: "kick",
            badges: badges.filter(Boolean),
          };

          for (const handler of this.handlers) {
            handler(msg);
          }
        }
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      this.reconnectTimer = setTimeout(() => this.connectWebSocket(), 5000);
    };

    this.ws.onerror = () => {
      // onclose will handle reconnection
    };
  }

  private generateColor(username: string): string {
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }
}
