import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { createServer, type Server as NetServer, type Socket } from "node:net";
import { join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import type { LayoutMode, StreamState } from "@claude-cast/shared";
import { serialize } from "@claude-cast/shared";
import { getSocketDir, getConfig, getState } from "./state";

const exec = promisify(execCb);

export class TuiBridge {
  private ipcServer: NetServer | null = null;
  private tuiSocket: Socket | null = null;
  private ipcSocketPath: string;
  private tuiPaneId: string | null = null;
  private stateInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.ipcSocketPath = join(getSocketDir(), "tui.sock");

    // Push state to TUI every 2 seconds (keeps elapsed time updated)
    this.stateInterval = setInterval(() => {
      const state = getState();
      if (state.status !== "idle" && this.tuiSocket && !this.tuiSocket.destroyed) {
        this.sendStateUpdate(state);
      }
    }, 2000);
  }

  async open(): Promise<void> {
    // Start IPC server if not already running
    if (!this.ipcServer) {
      await this.startIpcServer();
    }

    // Check if TUI pane already exists
    if (this.tuiPaneId) {
      try {
        await exec(`tmux has-session -t "${this.tuiPaneId}" 2>/dev/null`);
        return; // pane still alive
      } catch {
        this.tuiPaneId = null; // pane is dead
      }
    }

    // Ensure tmux is available
    await this.ensureTmux();

    // Spawn TUI in a tmux pane
    const config = getConfig();
    const tuiScript = join(process.env.CLAUDE_CAST_ROOT || ".", "packages", "stream-tui", "main.ts");
    const width = config.tmuxPaneWidth || 40;

    try {
      // Enable mouse mode so user can click between panes
      await exec("tmux set -g mouse on").catch(() => {});

      const { stdout } = await exec(
        `tmux split-window -h -l ${width} -P -F '#{pane_id}' "bun ${tuiScript}"`
      );
      this.tuiPaneId = stdout.trim();

      // Focus back to the Claude Code pane
      await exec("tmux select-pane -L").catch(() => {});
    } catch (err) {
      throw new Error(
        `Failed to open TUI pane. Make sure you're in a tmux session. ` +
          `Error: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async close(): Promise<void> {
    if (this.tuiPaneId) {
      try {
        await exec(`tmux kill-pane -t "${this.tuiPaneId}"`);
      } catch {
        // pane may already be closed
      }
      this.tuiPaneId = null;
    }

    this.tuiSocket?.end();
    this.tuiSocket = null;
  }

  sendStateUpdate(state: StreamState): void {
    this.send({ type: "state_update", data: state });
  }

  sendLayoutChange(mode: LayoutMode): void {
    this.send({ type: "layout_change", mode });
  }

  private send(msg: { type: string; [key: string]: unknown }): void {
    if (this.tuiSocket && !this.tuiSocket.destroyed) {
      this.tuiSocket.write(serialize(msg as Parameters<typeof serialize>[0]));
    }
  }

  private async startIpcServer(): Promise<void> {
    // Clean up stale socket
    if (existsSync(this.ipcSocketPath)) {
      unlinkSync(this.ipcSocketPath);
    }

    return new Promise((resolve) => {
      this.ipcServer = createServer((socket) => {
        this.tuiSocket = socket;

        // Send current state immediately when TUI connects
        const currentState = getState();
        socket.write(serialize({ type: "state_update", data: currentState }));

        socket.on("data", (data) => {
          // Handle commands from TUI (hotkeys)
          const lines = data.toString().split("\n").filter(Boolean);
          for (const line of lines) {
            try {
              const msg = JSON.parse(line);
              this.handleTuiMessage(msg);
            } catch {
              // ignore malformed messages
            }
          }
        });

        socket.on("close", () => {
          if (this.tuiSocket === socket) {
            this.tuiSocket = null;
          }
        });
      });

      this.ipcServer.listen(this.ipcSocketPath, () => {
        resolve();
      });
    });
  }

  private handleTuiMessage(_msg: unknown): void {
    // TUI commands are handled by importing the relevant functions
    // This will be wired up when the TUI is implemented
    // For now, the TUI sends commands back over IPC and the server processes them
  }

  private async ensureTmux(): Promise<void> {
    try {
      await exec("command -v tmux");
    } catch {
      // tmux not found — attempt to install
      const platform = process.platform;
      if (platform === "darwin") {
        throw new Error(
          "tmux is required but not installed. Install with: brew install tmux"
        );
      } else {
        throw new Error(
          "tmux is required but not installed. Install with: sudo apt install tmux (Debian/Ubuntu) or sudo yum install tmux (RHEL/CentOS)"
        );
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.stateInterval) {
      clearInterval(this.stateInterval);
      this.stateInterval = null;
    }
    await this.close();
    this.ipcServer?.close();
    this.ipcServer = null;

    if (existsSync(this.ipcSocketPath)) {
      unlinkSync(this.ipcSocketPath);
    }
  }
}
