import blessed from "neo-blessed";
import type { StreamState } from "@claude-cast/shared";
import { getPlatformLabel } from "@claude-cast/shared";

// Animated waveform frames
const WAVE_FRAMES = [
  "\u2581\u2583\u2585\u2587\u2585\u2583\u2581\u2582\u2585\u2587\u2586\u2583",
  "\u2582\u2585\u2587\u2586\u2583\u2581\u2582\u2583\u2587\u2588\u2587\u2585",
  "\u2583\u2587\u2588\u2587\u2585\u2582\u2581\u2583\u2585\u2587\u2585\u2582",
  "\u2585\u2586\u2587\u2585\u2583\u2581\u2583\u2585\u2587\u2588\u2587\u2583",
  "\u2587\u2588\u2587\u2583\u2581\u2582\u2585\u2587\u2586\u2585\u2583\u2581",
  "\u2586\u2587\u2585\u2582\u2583\u2585\u2587\u2588\u2587\u2585\u2582\u2583",
  "\u2583\u2585\u2583\u2581\u2585\u2587\u2588\u2587\u2585\u2583\u2581\u2582",
  "\u2581\u2583\u2585\u2587\u2588\u2587\u2585\u2583\u2582\u2581\u2583\u2585",
];

const PAUSED_WAVE = "\u2583\u2583\u2583\u2583\u2583\u2583\u2583\u2583\u2583\u2583\u2583\u2583";

function getWaveFrame(): string {
  const frame = Math.floor(Date.now() / 200) % WAVE_FRAMES.length;
  return WAVE_FRAMES[frame];
}

export function createPlayerPanel(
  parent: blessed.Widgets.Screen,
  options: { top: number | string; height: number | string }
): {
  element: blessed.Widgets.BoxElement;
  update: (state: StreamState) => void;
} {
  const box = blessed.box({
    parent,
    top: options.top,
    left: 0,
    width: "100%",
    height: options.height,
    tags: true,
    padding: { left: 1, right: 1 },
  });

  function update(state: StreamState): void {
    const channel = state.channel || "No stream";
    const platform = state.platform ? getPlatformLabel(state.platform) : "";
    const vol = state.muted ? "{red-fg}MUTE{/red-fg}" : `Vol: ${state.volume}%`;

    let wave: string;
    let statusLabel: string;
    if (state.status === "playing") {
      wave = `{cyan-fg}${getWaveFrame()}{/cyan-fg}`;
      statusLabel = "{green-fg}\u25b6{/green-fg}";
    } else if (state.status === "paused") {
      wave = `{yellow-fg}${PAUSED_WAVE}{/yellow-fg}`;
      statusLabel = "{yellow-fg}\u23f8{/yellow-fg}";
    } else {
      wave = "";
      statusLabel = "{red-fg}\u25a0{/red-fg}";
    }

    const line1 = `${statusLabel} {bold}${channel}{/bold}  {cyan-fg}${platform}{/cyan-fg}  ${vol}`;
    const line2 = wave ? `${wave}  ${formatElapsed(state.elapsed)}` : "";

    box.setContent(line2 ? `${line1}\n${line2}` : line1);
  }

  return { element: box, update };
}

export function createRichPlayerPanel(
  parent: blessed.Widgets.Screen,
  options: { top: number | string; height: number | string }
): {
  element: blessed.Widgets.BoxElement;
  update: (state: StreamState) => void;
} {
  const box = blessed.box({
    parent,
    top: options.top,
    left: 0,
    width: "100%",
    height: options.height,
    border: { type: "line" },
    tags: true,
    padding: { left: 1, right: 1 },
    style: {
      border: { fg: "cyan" },
    },
  });

  function update(state: StreamState): void {
    const channel = state.channel || "No stream";
    const platform = state.platform ? getPlatformLabel(state.platform) : "";
    const title = state.streamTitle || "";
    const vol = state.volume;
    const volBar = "\u2588".repeat(Math.round(vol / 10)) + "\u2591".repeat(10 - Math.round(vol / 10));
    const volLabel = state.muted ? "{red-fg}MUTE{/red-fg}" : `Vol: ${vol}%`;
    const viewers = state.viewerCount !== null ? state.viewerCount.toLocaleString() : "";
    const elapsed = formatElapsed(state.elapsed);

    let statusIcon: string;
    let wave: string;
    if (state.status === "playing") {
      statusIcon = "{green-fg}\u25b6{/green-fg}";
      wave = `{cyan-fg}${getWaveFrame()}{/cyan-fg}`;
    } else if (state.status === "paused") {
      statusIcon = "{yellow-fg}\u23f8{/yellow-fg}";
      wave = `{yellow-fg}${PAUSED_WAVE}{/yellow-fg}`;
    } else {
      statusIcon = "{red-fg}\u25a0{/red-fg}";
      wave = "";
    }

    const lines = [
      `${statusIcon}  {bold}${channel}{/bold}`,
      title ? `{white-fg}${title}{/white-fg}` : null,
      `{cyan-fg}${platform}{/cyan-fg}${viewers ? ` \u00b7 \u{1f441} ${viewers}` : ""}`,
      "",
      wave,
      `${volBar}  ${volLabel}`,
      `${elapsed}`,
    ].filter((l) => l !== null);

    box.setContent(lines.join("\n"));
  }

  return { element: box, update };
}

export function createMinimalPlayerLine(
  parent: blessed.Widgets.Screen,
  options: { top: number | string }
): {
  element: blessed.Widgets.BoxElement;
  update: (state: StreamState) => void;
} {
  const box = blessed.box({
    parent,
    top: options.top,
    left: 0,
    width: "100%",
    height: 1,
    tags: true,
    padding: { left: 1, right: 1 },
  });

  function update(state: StreamState): void {
    const channel = state.channel || "idle";
    const vol = state.muted ? "MUTE" : `Vol: ${state.volume}%`;

    let icon: string;
    let wave: string;
    if (state.status === "playing") {
      icon = "{green-fg}\u25b6{/green-fg}";
      wave = `{cyan-fg}${getWaveFrame().slice(0, 6)}{/cyan-fg}`;
    } else if (state.status === "paused") {
      icon = "{yellow-fg}\u23f8{/yellow-fg}";
      wave = "";
    } else {
      icon = "{red-fg}\u25a0{/red-fg}";
      wave = "";
    }

    box.setContent(
      `${icon} {bold}${channel}{/bold} ${wave} Vol:${vol}`
    );
  }

  return { element: box, update };
}

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
