import type blessed from "neo-blessed";
import type { StreamState, ChatMessage } from "@claude-cast/shared";
import { createPlayerPanel } from "../widgets/player-panel";
import { createChatPanel } from "../widgets/chat-panel";
import { createControlsBar } from "../widgets/controls-bar";

export function createCompactLayout() {
  let playerPanel: ReturnType<typeof createPlayerPanel> | null = null;
  let chatPanel: ReturnType<typeof createChatPanel> | null = null;
  let controlsBar: ReturnType<typeof createControlsBar> | null = null;
  let separator: blessed.Widgets.BoxElement | null = null;
  let separator2: blessed.Widgets.BoxElement | null = null;
  let screen: blessed.Widgets.Screen | null = null;

  return {
    render(
      scr: blessed.Widgets.Screen,
      state: StreamState,
      chat: ChatMessage[]
    ): void {
      if (!screen) {
        screen = scr;
        const blessed = require("neo-blessed");

        // Title bar
        const titleBar = blessed.box({
          parent: scr,
          top: 0,
          left: 0,
          width: "100%",
          height: 1,
          content: " claude-cast ",
          style: { fg: "white", bg: "blue", bold: true },
        });

        // Player panel: 2 lines at top (after title)
        playerPanel = createPlayerPanel(scr, { top: 1, height: 2 });

        // Separator
        separator = blessed.box({
          parent: scr,
          top: 3,
          left: 0,
          width: "100%",
          height: 1,
          content: "\u2500".repeat(80),
          style: { fg: "grey" },
        });

        // Chat panel: fills middle
        chatPanel = createChatPanel(scr, {
          top: 4,
          height: "100%-8",
          border: false,
        });

        // Separator
        separator2 = blessed.box({
          parent: scr,
          bottom: 2,
          left: 0,
          width: "100%",
          height: 1,
          content: "\u2500".repeat(80),
          style: { fg: "grey" },
        });

        // Controls bar at bottom
        controlsBar = createControlsBar(scr, { bottom: 0 });
      }

      playerPanel?.update(state);
      chatPanel?.update(chat, state.chatVisible);
    },

    destroy(): void {
      if (screen) {
        // Remove all children and re-render
        while (screen.children.length > 0) {
          screen.children[0].detach();
        }
      }
      screen = null;
      playerPanel = null;
      chatPanel = null;
      controlsBar = null;
      separator = null;
      separator2 = null;
    },
  };
}
