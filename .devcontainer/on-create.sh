#!/usr/bin/env bash
# Runs as onCreateCommand: once per container creation (first build and every
# rebuild), and it finishes before VS Code starts extensions or anyone can run
# an agent. setup.sh runs later, in postCreateCommand.
set -euo pipefail

# Docker creates fresh volume mount points owned by root, so hand them to the
# container user.
for d in "$HOME/.claude" "$HOME/.codex" "$HOME/.gemini"; do
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
# CLAUDE_CONFIG_DIR), and keeps full copies of that file in backups/. Drop just
# that field everywhere and keep the rest.
python3 - "$HOME/.claude" <<'PY' || echo "on-create: could not check Claude's settings for an API key" >&2
import glob, json, os, sys
config = sys.argv[1]
paths = [os.path.join(config, ".claude.json")]
paths += glob.glob(os.path.join(config, ".claude.json.backup*"))
paths += glob.glob(os.path.join(config, "backups", ".claude.json.backup*"))
for path in paths:
    try:
        with open(path) as f:
            text = f.read()
        if "primaryApiKey" not in text:
            continue
        try:
            data = json.loads(text)
        except ValueError:
            data = None
        if not isinstance(data, dict):
            # A backup that won't parse (say, a cut-off write) is only a copy,
            # so delete it rather than leave a key in it. Leave a broken main
            # file alone; Claude Code reports that one itself.
            if path != paths[0]:
                os.remove(path)
            continue
        data.pop("primaryApiKey", None)
        tmp = path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, indent=2)
        os.chmod(tmp, os.stat(path).st_mode & 0o777)
        os.replace(tmp, path)
    except OSError as e:
        print(f"on-create: could not check {path}: {e}", file=sys.stderr)
PY
