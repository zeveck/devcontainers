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
# We use chromium (not chrome) because Chrome lacks native ARM Linux builds,
# which breaks on Apple Silicon Macs running ARM containers.
# Remove Yarn repo with expired GPG key (from base image) to avoid apt failures.
echo "🎭 Installing Chromium with OS dependencies..."
sudo rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npx -y playwright@latest install --with-deps chromium

# Remove all MCP servers.
echo "🧹 Removing any old MCP entries..."
rm -f .mcp.json
rm -f .playwright-mcp.json

# Install Playwright MCP with config.
echo "📝 Writing Playwright MCP config (explicit executablePath, headless)..."
cat > .playwright-mcp.json <<JSON
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "launchOptions": {
      "headless": true,
      "args": ["--no-sandbox"]
    }
  }
}
JSON

# Configure Claude Code MCP.
echo "🔌 Registering MCP server for Claude Code (CLI)..."
claude mcp add playwright --scope project -- \
  npx @playwright/mcp@latest --config ./.playwright-mcp.json


# Done.
echo "✅ Setup complete."
