import type { ChatMessage, LayoutMode, StreamState } from "./types";

// Server -> TUI messages
export type ServerMessage =
  | { type: "state_update"; data: StreamState }
  | { type: "chat_message"; data: ChatMessage }
  | { type: "chat_clear" }
  | { type: "layout_change"; mode: LayoutMode };

// TUI -> Server messages
export type TuiMessage =
  | { type: "command"; action: "pause" | "resume" | "mute" | "unmute" | "stop" }
  | { type: "command"; action: "volume"; value: number }
  | { type: "command"; action: "layout"; mode: LayoutMode }
  | { type: "command"; action: "toggle_chat" };

export function serialize(msg: ServerMessage | TuiMessage): string {
  return JSON.stringify(msg) + "\n";
}

export function deserialize(line: string): ServerMessage | TuiMessage | null {
  try {
    return JSON.parse(line.trim());
  } catch {
    return null;
  }
}
