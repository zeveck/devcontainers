#!/usr/bin/env bash
set -euo pipefail

# Install Claude Code CLI (native installer).
echo "🤖 Installing Claude Code..."
curl -fsSL https://claude.ai/install.sh | bash
export PATH="$HOME/.local/bin:$PATH"

# ── npm registry (optional) ──────────────────────────────────────────────────
if [ -n "${NPM_REGISTRY:-}" ]; then
  echo "Configuring npm registry: $NPM_REGISTRY"
  npm config set registry "$NPM_REGISTRY"
fi

# Install GPT-5 Codex CLI.
echo "🧠 Installing GPT5 Codex..."
npm install -g @openai/codex@latest

# Install Gemini CLI.
echo "✨ Installing Gemini CLI..."
npm install -g @google/gemini-cli@latest

# Install Chromium with OS-level dependencies for Docker.
# playwright-cli install handles browser binaries but NOT OS deps (libgbm, libnss3, etc).
# We use chromium (not chrome) because Chrome lacks native ARM Linux builds,
# which breaks on Apple Silicon Macs running ARM containers.
# Remove Yarn repo with expired GPG key (from base image) to avoid apt failures.
echo "🎭 Installing Chromium with OS dependencies..."
sudo rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npx -y playwright@latest install --with-deps chromium

# Clean up any stale MCP config from previous setups.
echo "🧹 Cleaning up stale configs..."
rm -f .mcp.json
rm -f .playwright-mcp.json

# Install Playwright CLI globally.
echo "🔧 Installing Playwright CLI..."
npm install -g @playwright/cli@latest

# Write Playwright CLI config to the default discovery path (.playwright/cli.config.json).
# --no-sandbox is required because Chromium's sandbox needs CAP_SYS_ADMIN which Docker
# containers don't have; the container itself provides isolation.
# We write this BEFORE `playwright-cli install` so it finds our config and doesn't
# overwrite it with a default that lacks --no-sandbox.
echo "📝 Writing Playwright CLI config..."
mkdir -p .playwright
cat > .playwright/cli.config.json <<JSON
{
  "browser": {
    "browserName": "chromium",
    "launchOptions": {
      "headless": true,
      "args": ["--no-sandbox"]
    }
  },
  "outputDir": ".playwright/output"
}
JSON

# Initialize the workspace and install skills into .claude/skills/playwright-cli/.
# NOTE: as of @playwright/cli 0.1.14 (2026-06-10) `install` NO LONGER downloads the
# browser binary — that moved to the `install-browser` subcommand below. Older CLIs
# bundled it here, which is why pinning @latest silently broke once 0.1.14 shipped.
echo "📝 Initializing Playwright CLI workspace and installing skills..."
playwright-cli install --skills

# Download the Chromium binary the CLI needs (required on @playwright/cli >= 0.1.14).
# `install-browser` fetches the exact revision the CLI's bundled playwright-core wants,
# and is idempotent (a no-op when already present). We use chromium (not chrome)
# because it has native ARM Linux builds, so this works on Apple Silicon containers too.
echo "🌐 Installing the Chromium binary for Playwright CLI..."
playwright-cli install-browser chromium

# Self-check: fail the build LOUDLY if the browser can't actually launch, so any
# future upstream change to the install flow surfaces here (set -e aborts on the
# non-zero exit) instead of silently breaking tests/screenshots at runtime.
echo "🔎 Verifying Chromium launches..."
playwright-cli open about:blank >/dev/null
playwright-cli close >/dev/null

# Done.
echo "✅ Setup complete."
