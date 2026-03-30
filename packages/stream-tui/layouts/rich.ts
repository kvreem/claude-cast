import type blessed from "neo-blessed";
import type { StreamState, ChatMessage } from "@claude-cast/shared";
import { createRichPlayerPanel } from "../widgets/player-panel";
import { createChatPanel } from "../widgets/chat-panel";
import { createControlsBar } from "../widgets/controls-bar";

export function createRichLayout() {
  let playerPanel: ReturnType<typeof createRichPlayerPanel> | null = null;
  let chatPanel: ReturnType<typeof createChatPanel> | null = null;
  let controlsBar: ReturnType<typeof createControlsBar> | null = null;
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
        blessed.box({
          parent: scr,
          top: 0,
          left: 0,
          width: "100%",
          height: 1,
          content: " claude-cast ",
          style: { fg: "white", bg: "blue", bold: true },
        });

        // Rich player panel with border: 8 lines
        playerPanel = createRichPlayerPanel(scr, { top: 1, height: 8 });

        // Chat panel with border: fills remaining
        chatPanel = createChatPanel(scr, {
          top: 9,
          height: "100%-13",
          border: true,
        });

        // Controls bar at bottom
        controlsBar = createControlsBar(scr, { bottom: 0 });
      }

      playerPanel?.update(state);
      chatPanel?.update(chat, state.chatVisible);
    },

    destroy(): void {
      if (screen) {
        while (screen.children.length > 0) {
          screen.children[0].detach();
        }
      }
      screen = null;
      playerPanel = null;
      chatPanel = null;
      controlsBar = null;
    },
  };
}
