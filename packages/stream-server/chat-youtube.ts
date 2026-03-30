import type { ChatMessage } from "@claude-cast/shared";
import type { ChatEngine } from "./chat-engine";

const POLL_INTERVAL_MS = 6000; // YouTube rate limits — poll every 6 seconds

export class YouTubeChatEngine implements ChatEngine {
  private channel: string;
  private apiKey: string | undefined;
  private handlers: Array<(msg: ChatMessage) => void> = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private liveChatId: string | null = null;
  private pageToken: string | null = null;

  constructor(channel: string, apiKey?: string) {
    this.channel = channel;
    this.apiKey = apiKey;
  }

  connect(): void {
    if (!this.apiKey) {
      // Can't connect without API key — silently skip
      return;
    }
    this.resolveLiveChatId().then(() => {
      if (this.liveChatId) {
        this.startPolling();
      }
    });
  }

  disconnect(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  onMessage(handler: (msg: ChatMessage) => void): void {
    this.handlers.push(handler);
  }

  private async resolveLiveChatId(): Promise<void> {
    try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(this.channel);
      if (!videoId) return;

      const url =
        `https://www.googleapis.com/youtube/v3/videos?` +
        `part=liveStreamingDetails&id=${videoId}&key=${this.apiKey}`;

      const res = await fetch(url);
      const data = (await res.json()) as {
        items?: Array<{
          liveStreamingDetails?: { activeLiveChatId?: string };
        }>;
      };

      this.liveChatId = data.items?.[0]?.liveStreamingDetails?.activeLiveChatId || null;
    } catch {
      this.liveChatId = null;
    }
  }

  private startPolling(): void {
    this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
    this.poll(); // immediate first poll
  }

  private async poll(): Promise<void> {
    if (!this.liveChatId || !this.apiKey) return;

    try {
      let url =
        `https://www.googleapis.com/youtube/v3/liveChat/messages?` +
        `liveChatId=${this.liveChatId}&part=snippet,authorDetails&key=${this.apiKey}`;

      if (this.pageToken) {
        url += `&pageToken=${this.pageToken}`;
      }

      const res = await fetch(url);
      const data = (await res.json()) as {
        nextPageToken?: string;
        items?: Array<{
          snippet?: { displayMessage?: string; publishedAt?: string };
          authorDetails?: {
            displayName?: string;
            isChatOwner?: boolean;
            isChatModerator?: boolean;
          };
        }>;
      };

      this.pageToken = data.nextPageToken || null;

      for (const item of data.items || []) {
        const user = item.authorDetails?.displayName || "Unknown";
        const text = item.snippet?.displayMessage || "";
        if (!text) continue;

        const badges: string[] = [];
        if (item.authorDetails?.isChatOwner) badges.push("owner");
        if (item.authorDetails?.isChatModerator) badges.push("mod");

        const msg: ChatMessage = {
          user,
          text,
          color: this.generateColor(user),
          timestamp: Date.now(),
          platform: "youtube",
          badges,
        };

        for (const handler of this.handlers) {
          handler(msg);
        }
      }
    } catch {
      // Silently skip failed polls
    }
  }

  private extractVideoId(url: string): string | null {
    const patterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/live\/([^?]+)/,
      /youtu\.be\/([^?]+)/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
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
