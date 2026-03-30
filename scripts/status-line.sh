#!/bin/bash
# claude-cast status line — animated audio visualizer + stream info

STATE_FILE="$HOME/.claude/channels/claude-cast/state.json"

if [ ! -f "$STATE_FILE" ]; then
  exit 0
fi

STATUS=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ "$STATUS" = "idle" ] || [ -z "$STATUS" ]; then
  exit 0
fi

CHANNEL=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"channel":"[^"]*"' | head -1 | cut -d'"' -f4)
PLATFORM=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"platform":"[^"]*"' | head -1 | cut -d'"' -f4)
VOLUME=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"volume":[0-9]*' | head -1 | cut -d':' -f2)
MUTED=$(cat "$STATE_FILE" 2>/dev/null | grep -o '"muted":true' | head -1)

# Platform label
case "$PLATFORM" in
  twitch) PLAT="Twitch" ;;
  youtube) PLAT="YouTube" ;;
  kick) PLAT="Kick" ;;
  *) PLAT="$PLATFORM" ;;
esac

# Volume display
if [ -n "$MUTED" ]; then
  VOL="MUTE"
else
  VOL="${VOLUME}%"
fi

# Animated audio waveform — cycles through 8 frames based on current second
if [ "$STATUS" = "playing" ]; then
  WAVES=(
    "▁▃▅▇▅▃▁▂▅▇▆▃"
    "▂▅▇▆▃▁▂▃▇█▇▅"
    "▃▇█▇▅▂▁▃▅▇▅▂"
    "▅▆▇▅▃▁▃▅▇█▇▃"
    "▇█▇▃▁▂▅▇▆▅▃▁"
    "▆▇▅▂▃▅▇█▇▅▂▃"
    "▃▅▃▁▅▇█▇▅▃▁▂"
    "▁▃▅▇█▇▅▃▂▁▃▅"
  )
  FRAME=$(($(date +%s) % 8))
  WAVE="${WAVES[$FRAME]}"
  printf '\033[36m%s\033[0m \033[1m%s\033[0m on %s · %s\n' "$WAVE" "$CHANNEL" "$PLAT" "$VOL"
elif [ "$STATUS" = "paused" ]; then
  # Static flat bars when paused
  printf '\033[33m▃▃▃▃▃▃▃▃▃▃▃▃\033[0m \033[1m%s\033[0m on %s · ⏸ %s\n' "$CHANNEL" "$PLAT" "$VOL"
elif [ "$STATUS" = "connecting" ]; then
  DOTS=(
    "▁▁▁▃▅▇▅▃▁▁▁▁"
    "▁▁▁▁▃▅▇▅▃▁▁▁"
    "▁▁▁▁▁▃▅▇▅▃▁▁"
    "▁▁▁▁▁▁▃▅▇▅▃▁"
  )
  FRAME=$(($(date +%s) % 4))
  printf '\033[33m%s\033[0m Connecting to %s...\n' "${DOTS[$FRAME]}" "$CHANNEL"
else
  printf '\033[31m■\033[0m %s · Error\n' "$CHANNEL"
fi
