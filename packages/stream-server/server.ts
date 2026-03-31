import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { LayoutMode } from "@claude-cast/shared";
import { detectPlatform, getPlatformLabel } from "@claude-cast/shared";
import {
  getState,
  updateState,
  resetState,
  loadState,
  loadConfig,
  getConfig,
  updateConfig,
} from "./state";
import { PlayerEngine } from "./player-engine";
import { TuiBridge } from "./tui-bridge";
import { createChatEngine, type ChatEngine } from "./chat-engine";

const server = new Server(
  { name: "claude-cast", version: "0.1.0" },
  {
    capabilities: { tools: {} },
  }
);

const player = new PlayerEngine();
const tuiBridge = new TuiBridge();
let chatEngine: ChatEngine | null = null;
let streamStartedAt: number | null = null;

// Update elapsed time every second
setInterval(() => {
  const state = getState();
  if (state.status === "playing" && streamStartedAt) {
    const elapsed = Math.floor((Date.now() - streamStartedAt) / 1000);
    updateState({ elapsed });
  }
}, 1000);

// --- Tool definitions ---

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "cast_play",
      description:
        "Start streaming a channel. Auto-detects platform from URL/name. Opens TUI pane and starts audio.",
      inputSchema: {
        type: "object" as const,
        properties: {
          channel: {
            type: "string",
            description:
              "Channel name or URL. Bare name = Twitch. youtube.com/... = YouTube. kick.com/... = Kick.",
          },
          platform: {
            type: "string",
            enum: ["twitch", "youtube", "kick"],
            description: "Force a specific platform (optional, auto-detected from channel input).",
          },
        },
        required: ["channel"],
      },
    },
    {
      name: "cast_pause",
      description: "Pause audio playback.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_resume",
      description: "Resume audio playback.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_stop",
      description: "Stop the stream, disconnect chat, and close the TUI pane.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_mute",
      description: "Mute audio.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_unmute",
      description: "Unmute audio.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_volume",
      description: "Set audio volume.",
      inputSchema: {
        type: "object" as const,
        properties: {
          level: { type: "number", minimum: 0, maximum: 100, description: "Volume level (0-100)." },
        },
        required: ["level"],
      },
    },
    {
      name: "cast_status",
      description: "Get the current stream state.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_show_tui",
      description: "Open the TUI player pane in tmux.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_hide_tui",
      description: "Close the TUI pane. Audio continues playing.",
      inputSchema: { type: "object" as const, properties: {} },
    },
    {
      name: "cast_chat_mode",
      description: "Show or hide the chat panel in the TUI.",
      inputSchema: {
        type: "object" as const,
        properties: {
          visible: { type: "boolean", description: "true to show chat, false to hide." },
        },
        required: ["visible"],
      },
    },
    {
      name: "cast_layout",
      description: "Switch the TUI layout mode.",
      inputSchema: {
        type: "object" as const,
        properties: {
          mode: {
            type: "string",
            enum: ["compact", "rich", "minimal"],
            description: "Layout mode.",
          },
        },
        required: ["mode"],
      },
    },
    {
      name: "cast_video",
      description: "Toggle a floating HD video window. Opens a borderless, always-on-top mpv window on your desktop.",
      inputSchema: { type: "object" as const, properties: {} },
    },
  ],
}));

// --- Tool handlers ---

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "cast_play": {
      const input = (args as { channel: string; platform?: string }).channel;
      const forced = (args as { platform?: string }).platform;
      const detected = detectPlatform(input);
      const platform = (forced as "twitch" | "youtube" | "kick") || detected.platform;
      const channel = detected.channel;

      updateState({ status: "connecting", channel, platform, error: null });
      tuiBridge.sendStateUpdate(getState());

      try {
        await player.play(channel, platform);
        streamStartedAt = Date.now();
        updateState({ status: "playing", volume: getConfig().defaultVolume, elapsed: 0 });
        tuiBridge.sendStateUpdate(getState());

        // Start chat engine
        chatEngine?.disconnect();
        chatEngine = createChatEngine(platform, channel, getConfig());
        chatEngine.connect();

        const label = getPlatformLabel(platform);
        return text(`Now streaming ${channel} on ${label}. Audio playing.`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        updateState({ status: "error", error: msg });
        tuiBridge.sendStateUpdate(getState());
        return text(`Failed to start stream: ${msg}`);
      }
    }

    case "cast_pause": {
      await player.pause();
      updateState({ status: "paused" });
      tuiBridge.sendStateUpdate(getState());
      return text("Paused.");
    }

    case "cast_resume": {
      await player.resume();
      updateState({ status: "playing" });
      tuiBridge.sendStateUpdate(getState());
      return text("Playing.");
    }

    case "cast_stop": {
      await player.stop();
      chatEngine?.disconnect();
      chatEngine = null;
      streamStartedAt = null;
      await tuiBridge.close();
      resetState();
      tuiBridge.sendStateUpdate(getState());
      return text("Stopped. Stream ended, chat disconnected, pane closed.");
    }

    case "cast_mute": {
      await player.mute();
      updateState({ muted: true });
      tuiBridge.sendStateUpdate(getState());
      return text("Muted.");
    }

    case "cast_unmute": {
      await player.unmute();
      updateState({ muted: false });
      tuiBridge.sendStateUpdate(getState());
      return text("Unmuted.");
    }

    case "cast_volume": {
      const level = (args as { level: number }).level;
      await player.setVolume(level);
      updateState({ volume: level });
      tuiBridge.sendStateUpdate(getState());
      return text(`Volume set to ${level}%.`);
    }

    case "cast_status": {
      const state = getState();
      if (state.status === "idle") {
        return text("No active stream. Use `/claude-cast <channel>` to start.");
      }
      const label = state.platform ? getPlatformLabel(state.platform) : "Unknown";
      const lines = [
        `Channel: ${state.channel} (${label})`,
        `Status: ${state.status}`,
        `Volume: ${state.volume}%${state.muted ? " (muted)" : ""}`,
        `Layout: ${state.layout}`,
        `Chat: ${state.chatVisible ? "visible" : "hidden"}`,
        `TUI: ${state.tuiVisible ? "open" : "closed"}`,
      ];
      if (state.streamTitle) lines.push(`Title: ${state.streamTitle}`);
      if (state.viewerCount !== null) lines.push(`Viewers: ${state.viewerCount.toLocaleString()}`);
      if (state.error) lines.push(`Error: ${state.error}`);
      return text(lines.join("\n"));
    }

    case "cast_show_tui": {
      await tuiBridge.open();
      updateState({ tuiVisible: true });
      return text("Player pane opened.");
    }

    case "cast_hide_tui": {
      await tuiBridge.close();
      updateState({ tuiVisible: false });
      return text("Player pane closed. Audio continues playing.");
    }

    case "cast_chat_mode": {
      const visible = (args as { visible: boolean }).visible;
      updateState({ chatVisible: visible });
      tuiBridge.sendStateUpdate(getState());
      return text(visible ? "Chat visible." : "Chat hidden.");
    }

    case "cast_layout": {
      const mode = (args as { mode: LayoutMode }).mode;
      updateState({ layout: mode });
      tuiBridge.sendLayoutChange(mode);
      return text(`Layout changed to ${mode}.`);
    }

    case "cast_video": {
      const state = getState();
      if (state.status === "idle" || !state.channel || !state.platform) {
        return text("No active stream. Start one first with `/claude-cast <channel>`.");
      }
      await player.toggleVideo(state.channel, state.platform);
      return text(player.isVideoOpen()
        ? "Video window opened. Drag it anywhere on your screen."
        : "Video window closed.");
    }

    default:
      return text(`Unknown tool: ${name}`);
  }
});

function text(content: string) {
  return { content: [{ type: "text" as const, text: content }] };
}

// --- Cleanup on exit ---

async function cleanup() {
  await player.stop();
  chatEngine?.disconnect();
  await tuiBridge.cleanup();
  resetState();
}

process.on("SIGTERM", async () => {
  await cleanup();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(0);
});

process.on("exit", () => {
  // Sync cleanup — kill mpv if still running
  try {
    const { execSync } = require("node:child_process");
    execSync('pkill -f "mpv.*claude-cast-mpv"', { stdio: "ignore" });
  } catch {
    // already dead
  }
});

// --- Watch for TUI hotkey commands ---

import { existsSync as fsExists, readFileSync as fsRead, unlinkSync as fsUnlink } from "node:fs";
import { join as pathJoin } from "node:path";
import { homedir as osHome } from "node:os";

const CMD_FILE = pathJoin(osHome(), ".claude", "channels", "claude-cast", "command");

setInterval(async () => {
  try {
    if (!fsExists(CMD_FILE)) return;
    const cmd = fsRead(CMD_FILE, "utf-8").trim();
    fsUnlink(CMD_FILE);
    if (!cmd) return;

    if (cmd === "pause") {
      await player.pause();
      updateState({ status: "paused" });
    } else if (cmd === "resume") {
      await player.resume();
      updateState({ status: "playing" });
    } else if (cmd === "mute") {
      await player.mute();
      updateState({ muted: true });
    } else if (cmd === "unmute") {
      await player.unmute();
      updateState({ muted: false });
    } else if (cmd === "toggle_chat") {
      updateState({ chatVisible: !getState().chatVisible });
    } else if (cmd === "stop") {
      await player.stop();
      chatEngine?.disconnect();
      chatEngine = null;
      streamStartedAt = null;
      resetState();
    } else if (cmd.startsWith("volume:")) {
      const level = parseInt(cmd.split(":")[1], 10);
      if (!isNaN(level)) {
        await player.setVolume(level);
        updateState({ volume: level });
      }
    } else if (cmd.startsWith("layout:")) {
      const mode = cmd.split(":")[1] as "compact" | "rich" | "minimal";
      if (["compact", "rich", "minimal"].includes(mode)) {
        updateState({ layout: mode });
      }
    } else if (cmd === "video") {
      const state = getState();
      if (state.channel && state.platform) {
        await player.toggleVideo(state.channel, state.platform);
      }
    }
  } catch {
    // ignore command errors
  }
}, 500);

// --- Start ---

async function main() {
  loadState();
  loadConfig();

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("claude-cast server failed to start:", err);
  process.exit(1);
});
