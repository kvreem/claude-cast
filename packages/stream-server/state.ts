import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import {
  type StreamState,
  type Config,
  type ChatMessage,
  DEFAULT_STATE,
  DEFAULT_CONFIG,
} from "@claude-cast/shared";

const STATE_DIR = join(homedir(), ".claude", "channels", "claude-cast");
const STATE_FILE = join(STATE_DIR, "state.json");
const CONFIG_FILE = join(STATE_DIR, "config.json");

const MAX_CHAT_MESSAGES = 500;

function ensureDir(): void {
  if (!existsSync(STATE_DIR)) {
    mkdirSync(STATE_DIR, { recursive: true });
  }
}

// --- State ---

let currentState: StreamState = { ...DEFAULT_STATE };
let chatMessages: ChatMessage[] = [];

export function getState(): StreamState {
  return { ...currentState };
}

export function updateState(partial: Partial<StreamState>): StreamState {
  currentState = { ...currentState, ...partial };
  persistState();
  return getState();
}

export function resetState(): StreamState {
  currentState = { ...DEFAULT_STATE };
  chatMessages = [];
  persistState();
  return getState();
}

function persistState(): void {
  ensureDir();
  writeFileSync(STATE_FILE, JSON.stringify(currentState, null, 2));
}

export function loadState(): void {
  ensureDir();
  if (existsSync(STATE_FILE)) {
    try {
      const raw = readFileSync(STATE_FILE, "utf-8");
      currentState = { ...DEFAULT_STATE, ...JSON.parse(raw) };
    } catch {
      currentState = { ...DEFAULT_STATE };
    }
  }
}

// --- Chat messages (persisted to file for TUI) ---

const CHAT_FILE = join(STATE_DIR, "chat.jsonl");

export function addChatMessage(msg: ChatMessage): void {
  chatMessages.push(msg);
  if (chatMessages.length > MAX_CHAT_MESSAGES) {
    chatMessages = chatMessages.slice(-MAX_CHAT_MESSAGES);
  }
  // Append to chat file for TUI to read
  try {
    appendFileSync(CHAT_FILE, JSON.stringify(msg) + "\n");
  } catch {
    // ignore write errors
  }
}

export function getChatMessages(): ChatMessage[] {
  return [...chatMessages];
}

export function clearChat(): void {
  chatMessages = [];
  // Clear chat file
  try {
    writeFileSync(CHAT_FILE, "");
  } catch {
    // ignore
  }
}

// --- Config ---

let currentConfig: Config = { ...DEFAULT_CONFIG };

export function getConfig(): Config {
  return { ...currentConfig };
}

export function updateConfig(partial: Partial<Config>): Config {
  currentConfig = { ...currentConfig, ...partial };
  persistConfig();
  return getConfig();
}

function persistConfig(): void {
  ensureDir();
  writeFileSync(CONFIG_FILE, JSON.stringify(currentConfig, null, 2));
}

export function loadConfig(): void {
  ensureDir();
  if (existsSync(CONFIG_FILE)) {
    try {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } catch {
      currentConfig = { ...DEFAULT_CONFIG };
    }
  }
}

// --- Paths ---

export function getSocketDir(): string {
  ensureDir();
  return STATE_DIR;
}
