#!/bin/bash
# Clean up claude-cast processes and sockets on session end

STATE_DIR="$HOME/.claude/channels/claude-cast"

# Kill mpv if running with our socket
if [ -S "$STATE_DIR/mpv.sock" ]; then
  echo '{"command":["quit"]}' | socat - UNIX-CONNECT:"$STATE_DIR/mpv.sock" 2>/dev/null
  rm -f "$STATE_DIR/mpv.sock"
fi

# Kill TUI tmux pane if it exists
if command -v tmux &>/dev/null && [ -n "$TMUX" ]; then
  tmux list-panes -F '#{pane_id} #{pane_title}' 2>/dev/null | \
    grep -i "claude-cast" | \
    awk '{print $1}' | \
    xargs -I{} tmux kill-pane -t {} 2>/dev/null
fi

# Clean up IPC socket
rm -f "$STATE_DIR/tui.sock"

# Reset state to idle
if [ -f "$STATE_DIR/state.json" ]; then
  echo '{"status":"idle","channel":null,"platform":null,"volume":75,"muted":false,"tuiVisible":false,"chatVisible":true,"layout":"compact","streamTitle":null,"viewerCount":null,"elapsed":0,"error":null}' > "$STATE_DIR/state.json"
fi
