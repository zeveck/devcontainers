#!/usr/bin/env bash
# Runs as onCreateCommand: once per container creation (first build and every
# rebuild), and it finishes before VS Code starts extensions or anyone can run
# an agent. setup.sh runs later, in postCreateCommand.
set -euo pipefail

# Docker creates fresh volume mount points (and a missing ~/.config) owned by
# root, so hand them to the container user.
for d in "$HOME/.config" "$HOME/.claude" "$HOME/.codex" "$HOME/.gemini"; do
  sudo mkdir -p "$d"
  sudo chown "$(id -u):$(id -g)" "$d"
done

# The agent folders persist across rebuilds in Docker volumes (history,
# memory, settings, plugins), but sign-ins should not. Delete the login files
# so each rebuild starts signed out. File names come from each tool's docs and
# source as of 2026-10; a file a later version adds would simply persist.
rm -f \
  "$HOME/.claude/.credentials.json" \
  "$HOME/.codex/auth.json" \
  "$HOME/.codex/.credentials.json" \
  "$HOME/.gemini/oauth_creds.json" \
  "$HOME/.gemini/google_accounts.json" \
  "$HOME/.gemini/gemini-credentials.json" \
  "$HOME/.gemini/mcp-oauth-tokens.json" \
  "$HOME/.gemini/a2a-oauth-tokens.json"

# Claude Code can keep a legacy API key in .claude.json (inside ~/.claude via
# CLAUDE_CONFIG_DIR). Drop just that field and keep the rest of the file.
claude_json="$HOME/.claude/.claude.json"
if [ -f "$claude_json" ]; then
  python3 - "$claude_json" <<'PY' || echo "on-create: could not check $claude_json for an API key" >&2
import json, os, sys
path = sys.argv[1]
with open(path) as f:
    data = json.load(f)
if isinstance(data, dict) and "primaryApiKey" in data:
    del data["primaryApiKey"]
    tmp = path + ".tmp"
    with open(tmp, "w") as f:
        json.dump(data, f, indent=2)
    os.chmod(tmp, os.stat(path).st_mode & 0o777)
    os.replace(tmp, path)
PY
fi
