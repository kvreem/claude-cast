export type LayoutMode = "compact" | "rich" | "minimal";
export type Platform = "twitch" | "youtube" | "kick";
export type PlaybackStatus = "idle" | "connecting" | "playing" | "paused" | "error";

export interface StreamState {
  status: PlaybackStatus;
  channel: string | null;
  platform: Platform | null;
  volume: number;
  muted: boolean;
  tuiVisible: boolean;
  chatVisible: boolean;
  layout: LayoutMode;
  streamTitle: string | null;
  viewerCount: number | null;
  elapsed: number;
  error: string | null;
}

export interface ChatMessage {
  user: string;
  text: string;
  color: string;
  timestamp: number;
  platform: Platform;
  badges?: string[];
}

export interface Config {
  defaultLayout: LayoutMode;
  defaultVolume: number;
  twitchClientId?: string;
  youtubeApiKey?: string;
  tmuxPaneWidth: number;
}

export const DEFAULT_CONFIG: Config = {
  defaultLayout: "compact",
  defaultVolume: 75,
  tmuxPaneWidth: 40,
};

export const DEFAULT_STATE: StreamState = {
  status: "idle",
  channel: null,
  platform: null,
  volume: 75,
  muted: false,
  tuiVisible: false,
  chatVisible: true,
  layout: "compact",
  streamTitle: null,
  viewerCount: null,
  elapsed: 0,
  error: null,
};
