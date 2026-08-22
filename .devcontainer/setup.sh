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
echo "🧠 Installing GPT-5 Codex..."
npm install -g @openai/codex@latest

# Install Gemini CLI.
echo "✨ Installing Gemini CLI..."
npm install -g @google/gemini-cli@latest

# Install the GitLab CLI (glab).
# gh comes from the github-cli devcontainer feature, but glab has no official
# feature, so fetch the release binary directly. The version is resolved at build
# time rather than pinned, and the architecture comes from dpkg, so this works on
# both x86_64 and ARM (Apple Silicon) containers.
#
# Non-fatal on purpose: glab is a convenience, and gitlab.com may be unreachable
# on restricted networks. A failure here should not cost you the agents and
# browser stack that are the point of this container.
echo "🦊 Installing GitLab CLI (glab)..."
if ! (
  set -e
  GLAB_ARCH="$(dpkg --print-architecture)"
  GLAB_URL="$(curl -fsSL --max-time 30 \
    'https://gitlab.com/api/v4/projects/gitlab-org%2Fcli/releases?per_page=1' \
    | python3 -c "import json,sys;d=json.load(sys.stdin)[0];print(next(l['url'] for l in d['assets']['links'] if l['name'].endswith('linux_${GLAB_ARCH}.tar.gz')))")"
  curl -fsSL --max-time 180 "$GLAB_URL" -o /tmp/glab.tar.gz
  # No --strip-components: the tarball's bin/glab must land in /usr/local/bin.
  sudo tar -xzf /tmp/glab.tar.gz -C /usr/local bin/glab
  rm -f /tmp/glab.tar.gz
); then
  echo "⚠️  glab install failed (network or upstream change) — continuing without it."
fi

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
# Browser download is handled explicitly by `install-browser` below, not relied on here
# (whether `install` also fetches one has varied across releases, and we pin @latest).
echo "📝 Initializing Playwright CLI workspace and installing skills..."
playwright-cli install --skills

# Install the browser AND its OS-level dependencies in one step.
# `install-browser` fetches the exact revision the CLI's bundled playwright-core pins
# (currently chromium-1224) plus the headless shell and ffmpeg (needed for video
# recording), and is idempotent. `--with-deps` adds the OS packages Docker lacks
# (libgbm, libnss3, etc) via apt.
#
# Do NOT add a separate `npx playwright install --with-deps chromium` here: stable
# playwright pins a DIFFERENT revision (1234), so it downloads ~656 MB of browsers
# that are never launched. PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 does not prevent this —
# that variable is only read by the npm-postinstall path, not the explicit `install`.
#
# We use chromium (not chrome) because it has native ARM Linux builds, so this works
# on Apple Silicon containers too.
# Remove Yarn repo with expired GPG key (from base image) to avoid apt failures.
echo "🌐 Installing Chromium and OS dependencies for Playwright CLI..."
sudo rm -f /etc/apt/sources.list.d/yarn.list 2>/dev/null || true
playwright-cli install-browser chromium --with-deps

# Self-check: fail the build LOUDLY if the browser can't actually launch, so any
# future upstream change to the install flow surfaces here (set -e aborts on the
# non-zero exit) instead of silently breaking tests/screenshots at runtime.
echo "🔎 Verifying Chromium launches..."
playwright-cli open about:blank >/dev/null
playwright-cli close >/dev/null

# Done.
echo "✅ Setup complete."
