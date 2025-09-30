# Claude Code + Playwright MCP

This container gives Claude Code **direct control of a web browser** through the Playwright MCP server. Claude can browse websites and interact with them and take screenshots, which Claude can interpret. This allows you to use Claude to test code changes / verify features work and render as intended, whether made by you or by Claude.

The container also includes commands and subagents to help guide Claude Code with using Playwright.

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
- **Playwright MCP Server** - Bridges Claude to browser control
- **Chrome Browser** - Pre-configured for headless operation
- **MCP Protocol** - Enables real-time AI-to-browser communication

### AI Assistant with Browser Access
- **Claude Code** - Anthropic's CLI with full browser control permissions

### Development Environment
- **Python 3.12** - Full Python development environment
- **Node.js 22** - JavaScript/TypeScript support
- **VS Code Extensions** - Python and Pylint pre-configured

### Pre-configured Browser-Aware Agents
- **`playwright-e2e-tester`** - Navigates through complete user journeys
- **`playwright-accessibility-auditor`** - Interacts with pages to test accessibility
- **`playwright-performance-monitor`** - Analyzes real page load performance
- **`playwright-form-validator`** - Fills and validates complex forms
- **`playwright-web-evaluator`** - General web page analysis and interaction

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

3. **Start Claude and prompt for Playwright MCP browser control**
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

## Using Specialized Agents

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
Claude Code's MCP is registered automatically during container setup via the `claude mcp add` command.

### Permissions (`.claude/settings.local.json`)
Pre-configured to allow all browser control operations while maintaining security through isolation.

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

## Disclaimer

This development container is provided **as-is** for experimental and educational purposes. It may contain bugs, compatibility issues, or other problems. Use at your own risk. This is not production-ready software and no warranties are provided. AI CLI tools and MCP servers are rapidly evolving and may break or change behavior unexpectedly.