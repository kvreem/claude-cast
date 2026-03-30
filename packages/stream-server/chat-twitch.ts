import { createConnection, type Socket } from "node:net";
import type { ChatMessage } from "@claude-cast/shared";
import type { ChatEngine } from "./chat-engine";

const TWITCH_IRC_HOST = "irc.chat.twitch.tv";
const TWITCH_IRC_PORT = 6667;

export class TwitchChatEngine implements ChatEngine {
  private socket: Socket | null = null;
  private channel: string;
  private handlers: Array<(msg: ChatMessage) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(channel: string) {
    this.channel = channel.toLowerCase().replace(/^#/, "");
  }

  connect(): void {
    this.socket = createConnection(TWITCH_IRC_PORT, TWITCH_IRC_HOST, () => {
      // Anonymous login — read-only, no auth needed
      const nick = `justinfan${Math.floor(1000 + Math.random() * 9000)}`;
      this.socket?.write(`NICK ${nick}\r\n`);
      this.socket?.write(`JOIN #${this.channel}\r\n`);
      // Request IRCv3 tags for badges and colors
      this.socket?.write("CAP REQ :twitch.tv/tags\r\n");
    });

    let buffer = "";

    this.socket.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("PING")) {
          this.socket?.write(`PONG ${line.slice(5)}\r\n`);
          continue;
        }
        this.parseLine(line);
      }
    });

    this.socket.on("close", () => {
      // Attempt reconnect after 5 seconds
      this.reconnectTimer = setTimeout(() => this.connect(), 5000);
    });

    this.socket.on("error", () => {
      // Will trigger close event, which handles reconnection
    });
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.destroy();
    this.socket = null;
  }

  onMessage(handler: (msg: ChatMessage) => void): void {
    this.handlers.push(handler);
  }

  private parseLine(line: string): void {
    // Parse IRCv3 tags + PRIVMSG
    // Format: @tags :user!user@user.tmi.twitch.tv PRIVMSG #channel :message
    let tags: Record<string, string> = {};
    let rest = line;

    if (rest.startsWith("@")) {
      const spaceIdx = rest.indexOf(" ");
      const tagStr = rest.slice(1, spaceIdx);
      rest = rest.slice(spaceIdx + 1);
      for (const pair of tagStr.split(";")) {
        const [key, val] = pair.split("=");
        if (key) tags[key] = val || "";
      }
    }

    const privmsgMatch = rest.match(/^:(\w+)!\S+ PRIVMSG #\S+ :(.+)$/);
    if (!privmsgMatch) return;

    const user = tags["display-name"] || privmsgMatch[1];
    const text = privmsgMatch[2];
    const color = tags.color || this.generateColor(user);
    const badges = tags.badges
      ? tags.badges.split(",").map((b) => b.split("/")[0])
      : [];

    const msg: ChatMessage = {
      user,
      text,
      color,
      timestamp: Date.now(),
      platform: "twitch",
      badges,
    };

    for (const handler of this.handlers) {
      handler(msg);
    }
  }

  private generateColor(username: string): string {
    // Generate a consistent color from username hash
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  }
}
