import blessed from "neo-blessed";
import type { ChatMessage } from "@claude-cast/shared";

export function createChatPanel(
  parent: blessed.Widgets.Screen,
  options: {
    top: number | string;
    height: number | string;
    border?: boolean;
  }
): {
  element: blessed.Widgets.BoxElement;
  update: (messages: ChatMessage[], visible: boolean) => void;
} {
  const box = blessed.box({
    parent,
    top: options.top,
    left: 0,
    width: "100%",
    height: options.height,
    border: options.border ? { type: "line" } : undefined,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    mouse: true,
    scrollbar: {
      style: { bg: "grey" },
    },
    style: {
      border: options.border ? { fg: "grey" } : undefined,
    },
    label: options.border ? " Chat " : undefined,
    padding: { left: 1, right: 1 },
  });

  function update(messages: ChatMessage[], visible: boolean): void {
    if (!visible) {
      box.hide();
      return;
    }
    box.show();

    // Get visible height
    const innerHeight =
      (box.height as number) - (options.border ? 2 : 0);
    const visibleMessages = messages.slice(-innerHeight);

    const lines = visibleMessages.map((msg) => {
      const badgeStr = formatBadges(msg.badges);
      const userColor = cssColorToBlessed(msg.color);
      return `${badgeStr}{${userColor}-fg}${msg.user}{/}: ${escapeContent(msg.text)}`;
    });

    box.setContent(lines.join("\n"));
    box.setScrollPerc(100); // auto-scroll to bottom
  }

  return { element: box, update };
}

function formatBadges(badges?: string[]): string {
  if (!badges || badges.length === 0) return "";
  const icons: Record<string, string> = {
    broadcaster: "{red-fg}\u2605{/red-fg}",
    moderator: "{green-fg}\u2694{/green-fg}",
    mod: "{green-fg}\u2694{/green-fg}",
    vip: "{magenta-fg}\u2666{/magenta-fg}",
    subscriber: "{blue-fg}\u2665{/blue-fg}",
    owner: "{red-fg}\u2605{/red-fg}",
  };
  const badgeIcons = badges.map((b) => icons[b] || "").filter(Boolean);
  return badgeIcons.length > 0 ? badgeIcons.join("") + " " : "";
}

function cssColorToBlessed(color: string): string {
  // Map common CSS colors to blessed color names
  // For HSL/hex, approximate to nearest blessed color
  if (color.startsWith("#") || color.startsWith("hsl")) {
    // Simple hue-based approximation
    const hue = extractHue(color);
    if (hue < 30) return "red";
    if (hue < 60) return "yellow";
    if (hue < 150) return "green";
    if (hue < 210) return "cyan";
    if (hue < 270) return "blue";
    if (hue < 330) return "magenta";
    return "red";
  }
  return "white";
}

function extractHue(color: string): number {
  const hslMatch = color.match(/hsl\((\d+)/);
  if (hslMatch) return parseInt(hslMatch[1]);
  return 0;
}

function escapeContent(text: string): string {
  // Escape blessed tags in user content
  return text.replace(/\{/g, "\\{").replace(/\}/g, "\\}");
}
