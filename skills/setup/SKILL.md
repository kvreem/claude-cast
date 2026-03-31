---
name: setup
description: Set up claude-cast by installing all required dependencies (mpv, streamlink, tmux) and verifying the installation.
user-invocable: true
argument-hint: [check]
allowed-tools:
  - Bash
---

# /claude-cast:setup — Install Dependencies

Set up claude-cast by installing all required dependencies.

Arguments: $ARGUMENTS

## Steps

### 1. Check what's already installed

Run each check:

```bash
command -v mpv && mpv --version | head -1 || echo "MISSING: mpv"
command -v streamlink && streamlink --version || echo "MISSING: streamlink"
command -v tmux && tmux -V || echo "MISSING: tmux"
command -v bun && bun --version || echo "MISSING: bun"
```

### 2. Install missing dependencies

For each missing dependency on macOS:

```bash
# If mpv is missing:
brew install mpv

# If streamlink is missing:
brew install streamlink

# If tmux is missing:
brew install tmux
```

For Linux:
```bash
# Debian/Ubuntu
sudo apt install mpv streamlink tmux

# Fedora
sudo dnf install mpv streamlink tmux
```

### 3. Verify installation

After installing, run all checks again to confirm everything works:

```bash
mpv --version | head -1
streamlink --version
tmux -V
```

### 4. Confirm success

If all dependencies are installed, tell the user:

"claude-cast is ready. Start a tmux session and launch Claude Code:

```
tmux new-session -s dev
claude
```

Then stream:

```
/claude-cast shroud
```
"

### If `$ARGUMENTS` is "check"

Only run the checks in step 1 without installing anything. Report what's installed and what's missing.
