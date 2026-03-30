# Contributing to claude-cast

Thanks for your interest in contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/claude-cast`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

### Prerequisites

- Bun (latest)
- mpv (`brew install mpv`)
- streamlink (`brew install streamlink`)
- tmux (`brew install tmux`)

### Running locally

```bash
# Start the MCP server in dev mode (watches for changes)
bun run --cwd packages/stream-server dev

# Start the TUI in dev mode
bun run --cwd packages/stream-tui dev

# Run all packages in dev mode
bun run dev
```

### Project Layout

| Package | What it does | When to edit |
|---------|-------------|--------------|
| `packages/stream-server` | MCP server, player engine, chat engines | Adding platforms, tools, backend logic |
| `packages/stream-tui` | Blessed TUI, layouts, widgets | Changing the player UI, adding layouts |
| `packages/shared` | Types, IPC protocol | Changing state shape, IPC messages |
| `skills/` | Slash command definitions | Changing command UX |
| `hooks/` | Session lifecycle | Changing cleanup behavior |

### Adding a new streaming platform

1. Create `packages/stream-server/chat-{platform}.ts` implementing the `ChatEngine` interface
2. Add platform detection to `PlayerEngine.detectPlatform()` in `player-engine.ts`
3. Register the chat engine in `chat-engine.ts` factory
4. Test with a live stream on that platform
5. Update the README platforms list

### Adding a new layout mode

1. Create `packages/stream-tui/layouts/{name}.ts`
2. Add the mode to `LayoutMode` type in `packages/shared/types.ts`
3. Register in the layout manager in `packages/stream-tui/main.ts`
4. Update the `l` hotkey cycle order

## Code Style

- TypeScript strict mode
- No `any` types
- Bun test for testing
- Biome for linting and formatting

## Pull Requests

- One feature per PR
- Include a description of what changed and why
- Add tests for new functionality
- Update the README if you add commands or features
- Keep PRs focused and small when possible

## Reporting Bugs

Open an issue with:

- Claude Code version
- OS and terminal app
- Steps to reproduce
- Expected vs actual behavior

## Feature Requests

Open an issue tagged `enhancement` with:

- What you want to do
- Why it would be useful
- Any implementation ideas
