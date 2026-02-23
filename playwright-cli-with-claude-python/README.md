# Claude Code + Playwright CLI

This container gives Claude Code **direct control of a web browser** through the Playwright CLI. Claude can browse websites and interact with them and take screenshots, which Claude can interpret. This allows you to use Claude to test code changes / verify features work and render as intended, whether made by you or by Claude.

## The Core Concept

**This is NOT about automated testing.** This environment gives Claude a browser to control during development. Claude becomes your web-aware development partner who can:

- Navigate to any URL and interact with live websites
- Click buttons, fill forms, and navigate through applications
- Take screenshots and analyze visual layouts
- Debug your web apps by actually using them
- Extract data from websites for processing
- Test user flows in real-time

## What's Included

### Browser Control Stack
- **Playwright CLI** (`@playwright/cli`) - Token-efficient browser automation commands
- **Chrome Browser** - Pre-configured for headless operation

### AI Assistant with Browser Access
- **Claude Code** - Anthropic's CLI with full browser control permissions

### Development Environment
- **Python 3.12** - Full Python development environment
- **Node.js 22** - JavaScript/TypeScript support
- **VS Code Extensions** - Python and Pylint pre-configured

### Skills
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

3. **Start Claude and prompt for Playwright CLI browser control**
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

## Using Skills

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
      "channel": "chrome",
      "headless": true,
      "args": ["--no-sandbox"]
    }
  },
  "outputDir": ".playwright/output"
}
```

The `--no-sandbox` flag is required because Chrome's OS-level sandbox needs `CAP_SYS_ADMIN`, which Docker containers don't have. The container itself provides isolation.

### Playwright CLI Setup
During container setup, `setup.sh` does the following in order:
1. Installs Chrome with OS-level dependencies (`npx playwright install --with-deps chrome`)
2. Installs `@playwright/cli` globally
3. Writes the config above to `.playwright/cli.config.json` (the default discovery path)
4. Runs `playwright-cli install --skills` which initializes the workspace and copies the Playwright CLI skill to `.claude/skills/playwright-cli/`

Run `playwright-cli --help` to see all available browser commands.

### Permissions (`.claude/settings.local.json`)
Pre-configured to allow all `playwright-cli` commands via Bash while maintaining security through isolation.

## Common Use Cases

### Web Development
- Build web apps and have Claude test them
- Claude navigates to designated URLs and tests features as you build
- Claude can add a feature and verify
- Claude can help debug based on repro steps
- Form validation and user flow testing
- API endpoint testing through browser interaction

### Data Science & Web Scraping
- Claude extracts data from websites for analysis
- Combine browser automation with pandas processing
- Visual data validation through screenshots
- Interactive data collection workflows

### Testing & Quality Assurance
- Claude follows user journeys and reports issues
- Accessibility testing for desired compliance
- Performance monitoring and optimization
- Cross-browser compatibility checks

## Available Skills

- `/social-seo` - Implement SEO and social sharing (meta tags, Open Graph, PWA, social cards)

## Disclaimer

This development container is provided **as-is** for experimental and educational purposes. It may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and browser automation packages are rapidly evolving and may break or change behavior unexpectedly.
