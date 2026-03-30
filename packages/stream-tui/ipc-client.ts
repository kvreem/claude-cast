import { createConnection, type Socket } from "node:net";
import { join } from "node:path";
import { homedir } from "node:os";
import { serialize, deserialize } from "@claude-cast/shared";
import type { ServerMessage, TuiMessage } from "@claude-cast/shared";

const IPC_SOCKET = join(homedir(), ".claude", "channels", "claude-cast", "tui.sock");

export class IpcClient {
  private socket: Socket | null = null;
  private messageHandlers: Array<(msg: ServerMessage) => void> = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    this.socket = createConnection(IPC_SOCKET);

    let buffer = "";

    this.socket.on("data", (data) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const msg = deserialize(line) as ServerMessage | null;
        if (msg) {
          for (const handler of this.messageHandlers) {
            handler(msg);
          }
        }
      }
    });

    this.socket.on("error", () => {
      this.scheduleReconnect();
    });

    this.socket.on("close", () => {
      this.socket = null;
      this.scheduleReconnect();
    });
  }

  send(msg: TuiMessage): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(serialize(msg));
    }
  }

  onMessage(handler: (msg: ServerMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.destroy();
    this.socket = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }
}
