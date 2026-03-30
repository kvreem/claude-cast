#!/bin/bash
# Check for required external dependencies

MISSING=()
INSTALL_CMDS=()

if ! command -v mpv &>/dev/null; then
  MISSING+=("mpv")
  INSTALL_CMDS+=("brew install mpv")
fi

if ! command -v streamlink &>/dev/null; then
  MISSING+=("streamlink")
  INSTALL_CMDS+=("brew install streamlink")
fi

if ! command -v tmux &>/dev/null; then
  MISSING+=("tmux")
  INSTALL_CMDS+=("brew install tmux")
fi

if ! command -v bun &>/dev/null; then
  MISSING+=("bun")
  INSTALL_CMDS+=("curl -fsSL https://bun.sh/install | bash")
fi

if [ ${#MISSING[@]} -eq 0 ]; then
  echo "ALL_DEPS_OK"
  exit 0
fi

echo "MISSING_DEPS=${MISSING[*]}"
echo ""
echo "Install missing dependencies:"
for cmd in "${INSTALL_CMDS[@]}"; do
  echo "  $cmd"
done
exit 1
