<div align="center">

```
▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃

 ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗       ██████╗ █████╗ ███████╗████████╗
██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝      ██╔════╝██╔══██╗██╔════╝╚══██╔══╝
██║     ██║     ███████║██║   ██║██║  ██║█████╗  █████╗██║     ███████║███████╗   ██║
██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝  ╚════╝██║     ██╔══██║╚════██║   ██║
╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗      ╚██████╗██║  ██║███████║   ██║
 ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝       ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝

▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃▁▃▅▇█▇▅▃▁▂▅▇▆▃
```

  <h3>Stream Twitch, YouTube, and Kick right inside Claude Code.</h3>

  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#commands">Commands</a> ·
  <a href="https://github.com/kvreem/claude-cast/issues">Issues</a>
</div>

---

## Setup

### 1. Install dependencies

```bash
brew install mpv streamlink tmux
```

### 2. Start a tmux session

claude-cast runs as a side pane in tmux. Start tmux first, then launch Claude Code inside it.

```bash
tmux new-session -s dev
claude
```

### 3. Install the plugin

```
/plugin install claude-cast
```

### 4. Start a stream

```bash
# Twitch — just the channel name
/claude-cast shroud

# Twitch — full URL works too
/claude-cast https://www.twitch.tv/swagg

# Kick
/claude-cast kick.com/myrongainesx

# YouTube
/claude-cast https://www.youtube.com/live/dQw4w9WgXcQ

# Force a platform
/claude-cast xqc kick
```

Audio plays. Chat scrolls. Code continues.

---

## Features

**Multi-Platform Streaming**<br/>
Twitch, YouTube, and Kick. Auto-detects the platform from the channel name or URL. Powered by streamlink + mpv.

**Live Chat**<br/>
Real-time chat alongside your code. Twitch IRC (zero-config), YouTube Data API, and Kick WebSocket. Colored usernames and badges.

**Three Layout Modes**<br/>
Switch between compact, rich, and minimal layouts to match your workflow. Cycle with `l` or `/claude-cast layout <mode>`.

```
compact — max chat, minimal player chrome (default)
rich    — full player with volume bar and elapsed time
minimal — single-line player, maximum chat density
```

**Non-Blocking Tmux Pane**<br/>
Player opens as a side pane in your terminal via tmux. Your Claude Code session stays untouched. Auto-installs tmux if needed.

**Full Keyboard Control**<br/>
Control everything without leaving your terminal.

```
p — pause / play          m — mute / unmute
c — toggle chat           l — cycle layout
↑↓ — volume               q — hide player (audio continues)
Q — stop everything
```

**Slash Command Control**<br/>
Every action available as a Claude Code command for AI-assisted control.

---

## Commands

```
/claude-cast <channel>        Start streaming (auto-detect platform)
/claude-cast pause            Pause audio
/claude-cast play             Resume audio
/claude-cast mute             Mute audio
/claude-cast unmute           Unmute audio
/claude-cast volume <0-100>   Set volume
/claude-cast hide-chat        Hide chat panel
/claude-cast show-chat        Show chat panel
/claude-cast hide-player      Close TUI (audio continues)
/claude-cast show-player      Open TUI
/claude-cast layout <mode>    Switch layout (compact|rich|minimal)
/claude-cast stop             Stop everything
/claude-cast status           Current state
/claude-cast:configure        API keys and preferences
```

---

## Architecture

```
┌─ Terminal (tmux) ──────────────────────────────────────┐
│                                                        │
│  Claude Code             │  claude-cast TUI            │
│  (your work)             │  (player + chat)            │
│                          │                             │
│  > /claude-cast swagg    │  ▶ swagg  ▁▃▅▇█▇▅▃ Vol:75% │
│  Now streaming swagg...  │  user1: nice play!          │
│                          │  user2: GG                  │
│  > fixing bugs...        │  user3: lol                 │
│                          │                             │
└──────────────────────────┴─────────────────────────────┘
         │                          │
         │ MCP (stdio)              │ file-based IPC
         ▼                          │
    stream-server ◄─────────────────┘
      │       │
      ▼       ▼
    mpv    chat (IRC/WS/API)
```

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Bun |
| MCP Server | @modelcontextprotocol/sdk |
| TUI | neo-blessed |
| Audio | mpv + streamlink |
| Chat | Twitch IRC · YouTube API · Kick WebSocket |
| IPC | File-based state + ndjson |
| Monorepo | Bun workspaces |

---

## Project Structure

```
claude-cast/
├── packages/
│   ├── stream-server/    MCP server, player engine, chat engines
│   ├── stream-tui/       Blessed TUI with layouts and widgets
│   └── shared/           Types, IPC protocol, platform detection
├── skills/               Slash command definitions
├── hooks/                Session lifecycle hooks
└── scripts/              Dependency checks, tmux install
```

---

## Requirements

| Dependency | Install | Purpose |
|-----------|---------|---------|
| **Claude Code** | [claude.com/code](https://claude.com/code) | Plugin host |
| **tmux** | `brew install tmux` | Side pane for player + chat |
| **mpv** | `brew install mpv` | Audio playback |
| **streamlink** | `brew install streamlink` | Stream URL extraction |
| **Bun** | Required by Claude Code | Plugin runtime |

Supported on **macOS** and **Linux**.

---

## Configuration

Run `/claude-cast:configure` to set:

| Setting | Description | Default |
|---------|-------------|---------|
| `layout` | Default layout: `compact`, `rich`, or `minimal` | `compact` |
| `volume` | Default volume (0-100) | `75` |
| `pane-width` | Tmux pane width in columns | `40` |
| `youtube-api-key` | Required for YouTube chat | — |
| `twitch-client-id` | Optional, for richer stream metadata | — |

Config stored at `~/.claude/channels/claude-cast/config.json`.

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Development setup:**

```bash
git clone https://github.com/kvreem/claude-cast
cd claude-cast
bun install
bun run dev
```

**Before submitting:**

```bash
bun run typecheck    # Type checking
bun run lint         # Linting
bun test             # Run tests
```

---

## Repository Activity

![Alt](https://repobeats.axiom.co/api/embed/84913fd11b6764721df414bcf5a0f409d2c85729.svg "Repobeats analytics image")

---

## License

MIT License

Copyright (c) 2026 claude-cast contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
