import type { Platform } from "./types";

export function detectPlatform(input: string): { channel: string; platform: Platform } {
  // Strip protocol and www
  const cleaned = input.replace(/^https?:\/\/(www\.)?/, "");

  if (cleaned.includes("youtube.com") || cleaned.includes("youtu.be")) {
    return { channel: input, platform: "youtube" };
  }
  if (cleaned.includes("kick.com")) {
    const parts = cleaned.split("/");
    return { channel: parts[parts.length - 1] || input, platform: "kick" };
  }
  if (cleaned.includes("twitch.tv")) {
    const parts = cleaned.split("/");
    return { channel: parts[parts.length - 1] || input, platform: "twitch" };
  }
  // Default: treat bare name as Twitch channel
  return { channel: input, platform: "twitch" };
}

export function isInTmux(): boolean {
  return !!process.env.TMUX;
}

export function getPlatformLabel(platform: Platform): string {
  const labels: Record<Platform, string> = {
    twitch: "Twitch",
    youtube: "YouTube",
    kick: "Kick",
  };
  return labels[platform];
}

export function getStreamUrl(channel: string, platform: Platform): string {
  const prefixes: Record<Platform, string> = {
    twitch: "twitch.tv/",
    youtube: "",
    kick: "kick.com/",
  };
  // YouTube channels are already URLs
  if (platform === "youtube") return channel;
  return `${prefixes[platform]}${channel}`;
}
