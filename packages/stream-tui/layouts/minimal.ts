import type blessed from "neo-blessed";
import type { StreamState, ChatMessage } from "@claude-cast/shared";
import { createMinimalPlayerLine } from "../widgets/player-panel";
import { createChatPanel } from "../widgets/chat-panel";
import { createControlsBar } from "../widgets/controls-bar";

export function createMinimalLayout() {
  let playerLine: ReturnType<typeof createMinimalPlayerLine> | null = null;
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

        // Single-line player
        playerLine = createMinimalPlayerLine(scr, { top: 0 });

        // Separator
        separator = blessed.box({
          parent: scr,
          top: 1,
          left: 0,
          width: "100%",
          height: 1,
          content: "\u2500".repeat(80),
          style: { fg: "grey" },
        });

        // Chat fills almost everything
        chatPanel = createChatPanel(scr, {
          top: 2,
          height: "100%-5",
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

        // Compact controls
        controlsBar = createControlsBar(scr, { bottom: 0 });
      }

      playerLine?.update(state);
      chatPanel?.update(chat, state.chatVisible);
    },

    destroy(): void {
      if (screen) {
        while (screen.children.length > 0) {
          screen.children[0].detach();
        }
      }
      screen = null;
      playerLine = null;
      chatPanel = null;
      controlsBar = null;
      separator = null;
      separator2 = null;
    },
  };
}
