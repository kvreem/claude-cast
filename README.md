<div align="center">
  <img src=".github/assets/banner.png" width="100%" alt="claude-cast" />

  <h1>claude-cast</h1>
  <p>Stream Twitch, YouTube, and Kick right inside Claude Code.</p>

  <a href="#quick-start">Quick Start</a> ·
  <a href="#features">Features</a> ·
  <a href="#commands">Commands</a> ·
  <a href="https://github.com/kareem/claude-cast/issues">Issues</a>
</div>

---

## Quick Start

Install the plugin in Claude Code:

```
/plugin install claude-cast
```

Start a stream:

```
/claude-cast shroud
```

That's it. Audio plays. Chat scrolls. Code continues.

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
┌─ Terminal (tmux) ─────────────────────────────────┐
│                                                    │
│  Claude Code          │  claude-cast TUI           │
│  (your work)          │  (player + chat)           │
│                       │                            │
└───────────────────────┴────────────────────────────┘
         │                        │
         │ MCP (stdio)            │ IPC (unix socket)
         ▼                        │
    stream-server ◄───────────────┘
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
| IPC | Unix socket + ndjson |
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

- Claude Code (latest)
- macOS or Linux
- mpv — `brew install mpv`
- streamlink — `brew install streamlink`
- tmux — auto-installed on first run

---

## Configuration

Run `/claude-cast:configure` to set:

- **Default layout** — compact, rich, or minimal
- **Default volume** — 0-100
- **Tmux pane width** — columns (default: 40)
- **YouTube API key** — required for YouTube chat
- **Twitch Client ID** — optional, for richer stream metadata

Config stored at `~/.claude/channels/claude-cast/config.json`.

---

## Contributing

We welcome contributions. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Development setup:**

```bash
git clone https://github.com/kareem/claude-cast
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

MIT
