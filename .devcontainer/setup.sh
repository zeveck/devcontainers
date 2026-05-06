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

# Initialize workspace and install skills.
# This will:
#   - Detect the existing .playwright/ directory and our config
#   - Verify Chromium is installed (it is, from the step above)
#   - Copy skill files to .claude/skills/playwright-cli/
echo "📝 Initializing Playwright CLI workspace and installing skills..."
playwright-cli install --skills

# Done.
echo "✅ Setup complete."
