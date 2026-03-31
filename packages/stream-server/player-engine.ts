import { exec as execCb } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import type { Platform } from "@claude-cast/shared";
import { getStreamUrl } from "@claude-cast/shared";
import { getSocketDir } from "./state";

const exec = promisify(execCb);

export class PlayerEngine {
  private mpvProcess: ReturnType<typeof import("node:child_process").spawn> | null = null;
  private videoProcess: ReturnType<typeof import("node:child_process").spawn> | null = null;
  private socketPath: string;
  private currentStreamUrl: string | null = null;

  constructor() {
    this.socketPath = "/tmp/claude-cast-mpv.sock";
  }

  async play(channel: string, platform: Platform): Promise<void> {
    // Resolve the stream URL via streamlink
    const streamUrl = getStreamUrl(channel, platform);
    const url = await this.resolveStreamUrl(streamUrl);

    // Kill any existing mpv process
    await this.stop();

    // Clean up stale socket
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(this.socketPath);
    } catch {
      // doesn't exist, fine
    }

    // Store URL for video window
    this.currentStreamUrl = url;

    // Start mpv in headless audio-only mode with IPC socket
    const { spawn } = await import("node:child_process");
    this.mpvProcess = spawn(
      "mpv",
      [
        "--no-video",
        `--input-ipc-server=${this.socketPath}`,
        "--really-quiet",
        url,
      ],
      {
        stdio: "ignore",
      }
    );

    // Wait for mpv socket to appear (up to 5 seconds)
    const { existsSync } = await import("node:fs");
    for (let i = 0; i < 50; i++) {
      if (existsSync(this.socketPath)) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private async resolveStreamUrl(streamUrl: string): Promise<string> {
    try {
      const { stdout } = await exec(`streamlink --stream-url "${streamUrl}" best`, {
        timeout: 15000,
      });
      return stdout.trim();
    } catch (err) {
      // Try with "audio_only" quality for audio-focused streams
      try {
        const { stdout } = await exec(`streamlink --stream-url "${streamUrl}" audio_only`, {
          timeout: 15000,
        });
        return stdout.trim();
      } catch {
        throw new Error(
          `Could not resolve stream URL for "${streamUrl}". ` +
            `Make sure streamlink is installed (brew install streamlink) and the channel is live.`
        );
      }
    }
  }

  async pause(): Promise<void> {
    await this.sendMpvCommand("set_property", "pause", true);
  }

  async resume(): Promise<void> {
    await this.sendMpvCommand("set_property", "pause", false);
  }

  async mute(): Promise<void> {
    await this.sendMpvCommand("set_property", "mute", true);
  }

  async unmute(): Promise<void> {
    await this.sendMpvCommand("set_property", "mute", false);
  }

  async setVolume(level: number): Promise<void> {
    await this.sendMpvCommand("set_property", "volume", Math.max(0, Math.min(100, level)));
  }

  async getElapsed(): Promise<number> {
    try {
      const result = await this.sendMpvCommand("get_property", "time-pos");
      return typeof result === "number" ? result : 0;
    } catch {
      return 0;
    }
  }

  async toggleVideo(channel: string, platform: Platform): Promise<void> {
    if (this.videoProcess) {
      // Close video window
      try {
        this.videoProcess.kill("SIGTERM");
      } catch {
        // already dead
      }
      this.videoProcess = null;
      return;
    }

    // Open video window — resolve URL if we don't have one
    let url = this.currentStreamUrl;
    if (!url) {
      const streamUrl = getStreamUrl(channel, platform);
      url = await this.resolveStreamUrl(streamUrl);
    }

    const { spawn } = await import("node:child_process");
    this.videoProcess = spawn(
      "mpv",
      [
        url,
        "--no-audio",
        "--no-border",
        "--ontop",
        "--geometry=400x250+50+50",
        "--title=claude-cast",
        "--really-quiet",
        "--no-input-default-bindings",
        "--macos-app-activation-policy=accessory",
      ],
      {
        stdio: "ignore",
      }
    );

    this.videoProcess.on("exit", () => {
      this.videoProcess = null;
    });
  }

  isVideoOpen(): boolean {
    return this.videoProcess !== null;
  }

  async stop(): Promise<void> {
    try {
      await this.sendMpvCommand("quit");
    } catch {
      // mpv may already be dead
    }

    if (this.mpvProcess) {
      try {
        this.mpvProcess.kill("SIGTERM");
      } catch {
        // already dead
      }
      this.mpvProcess = null;
    }

    // Kill video window
    if (this.videoProcess) {
      try {
        this.videoProcess.kill("SIGTERM");
      } catch {
        // already dead
      }
      this.videoProcess = null;
    }

    this.currentStreamUrl = null;

    // Clean up socket
    try {
      const { unlinkSync } = await import("node:fs");
      unlinkSync(this.socketPath);
    } catch {
      // socket may not exist
    }
  }

  private async sendMpvCommand(...args: unknown[]): Promise<unknown> {
    const { connect } = await import("node:net");

    return new Promise((resolve, reject) => {
      const socket = connect(this.socketPath);
      const command = JSON.stringify({ command: args }) + "\n";

      let data = "";

      socket.on("connect", () => {
        socket.write(command);
      });

      socket.on("data", (chunk) => {
        data += chunk.toString();
        const lines = data.split("\n");
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if ("error" in parsed && parsed.error === "success") {
              socket.end();
              resolve(parsed.data);
              return;
            }
            if ("error" in parsed) {
              socket.end();
              reject(new Error(parsed.error));
              return;
            }
          } catch {
            // partial line, keep reading
          }
        }
      });

      socket.on("error", (err) => {
        reject(err);
      });

      socket.setTimeout(3000, () => {
        socket.destroy();
        reject(new Error("mpv IPC timeout"));
      });
    });
  }
}
