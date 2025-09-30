# Multi-AI Browser Control Environment

This container gives multiple AI assistants **direct control of a web browser** through the Playwright MCP server. Claude, Codex, and Gemini can all browse websites and interact with them and take screenshots, which they can then interpret. This allows you to use your preferred agent to test code changes / verify features work and render as intended, whether made by you or one of the agents.

The container also includes commands and subagents to help guide Claude Code with using Playwright.

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
- **Playwright MCP Server** - Bridges AI assistants to browser control
- **Chrome Browser** - Pre-configured for headless operation
- **MCP Protocol** - Enables real-time AI-to-browser communication

### AI Assistants with Browser Access
- **Claude Code** - Anthropic's CLI with full browser control permissions
- **Codex CLI** - OpenAI's Codex (if available - MCP configured via TOML)
- **Gemini CLI** - Google's AI assistant (MCP configured directly)

### Development Environment
- **Python 3.12** - Available for development
- **Node.js 22** - JavaScript/TypeScript support
- **VS Code Extensions** - Python and Pylint pre-configured

### Pre-configured Browser-Aware Agents (Claude only)
- **`playwright-e2e-tester`** - Navigates through complete user journeys
- **`playwright-accessibility-auditor`** - Interacts with pages to test accessibility
- **`playwright-performance-monitor`** - Analyzes real page load performance
- **`playwright-form-validator`** - Fills and validates complex forms
- **`playwright-web-evaluator`** - General web page analysis and interaction

## Known Limitations

### Gemini CLI Screenshot Issue (September 2024)
**Note:** Gemini CLI currently encounters an API error when attempting to take screenshots through Playwright MCP. Other browser interactions work normally. Observed API failure on September 27, 2024.

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

3. **Start your AI and prompt for Playwright MCP browser control**
   ```bash
   # With Claude Code (recommended)
   claude

   # With Gemini CLI (note: screenshots may error, see note above)
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
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then have Playwright MCP take a screenshot of it."
```

Claude will create the file, open it in the browser, and capture a screenshot!

For detailed authentication setup, see the [official Claude Code setup guide](https://docs.claude.com/en/docs/claude-code/setup).

### Using Gemini
```bash
# Start Gemini CLI
gemini

# Authentication may be required (follow prompts)

# Ask Gemini to interact with a webpage
"Create an HTML file called simpleForm.html with a form with field validation, then navigate to it and verify the fields validate as expected"
"Note: screenshot commands will currently fail with API error"
```

### Using Codex
```bash
# Start Codex CLI (if available)
codex

# Authentication may be required (follow prompts)

# Ask Codex to analyze a webpage
"Create a simple HTML file called helloPlaywright.html with a colorful heading saying 'Hello Playwright!', then have Playwright MCP take a screenshot of it."
```

## Using Specialized Agents (Claude only)

Claude Code includes specialized browser testing agents that work behind the scenes. You invoke them by describing your task or explicitly requesting them:

### How to Use Agents

Simply ask Claude in natural language. Claude will either:
- **Automatically** select the appropriate agent based on your task
- **Explicitly** use an agent when you mention it by name

You can list all your agents with `/agents`.

### Examples

```bash
# Test user registration flow
"Use the playwright-e2e-tester agent to test the complete signup process on my app"
# Or simply: "Test the complete signup process on my app"

# Check accessibility compliance
"Use the playwright-accessibility-auditor to verify my site meets WCAG standards"
# Or simply: "Check if my site meets WCAG accessibility standards"

# Monitor performance
"Use playwright-performance-monitor to analyze load times for my web app"
# Or simply: "Analyze the performance and load times of my web app"

# Validate forms
"Use playwright-form-validator to test all validation rules on my form"
# Or simply: "Test all the form validation rules on my web page"

# General web evaluation
"Use playwright-web-evaluator to evaluate the UX of my application"
# Or simply: "Evaluate the user experience of my web application"
```

**Note:** There is no special slash command for agents. Just describe what you want to test, and Claude will handle the rest!

## Available Browser Control Commands

All AI assistants can use these MCP commands:

- `mcp__playwright__browser_navigate` - Go to any URL
- `mcp__playwright__browser_click` - Click elements
- `mcp__playwright__browser_type` - Type text
- `mcp__playwright__browser_fill_form` - Fill entire forms
- `mcp__playwright__browser_take_screenshot` - Capture visuals (Note: Gemini errors)
- `mcp__playwright__browser_evaluate` - Run JavaScript
- `mcp__playwright__browser_wait_for` - Wait for elements
- `mcp__playwright__browser_network_requests` - Monitor network
- `mcp__playwright__browser_resize` - Change viewport
- `mcp__playwright__browser_hover` - Hover over elements
- `mcp__playwright__browser_press_key` - Keyboard interactions
- `mcp__playwright__browser_snapshot` - Capture page state
- `mcp__playwright__browser_close` - Close browser

## Configuration

### Browser Settings (`.playwright-mcp.json`)
```json
{
  "browser": {
    "browserName": "chromium",
    "isolated": true,
    "launchOptions": {
      "channel": "chrome",
      "headless": true,
      "args": ["--no-sandbox"]
    }
  }
}
```

### MCP Registration
- **Claude Code**: Registered via `claude mcp add` command
- **Gemini CLI**: Registered via `gemini mcp add` command
- **Codex CLI**: Configured via `~/.codex/config.toml`

## Common Use Cases

### Development & Debugging
- AIs navigate to your localhost and test features as you build
- Real-time debugging by having AIs reproduce issues
- Quick verification of fixes across multiple AI perspectives

### Multi-AI Collaboration
- Claude handles complex interactions and specialized agents
- Gemini provides alternative testing approaches (except screenshots)
- Codex offers code-focused analysis
- Compare results from different AI assistants

### Testing & Quality Assurance
- AIs follow user journeys and report issues
- Accessibility testing for WCAG compliance
- Performance monitoring and optimization
- Cross-browser compatibility checks

## Troubleshooting

### Browser Won't Start
- Container has 2GB shared memory (`--shm-size=2g`)
- Chrome runs with `--no-sandbox` for container compatibility
- Check Docker has sufficient resources

### MCP Connection Issues
```bash
# For Claude
claude mcp restart playwright
claude mcp status

# For Gemini
gemini mcp status

# For Codex - check config file
cat ~/.codex/config.toml
```

### Gemini Screenshot Errors
As of September 27, 2024, Gemini CLI returns API errors when taking screenshots. Use Claude Code or Codex for screenshot operations, or use Gemini for other browser interactions.

### Package Installation Issues
Some AI CLI tools may not be available via npm. The setup will continue even if certain packages fail to install.

## Available Commands (Claude only)

- `/playwrightcheck` - Validate Playwright setup
- `/playwrightprep` - Prepare Playwright environment

## Why Multiple AI Assistants?

Each AI brings different strengths:
- **Claude**: Best for complex interactions and detailed analysis, plus specialized agents
- **Gemini**: Alternative perspective on web interactions (except screenshots)
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

### Custom Browser Configurations
Modify `.playwright-mcp.json` for different setups:
- Change browser type
- Adjust viewport settings
- Configure proxy settings
- Enable headed mode (requires display)

## The Power of Multi-AI Browser Control

This environment transforms multiple AI assistants into active web development partners who can:
- **See what you see** - All AIs can browse your applications
- **Test from different angles** - Each AI brings unique insights
- **Collaborate on problems** - Compare results across AI models
- **Work in parallel** - Multiple AIs testing different features
- **Provide redundancy** - Continue if one AI service is down

Instead of just one AI assistant, you have a team of web-aware AI partners, each able to browse, interact with, and analyze web content in their own way.

## Disclaimer

This development container is provided **as-is** for experimental and educational purposes. It may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and MCP servers are rapidly evolving and may break or change behavior unexpectedly.