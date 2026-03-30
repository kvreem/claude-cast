---
name: stream
description: Control a live stream player. Stream Twitch, YouTube, or Kick alongside your code. Triggers on "stream", "watch", "tune in", "twitch", "youtube", "kick", "listen to".
user-invocable: true
argument-hint: <channel> [twitch|youtube|kick] | pause | play | mute | unmute | volume <0-100> | hide-chat | show-chat | hide-player | show-player | layout <mode> | stop | status
allowed-tools:
  - mcp__claude-cast__cast_play
  - mcp__claude-cast__cast_pause
  - mcp__claude-cast__cast_resume
  - mcp__claude-cast__cast_stop
  - mcp__claude-cast__cast_mute
  - mcp__claude-cast__cast_unmute
  - mcp__claude-cast__cast_volume
  - mcp__claude-cast__cast_status
  - mcp__claude-cast__cast_show_tui
  - mcp__claude-cast__cast_hide_tui
  - mcp__claude-cast__cast_chat_mode
  - mcp__claude-cast__cast_layout
  - Bash(${CLAUDE_PLUGIN_ROOT}/scripts/check-deps.sh)
---

# /claude-cast — Live Stream Player

Stream Twitch, YouTube, and Kick alongside your Claude Code session. Audio plays via mpv. Chat and player status display in a tmux side pane.

Arguments: $ARGUMENTS

---

## Dispatch on arguments

### No arguments or `status`
Call `cast_status` and display the current state.

### `<channel_name>` or URL — Start streaming
1. Call `cast_play` with the channel name or URL. Platform is auto-detected:
   - Bare name (e.g., `shroud`) → Twitch
   - `youtube.com/...` or `youtu.be/...` → YouTube
   - `kick.com/...` → Kick
   - If a second word is a platform name (e.g., `/claude-cast xqc kick`), pass it as the `platform` parameter to force that platform.
2. Call `cast_show_tui` to open the player pane.
3. Confirm: "Now streaming {channel} on {platform}. Audio playing. Player pane open."

### `pause`
Call `cast_pause`. Confirm paused.

### `play` or `resume`
Call `cast_resume`. Confirm playing.

### `mute`
Call `cast_mute`. Confirm muted.

### `unmute`
Call `cast_unmute`. Confirm unmuted.

### `volume <level>`
Call `cast_volume` with the level (0-100). Confirm new volume.

### `hide-chat`
Call `cast_chat_mode` with `visible: false`. Confirm chat hidden.

### `show-chat`
Call `cast_chat_mode` with `visible: true`. Confirm chat visible.

### `hide-player`
Call `cast_hide_tui`. Confirm pane closed (audio continues).

### `show-player`
Call `cast_show_tui`. Confirm pane opened.

### `layout <mode>`
Call `cast_layout` with the mode (`compact`, `rich`, or `minimal`). Confirm layout changed.

### `stop`
Call `cast_stop`. Confirm everything stopped and cleaned up.

### First-time setup
If any tool returns a dependency error, run the dependency check script and guide the user through installing missing dependencies (mpv, streamlink, tmux).
