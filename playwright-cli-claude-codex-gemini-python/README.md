# Multi-AI Browser Control Environment (Playwright CLI)

This container gives multiple AI assistants **direct control of a web browser** through the Playwright CLI. Claude, Codex, and Gemini can all browse websites and interact with them and take screenshots, which they can then interpret. This allows you to use your preferred agent to test code changes / verify features work and render as intended, whether made by you or one of the agents.

## The Core Concept

**This is NOT about automated testing.** This environment gives AI assistants a browser to control during development. Your AIs become web-aware development partners who can:

- Navigate to any URL and interact with live websites
- Click buttons, fill forms, and navigate through applications
- Take screenshots and analyze visual layouts
- Debug your web apps by actually using them
- Extract data from websites for processing
- Test user flows in real-time

## What's Included

### Browser Control Stack
- **Playwright CLI** (`@playwright/cli`) - Token-efficient browser automation commands
- **Chromium Browser** - Pre-configured for headless operation (works on both x86_64 and ARM)

### AI Assistants with Browser Access
- **Claude Code** - Anthropic's CLI with full browser control permissions
- **Codex CLI** - OpenAI's Codex
- **Gemini CLI** - Google's AI assistant

### Development Environment
- **Python 3.12** - Available for development
- **Node.js 24** - JavaScript/TypeScript support
- **VS Code Extensions** - Python and Pylint pre-configured

### Skills (Claude only)
- **`social-seo`** - Implement SEO and social sharing for web apps (meta tags, Open Graph, social cards, PWA support)

## Getting Started

### Quick Start with VS Code

1. **Prerequisites**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop/) running
   - [VS Code](https://code.visualstudio.com/)
   - [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

2. **Open in Container**
   - Open this folder in VS Code
   - Click "Reopen in Container" when prompted
   - Wait for automatic setup (~2-3 minutes first time)

3. **Start your AI and prompt for Playwright CLI browser control**
   ```bash
   # With Claude Code (recommended)
   claude

   # With Gemini CLI
   gemini

   # With Codex CLI
   codex
   ```

## Quick Examples

### Using Claude
```bash
# Start Claude
claude

# First-time authentication (follow prompts)
# Claude will prompt you to authenticate
# Complete the OAuth flow in your browser and copy over the OAuth code
# Claude securely stores credentials for future use

# Ask Claude to interact with a webpage
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it."
```

Claude will create the file, open it in the browser, and capture a screenshot!

For detailed authentication setup, see the [official Claude Code setup guide](https://docs.claude.com/en/docs/claude-code/setup).

### Using Gemini
```bash
# Start Gemini CLI
gemini

# Authentication may be required (follow prompts)

# Ask Gemini to interact with a webpage
"Create an HTML file called simpleForm.html with a form with field validation, then use playwright-cli to navigate to it and take a screenshot"
```

### Using Codex
```bash
# Start Codex CLI (if available)
codex

# Authentication may be required (follow prompts)

# Ask Codex to analyze a webpage
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then use playwright-cli to take a screenshot of it."
```

## Using Skills (Claude only)

Skills are invoked with slash commands. This container includes:

### Social & SEO Implementation
```bash
# Implement full SEO and social sharing
/social-seo all

# Or implement specific phases
/social-seo phase1  # Foundation: meta tags, social card, robots.txt
/social-seo phase2  # Enhancement: PWA, structured data, share buttons
/social-seo phase3  # Advanced: shareable result links
```

The social-seo skill guides Claude through implementing Open Graph tags, Twitter cards, social card images (using Playwright to capture screenshots), PWA manifests, and more.

## Configuration

### Browser Settings (`.playwright/cli.config.json`)
```json
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
```

The `--no-sandbox` flag is required because Chromium's OS-level sandbox needs `CAP_SYS_ADMIN`, which Docker containers don't have. The container itself provides isolation.

### Playwright CLI Setup
During container setup, `setup.sh` does the following in order:
1. Installs Chromium with OS-level dependencies (`npx playwright install --with-deps chromium`)
2. Installs `@playwright/cli` globally
3. Writes the config above to `.playwright/cli.config.json` (the default discovery path)
4. Runs `playwright-cli install --skills` which initializes the workspace and copies the Playwright CLI skill to `.claude/skills/playwright-cli/`

Run `playwright-cli --help` to see all available browser commands.

### Permissions (`.claude/settings.local.json`)
Pre-configured to allow all `playwright-cli` commands via Bash while maintaining security through isolation.

## Common Use Cases

### Development & Debugging
- AIs navigate to your localhost and test features as you build
- Real-time debugging by having AIs reproduce issues
- Quick verification of fixes across multiple AI perspectives

### Multi-AI Collaboration
- Claude handles complex interactions and skills
- Gemini provides alternative testing approaches
- Codex offers code-focused analysis
- Compare results from different AI assistants

### Testing & Quality Assurance
- AIs follow user journeys and report issues
- Accessibility testing for desired compliance
- Performance monitoring and optimization
- Cross-browser compatibility checks

## Why Multiple AI Assistants?

Each AI brings different strengths:
- **Claude**: Best for complex interactions and detailed analysis, plus skills
- **Gemini**: Alternative perspective on web interactions
- **Codex**: Code-focused analysis and debugging

Having multiple AI assistants with browser control allows you to:
1. Get different perspectives on the same problem
2. Use each AI's strengths for specific tasks
3. Validate findings across different AI models
4. Continue working if one service is unavailable

## Advanced Usage

### Running Multiple AI Sessions
You can run different AI assistants in separate terminals:
```bash
# Terminal 1
claude

# Terminal 2
gemini

# Terminal 3
codex
```

## Available Skills (Claude only)

- `/social-seo` - Implement SEO and social sharing (meta tags, Open Graph, PWA, social cards)

## Corporate Networks / Custom npm Registry

If your network blocks access to `registry.npmjs.org`, you can configure a custom npm registry by setting the `NPM_REGISTRY` environment variable in your `devcontainer.json`:

```json
{
  "remoteEnv": {
    "NPM_REGISTRY": "https://your-artifactory.example.com/api/npm/npm-repos/"
  }
}
```

The setup script will detect this variable and configure npm accordingly before installing any packages. If unset, npm uses the public registry as normal.

## Disclaimer

This development container is provided **as-is** for experimental and educational purposes. It may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and browser automation packages are rapidly evolving and may break or change behavior unexpectedly.
