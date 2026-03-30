#!/bin/bash
# Auto-install tmux based on platform

if command -v tmux &>/dev/null; then
  echo "tmux is already installed."
  exit 0
fi

if [ "$(uname)" = "Darwin" ]; then
  if command -v brew &>/dev/null; then
    echo "Installing tmux via Homebrew..."
    brew install tmux
  else
    echo "ERROR: Homebrew is required to install tmux on macOS."
    echo "Install Homebrew: https://brew.sh"
    exit 1
  fi
elif [ -f /etc/debian_version ]; then
  echo "Installing tmux via apt..."
  sudo apt update && sudo apt install -y tmux
elif [ -f /etc/redhat-release ]; then
  echo "Installing tmux via yum..."
  sudo yum install -y tmux
else
  echo "ERROR: Could not detect package manager. Install tmux manually."
  exit 1
fi

if command -v tmux &>/dev/null; then
  echo "tmux installed successfully."
else
  echo "ERROR: tmux installation failed."
  exit 1
fi
