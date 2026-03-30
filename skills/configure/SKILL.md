---
name: configure
description: Configure claude-cast settings including API keys, default layout, volume, and pane width.
user-invocable: true
argument-hint: [show | set <key> <value>]
allowed-tools:
  - mcp__claude-cast__cast_status
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/check-deps.sh)
---

# /claude-cast:configure — Settings

Configure claude-cast preferences and API keys.

Arguments: $ARGUMENTS

## Available settings

| Setting | Description | Default |
|---------|-------------|---------|
| `layout` | Default layout mode: `compact`, `rich`, or `minimal` | `compact` |
| `volume` | Default volume (0-100) | `75` |
| `pane-width` | Tmux pane width in columns | `40` |
| `twitch-client-id` | Twitch Client ID for richer metadata (optional) | none |
| `youtube-api-key` | YouTube Data API key for chat (required for YouTube chat) | none |

## Usage

Show current config:
```
/claude-cast:configure show
```

Set a value:
```
/claude-cast:configure set layout rich
/claude-cast:configure set volume 50
/claude-cast:configure set youtube-api-key AIza...
```

Config is stored at `~/.claude/channels/claude-cast/config.json`.
