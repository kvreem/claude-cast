import blessed from "neo-blessed";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import type { StreamState, ChatMessage, LayoutMode } from "@claude-cast/shared";
import { DEFAULT_STATE } from "@claude-cast/shared";
import { createCompactLayout } from "./layouts/compact";
import { createRichLayout } from "./layouts/rich";
import { createMinimalLayout } from "./layouts/minimal";

const STATE_DIR = join(homedir(), ".claude", "channels", "claude-cast");
const STATE_FILE = join(STATE_DIR, "state.json");
const CHAT_FILE = join(STATE_DIR, "chat.jsonl");

// --- State ---

let state: StreamState = { ...DEFAULT_STATE };
let chatMessages: ChatMessage[] = [];
let lastChatSize = 0;

function loadStateFromFile(): void {
  try {
    if (existsSync(STATE_FILE)) {
      const raw = readFileSync(STATE_FILE, "utf-8");
      state = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    }
  } catch {
    // file might be mid-write
  }
}

function loadChatFromFile(): void {
  try {
    if (existsSync(CHAT_FILE)) {
      const raw = readFileSync(CHAT_FILE, "utf-8");
      if (raw.length === lastChatSize) return; // no new messages
      lastChatSize = raw.length;
      const lines = raw.trim().split("\n").filter(Boolean);
      chatMessages = lines.slice(-200).map((line) => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(Boolean) as ChatMessage[];
    }
  } catch {
    // file might be mid-write
  }
}

// --- Screen setup ---

const screen = blessed.screen({
  smartCSR: true,
  title: "claude-cast",
  mouse: false,
  fullUnicode: true,
});

// --- Layout management ---

type LayoutRenderer = {
  render(screen: blessed.Widgets.Screen, state: StreamState, chat: ChatMessage[]): void;
  destroy(): void;
};

const layouts: Record<LayoutMode, () => LayoutRenderer> = {
  compact: createCompactLayout,
  rich: createRichLayout,
  minimal: createMinimalLayout,
};

loadStateFromFile();
let currentLayout: LayoutRenderer = layouts[state.layout]();
currentLayout.render(screen, state, chatMessages);

function switchLayout(mode: LayoutMode): void {
  currentLayout.destroy();
  state.layout = mode;
  currentLayout = layouts[mode]();
  currentLayout.render(screen, state, chatMessages);
  screen.render();
}

function refresh(): void {
  loadStateFromFile();
  loadChatFromFile();
  currentLayout.render(screen, state, chatMessages);
  screen.render();
}

// Poll state file every 1 second
setInterval(refresh, 300);

// --- Hotkeys ---

const LAYOUT_CYCLE: LayoutMode[] = ["compact", "rich", "minimal"];

screen.key(["p"], () => {
  // Toggle pause by writing a command file
  const cmd = state.status === "playing" ? "pause" : "resume";
  writeCommand(cmd);
});

screen.key(["m"], () => {
  const cmd = state.muted ? "unmute" : "mute";
  writeCommand(cmd);
});

screen.key(["c"], () => {
  writeCommand("toggle_chat");
});

screen.key(["l"], () => {
  const idx = LAYOUT_CYCLE.indexOf(state.layout);
  const next = LAYOUT_CYCLE[(idx + 1) % LAYOUT_CYCLE.length];
  switchLayout(next);
});

screen.key(["up"], () => {
  const newVol = Math.min(100, state.volume + 5);
  writeCommand(`volume:${newVol}`);
  state.volume = newVol;
  refresh();
});

screen.key(["down"], () => {
  const newVol = Math.max(0, state.volume - 5);
  writeCommand(`volume:${newVol}`);
  state.volume = newVol;
  refresh();
});

screen.key(["q"], () => {
  process.exit(0);
});

screen.key(["S-q"], () => {
  writeCommand("stop");
  setTimeout(() => process.exit(0), 500);
});

screen.key(["escape", "C-c"], () => {
  process.exit(0);
});

// Write commands to a file for the server to pick up
function writeCommand(cmd: string): void {
  try {
    const { writeFileSync } = require("node:fs");
    const cmdFile = join(STATE_DIR, "command");
    writeFileSync(cmdFile, cmd);
  } catch {
    // ignore
  }
}

// --- Start ---

screen.render();
