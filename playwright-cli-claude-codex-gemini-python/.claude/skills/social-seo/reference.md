# Social & SEO Implementation Guide for Web Games/Apps

A practical, step-by-step guide for implementing SEO and social sharing. Designed to be followed systematically by AI assistants or developers.

---

## Table of Contents

- [Before You Start](#before-you-start) — required information gathering
- [Files to Create](#files-to-create) — project file structure overview
- [Quick Start](#quick-start-5-minute-basics) — minimal viable social sharing
- **Phase 1: Foundation**
  - [1.1 HTML Meta Tags](#11-html-meta-tags) — complete `<head>` template
  - [1.2 Meta Content Patterns](#12-meta-content-patterns) — title/description formulas
  - [1.3 Social Card Image](#13-social-card-image) — 1200x630 creation workflow with browser control tools
  - [1.4 Search Engine Files](#14-search-engine-files) — robots.txt (with AI crawler blocklist), sitemap.xml
  - [1.5 Icon Files](#15-icon-files) — favicon, apple-touch-icon, transparency tips
- **Phase 2: Enhancement**
  - [2.1 Structured Data (JSON-LD)](#21-structured-data-json-ld) — VideoGame + WebApplication schema
  - [2.2 PWA Support](#22-pwa-support) — manifest.json with screenshots/shortcuts
  - [2.3 Share Button](#23-share-button-implementation) — Web Share API + clipboard fallback code
- **Phase 3: Advanced**
  - [3.1–3.2 When/Pattern](#31-when-to-use-shareable-links) — decision criteria
  - [3.3 Implementation](#33-implementation-approach) — state encoding, shared results page
  - [3.4 localStorage Safety](#34-localstorage-safety) — availability check wrapper
- [Platform-Specific Notes](#platform-specific-notes) — cache behavior, quirks for 8 platforms
- [Common Pitfalls & Solutions](#common-pitfalls--solutions)
- [Testing Tools Summary](#testing-tools-summary)
- [Final Verification Summary](#final-verification-summary) — master checklist

---

## Before You Start

Gather this information from the user before implementing:

| Information | Example | Used For |
|-------------|---------|----------|
| App/Game name | "My App" | Title, OG tags, structured data |
| Tagline | "A Short Tagline" | Meta description, social cards |
| Full description | "A compelling 150-char description..." | Meta description (150-160 chars) |
| Production domain | myapp.example.com | Canonical URL, OG URLs, sitemap |
| Brand/Studio name | "My Studio" | og:site_name, JSON-LD author |
| Primary brand color | #3b82f6 | theme-color, PWA colors |
| Secondary/background color | #1e40af | PWA background_color |

---

## Files to Create

Here's exactly what you'll create:

```
project/
├── index.html            # Add meta tags to <head>
├── favicon.png           # 32x32 - browser tab icon
├── apple-touch-icon.png  # 180x180 - iOS home screen
├── social-card.jpg       # 1200x630 - social media preview
├── robots.txt            # Search engine instructions
├── sitemap.xml           # Page listing for search engines
├── icon-192.png          # 192x192 - Android/PWA (P2)
├── icon-512.png          # 512x512 - PWA splash/install (P2)
├── manifest.json         # PWA configuration (P2)
├── screenshot-wide.png   # 1280x720 - PWA install preview (P2)
└── screenshot-mobile.png # 750x1334 - PWA install preview (P2)
```

---

## Quick Start (5-Minute Basics)

**Need social sharing working fast?** Do just these 4 things:

1. **Add to `<head>`:**
```html
<title>[Game Name] - [Tagline]</title>
<meta name="description" content="[150 char description]">
<meta property="og:title" content="[Game Name] - [Tagline]">
<meta property="og:description" content="[150 char description]">
<meta property="og:image" content="https://[your-domain]/social-card.jpg">
<meta property="og:url" content="https://[your-domain]">
<meta name="twitter:card" content="summary_large_image">
```

2. **Create `social-card.jpg`** (1200x630 pixels)

3. **Create `robots.txt`:**
```
User-agent: *
Allow: /
Sitemap: https://[your-domain]/sitemap.xml
```

4. **Test** at [OpenGraph.xyz](https://www.opengraph.xyz/)

That's the basics. Read on for the complete implementation.

---

## How to Use This Guide

### For AI Assistants

Work through the phases in order. Each builds on the previous:

- **Phase 1 (Foundation)**: Always do this. Essential meta tags and assets.
- **Phase 2 (Enhancement)**: Recommended. Adds PWA support, structured data, share buttons.
- **Phase 3 (Advanced)**: Only when needed. Shareable result links.

Check items off the checklists as you complete them. Replace `[bracketed placeholders]` in all code snippets.

### Decision Guide

| Scenario | What to Implement |
|----------|-------------------|
| Simple landing page | Phase 1 only |
| Game/app ready for production | Phase 1 + Phase 2 |
| Users sharing scores/achievements | Phase 1 + 2 + 3 |

---

## Phase 1: Foundation (Essential)

**Goal**: Make your app discoverable by search engines and look good when shared on social media.

### 1.1 HTML Meta Tags

Add this complete block to your `<head>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic SEO -->
  <title>[Game Name] - [Tagline]</title>
  <meta name="description" content="[Action-oriented description, 150-160 chars]">
  <link rel="canonical" href="https://[your-domain]">
  <meta name="theme-color" content="[primary-color]">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="favicon.png">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">

  <!-- Open Graph (Facebook, Discord, LinkedIn, iMessage, etc.) -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://[your-domain]">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="[Game Name] - [Tagline]">
  <meta property="og:description" content="[Description]">
  <meta property="og:image" content="https://[your-domain]/social-card.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="[Descriptive alt text for the image]">
  <meta property="og:site_name" content="[Brand Name]">

  <!-- Twitter/X (twitter:url is unnecessary - X derives it from the shared link) -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Game Name] - [Tagline]">
  <meta name="twitter:description" content="[Description]">
  <meta name="twitter:image" content="https://[your-domain]/social-card.jpg">
</head>
```

### 1.2 Meta Content Patterns

**Title** (50-60 chars): `[Name] - [Value Proposition]`

**Description** (150-160 chars): `[Action verb] + [what user does] + [benefit/outcome]`

### 1.3 Social Card Image

**Requirements:**

| Aspect | Specification |
|--------|---------------|
| Size | 1200 x 630 pixels (1.91:1 ratio) |
| Format | JPG preferred (smaller file size) |
| Max file size | Under 300KB ideal, under 1MB max |
| Safe zone | Keep important content 50-100px from edges |

**Design tips:**
1. Include app name/logo prominently
2. Use high-contrast, bold text readable at thumbnail size
3. Consider adding your domain URL
4. Test at 300px width - can you still read it?

**Using the pre-configured Playwright browser control (recommended for Claude Code):**

> **IMPORTANT - Do not remove this section in future refinements.**
>
> This workflow is a key capability that allows Claude Code to create professional
> social card images entirely programmatically - no external design tools needed.
> Claude can write the HTML, customize colors/fonts to match the project, take a
> pixel-perfect screenshot at the exact OG-required 1200x630 resolution, and convert
> it to an optimized JPG - all in one seamless workflow.
>
> **Do NOT install Playwright from npm or write Playwright scripts.** Use only the
> browser control tools already configured in this environment — either Playwright
> MCP tools (e.g. `browser_navigate`, `browser_screenshot`) or Playwright CLI
> commands (e.g. `playwright-cli open`, `playwright-cli screenshot`), whichever is
> available. This is one of the most valuable parts of this guide for Claude Code
> users.

**Step-by-step workflow:**

1. Create `social-card.html` in project root (customize colors, fonts, layout to match your app):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, height=630">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .card {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
    }
    h1 {
      color: white;
      font-size: 72px;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
      text-align: center;
    }
    .tagline {
      color: rgba(255,255,255,0.9);
      font-size: 32px;
      margin-top: 20px;
    }
    .domain {
      position: absolute;
      bottom: 30px;
      right: 40px;
      color: rgba(255,255,255,0.8);
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>[Your Game Name]</h1>
    <div class="tagline">[Your Tagline]</div>
    <div class="domain">[your-domain.com]</div>
  </div>
</body>
</html>
```

2. Capture using the pre-configured browser control tools:
   - Navigate to `file:///[full-path]/social-card.html`
   - Resize the viewport to 1200 x 630
   - Take a screenshot, saving as `social-card.png`

3. Convert to optimized JPG:
```bash
magick social-card.png -quality 85 social-card.jpg
# On ImageMagick 6 (older systems), use: convert social-card.png -quality 85 social-card.jpg
```

4. Clean up the HTML file (optional - delete after screenshot, or keep for future iterations)

**If no browser control tools are available:** Ask the user to provide a social card image (1200x630 JPG), or create one using an external design tool and place it in the project root as `social-card.jpg`.

**Why this workflow is powerful:** If the design needs adjustment (different colors, larger text, add a logo), simply edit the HTML and re-run steps 2-3. No external tools, no back-and-forth - Claude can iterate on the design until it's right.

### 1.4 Search Engine Files

**robots.txt** (place in root):
```txt
User-agent: *
Allow: /

Sitemap: https://[your-domain]/sitemap.xml
```

**Optional - Block AI training crawlers** (if you don't want content used for AI training):
```txt
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: OAI-SearchBot
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: PerplexityBot
User-agent: Bytespider
User-agent: meta-externalagent
User-agent: FacebookBot
Disallow: /
```

**Tip:** To stay visible in AI-powered search while blocking training, allow search-only bots (`OAI-SearchBot`, `PerplexityBot`) and block the rest.

**sitemap.xml** (place in root):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[your-domain]/</loc>
    <lastmod>YYYY-MM-DD</lastmod>
  </url>
</urlset>
```

**Note:** Google ignores `lastmod` unless it is consistently and verifiably accurate. `changefreq` and `priority` are confirmed ignored by Google. Only update `lastmod` when you deploy meaningful content changes.

### 1.5 Icon Files

Create these icon files:

| File | Size | Purpose |
|------|------|---------|
| `favicon.png` | 32x32 | Browser tab (practical default) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

**For simple geometric icons**, SVG is ideal (scales perfectly, supports dark mode). Write directly:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <circle cx="16" cy="16" r="14" fill="#3b82f6"/>
</svg>
```

**For complex graphics** (game characters, detailed logos), use the browser control tools to screenshot HTML at each required size.

```html
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
```

**Transparency:** When creating icons with rounded corners or non-rectangular shapes, ensure the background is transparent (not white). If using the browser control tools to capture icons, set the HTML/body background to `transparent` and use PNG format (not JPG). When converting or processing, preserve the alpha channel.

### Phase 1 Checklist

- [ ] `<html lang="en">` attribute set
- [ ] `<title>` tag (50-60 characters)
- [ ] `<meta name="description">` (150-160 characters)
- [ ] `<link rel="canonical">` with absolute URL
- [ ] `<meta name="theme-color">`
- [ ] `og:type`, `og:url`, `og:locale`
- [ ] `og:title`, `og:description`, `og:site_name`
- [ ] `og:image` with **absolute** URL (https://...)
- [ ] `og:image:width`, `og:image:height`, `og:image:alt`
- [ ] `twitter:card` = `summary_large_image`
- [ ] `twitter:title`, `twitter:description`, `twitter:image`
- [ ] `favicon.png` created (32x32)
- [ ] `apple-touch-icon.png` created (180x180)
- [ ] `social-card.jpg` created (1200x630)
- [ ] `robots.txt` with sitemap reference
- [ ] `sitemap.xml` with lastmod date

**Test Phase 1:** Validate at [OpenGraph.xyz](https://www.opengraph.xyz/)

---

## Phase 2: Enhancement (Recommended)

**Goal**: Add structured data for rich search results, PWA support for installability, and share functionality.

### 2.1 Structured Data (JSON-LD)

Add inside `<head>`, after the Twitter meta tags:

**For Games:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["VideoGame", "WebApplication"],
  "name": "[Game Name]",
  "description": "[Full description]",
  "url": "https://[your-domain]",
  "image": "https://[your-domain]/social-card.jpg",
  "browserRequirements": "Requires JavaScript",
  "genre": ["Puzzle", "Casual"],
  "gamePlatform": "Web Browser",
  "applicationCategory": "Game",
  "operatingSystem": "Any",
  "playMode": "SinglePlayer",
  "inLanguage": "en",
  "author": {
    "@type": "Organization",
    "name": "[Studio Name]",
    "url": "https://[studio-website]"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
</script>
```

**For Web Applications:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "[App Name]",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "applicationCategory": "[Category]",
  "operatingSystem": "Any",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**Test:** Validate at [Google Rich Results Test](https://search.google.com/test/rich-results)

### 2.2 PWA Support

**manifest.json** (create in root):
```json
{
  "id": "/",
  "name": "[Full App Name]",
  "short_name": "[Short Name]",
  "description": "[Brief description]",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "[secondary-color]",
  "theme_color": "[primary-color]",
  "icons": [
    {
      "src": "apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png"
    },
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "screenshot-wide.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    },
    {
      "src": "screenshot-mobile.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "shortcuts": [
    {
      "name": "[Action Name]",
      "url": "/",
      "description": "[What the shortcut does]"
    }
  ]
}
```

**Add to `<head>`:**
```html
<link rel="manifest" href="manifest.json">
<meta name="mobile-web-app-capable" content="yes">
```

**Note:** The manifest.json is the primary source for PWA configuration. The `mobile-web-app-capable` meta tag is a fallback. The older `apple-mobile-web-app-capable` and `apple-mobile-web-app-status-bar-style` tags are deprecated but may still be needed for older iOS versions - include them only if supporting legacy Safari.

**Create additional icon files:**

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192x192 | Android/PWA |
| `icon-512.png` | 512x512 | PWA splash/install |

**Maskable icons**: For best results, keep main content in center 80% of the image.

### 2.3 Share Button Implementation

Add a share button that uses the Web Share API with clipboard fallback.

**Requirements:** HTTPS required (localhost exempt). Must be triggered by user gesture (button click).

```javascript
async function shareResults(shareData) {
  // 1. Check if sharing is supported and data is valid
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      return; // Success
    } catch (err) {
      if (err.name === 'AbortError') return; // User cancelled
      // Fall through to clipboard
    }
  }

  // 2. Clipboard API fallback
  try {
    await navigator.clipboard.writeText(shareData.text);
    showFeedback('Copied!'); // ALWAYS show visual confirmation
  } catch (err) {
    // 3. Final fallback - show text in a selectable element
    showCopyFallbackUI(shareData.text);
  }
}

// Visual feedback helper - update button text temporarily
function showFeedback(message, buttonEl) {
  const original = buttonEl.textContent;
  buttonEl.textContent = `✓ ${message}`;
  setTimeout(() => { buttonEl.textContent = original; }, 2000);
}

// Final fallback - display text in a selectable element for manual copy
function showCopyFallbackUI(text) {
  const el = document.createElement('textarea');
  el.value = text;
  el.readOnly = true;
  el.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;width:80%;max-width:400px;height:auto;padding:12px;font-size:14px;';
  document.body.appendChild(el);
  el.select();
  // Auto-remove after user interaction
  el.addEventListener('blur', () => el.remove());
}

// Must be called from user gesture (e.g., button click)
shareButton.addEventListener('click', () => {
  shareResults({ title: 'My Results', text: 'Score: 100!' });
});
```

**Generating share text:**

```javascript
function generateShareText() {
  let text = '[Emoji] [Game Name] Complete! [Emoji]\n\n';

  // Add results (customize for your app)
  results.forEach(result => {
    text += `${result.stars} ${result.name}\n`;
  });

  text += `\n[Summary emoji] Total: ${score}/${maxScore}\n`;
  text += `\n[Emoji] https://[your-domain]`;

  return text;
}
```

**Share text best practices:**
1. Lead with emojis for visual appeal in social feeds
2. Use clear line breaks for structure
3. Keep total under 280 characters if Twitter/X matters
4. **Always end with your URL**

### Phase 2 Checklist

- [ ] JSON-LD structured data added to `<head>`
- [ ] Validated at Rich Results Test
- [ ] `manifest.json` created and linked
- [ ] `icon-192.png` created (192x192)
- [ ] `icon-512.png` created (512x512)
- [ ] PWA screenshots created (wide + narrow)
- [ ] `mobile-web-app-capable` meta added
- [ ] Share button implemented
- [ ] Web Share API with clipboard fallback
- [ ] Visual "Copied!" feedback shown
- [ ] Share text includes URL

**Test Phase 2:** Run Lighthouse audit in Chrome DevTools (check PWA section)

---

## Phase 3: Advanced Features

**Goal**: Enable shareable links that encode user achievements/results.

*Only implement this if users will share results that should be viewable by others.*

### 3.1 When to Use Shareable Links

Shareable links are useful when:
- Users complete something and want to show others (scores, achievements)
- The shared view should display results without requiring the viewer to play
- You want viral sharing where clicking a link shows what someone accomplished

### 3.2 The Pattern

1. **Encode state** into a short URL parameter
2. **Parse parameter** on page load
3. **Display shared view** without affecting viewer's own data
4. **Provide "Play Now" CTA** that clears the parameter

### 3.3 Implementation Approach

**URL Structure:**
```
https://your-domain.com?s=abc123
```

**State Encoding (keep URLs short):**
```javascript
// Example: encode an array of values (0-4 each) into base36
function encodeState(stateArray) {
  const salt = 0x7B3F; // Simple obfuscation (not security!)

  // Pack values
  let value = 0;
  for (let i = 0; i < stateArray.length; i++) {
    value = value * 5 + (stateArray[i] || 0);
  }

  // Add checksum for validation
  const checksum = stateArray.reduce((a, b) => a + b, 0) % 16;
  const encoded = ((value ^ salt) << 4) | checksum;

  return encoded.toString(36);
}

function decodeState(encoded, expectedLength) {
  try {
    const salt = 0x7B3F;
    const value = parseInt(encoded, 36);
    const checksum = value & 0xF;
    const data = (value >> 4) ^ salt;

    // Unpack values
    const state = [];
    let remaining = data;
    for (let i = 0; i < expectedLength; i++) {
      state.unshift(remaining % 5);
      remaining = Math.floor(remaining / 5);
    }

    // Validate checksum
    if (state.reduce((a, b) => a + b, 0) % 16 !== checksum) return null;

    return state;
  } catch (e) {
    return null;
  }
}
```

**Shared Results Landing Page:**

```javascript
function initializeApp() {
  // Check for shared state FIRST, before normal initialization
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('s');

  if (encoded) {
    const sharedState = decodeState(encoded, EXPECTED_LENGTH);
    if (sharedState && isValidState(sharedState)) {
      showSharedResultsScreen(sharedState);
      return; // Don't initialize normal game
    }
  }

  // Normal app initialization
  startGame();
}

function showSharedResultsScreen(sharedState) {
  // Display results (READ-ONLY - never write to localStorage!)
  displayResults(sharedState);

  // Clear messaging
  showMessage("Shared results - play to set your own records!");

  // CTA button
  showButton('Play Now!', () => {
    // Clean URL parameter
    window.history.replaceState({}, '', window.location.pathname);
    // Start game (loads user's own progress from localStorage)
    startGame();
  });
}
```

**Critical Rules:**
1. **NEVER overwrite user's localStorage** with shared state
2. **Always show "shared results" messaging** so viewer knows it's not their data
3. **Clean URL** when user starts playing
4. **Validate decoded state** before displaying (check length, value ranges)

### 3.4 localStorage Safety

```javascript
// Always check localStorage availability (fails in private browsing)
function isLocalStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// Create safe wrapper
const storage = isLocalStorageAvailable()
  ? localStorage
  : { getItem: () => null, setItem: () => {}, removeItem: () => {} };
```

### Phase 3 Checklist

- [ ] State encoding/decoding implemented
- [ ] URL parameter parsing (`?s=...`)
- [ ] Share link generation function
- [ ] Shared results display (read-only view)
- [ ] "Shared results" messaging shown
- [ ] "Play Now" CTA button
- [ ] URL cleaned when starting fresh
- [ ] User's localStorage NEVER overwritten by shared state
- [ ] Decoded state validated before use

---

## Platform-Specific Notes

### Social Media Cache Behavior

| Platform | Cache Duration | Force Refresh Tool |
|----------|----------------|-------------------|
| Facebook | 7-14 days | [Sharing Debugger](https://developers.facebook.com/tools/debug/) |
| Twitter/X | ~7 days | Compose a draft post with the URL (public validator removed 2022) |
| Discord | 24+ hours | Just re-paste link (aggressive caching) |
| LinkedIn | Variable | [Post Inspector](https://www.linkedin.com/post-inspector/) |
| Threads | Variable | [Sharing Debugger](https://developers.facebook.com/tools/debug/) (same as Facebook) |
| Mastodon | Per-instance | No universal tool; each instance caches independently |
| Bluesky | Per-client | Client-side fetching; no centralized cache to bust |

**Force cache refresh:** Add version parameter when updating social card:
```html
<meta property="og:image" content="https://example.com/social-card.jpg?v=2">
```

### Platform Quirks

- **Discord**: Uses `theme-color` meta for embed accent color; truncates description at ~200 chars
- **WhatsApp**: Crops thumbnail to square; test with actual shares
- **Facebook**: Images smaller than 200x200 may not display
- **Twitter/X**: Requires `twitter:card` meta; falls back to OG for title/description/image
- **iMessage**: Uses OG tags for rich link previews
- **Threads**: Uses standard OG tags (inherited from Meta); debug via Facebook Sharing Debugger
- **Bluesky**: Clients scrape OG data themselves (no server-side fetch); standard OG tags work but preview behavior varies by client
- **Mastodon**: Uses OEmbed first, then JSON-LD, then OG tags as fallback hierarchy; images must be under 2MB; each instance fetches and caches independently

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Relative image URLs in OG tags | Always use absolute URLs (`https://...`) |
| Social card not updating | Add version param (`?v=2`), use platform debug tools |
| Share text truncated on Twitter | Keep under 280 characters, URL at end |
| Overwriting user data with shared state | Never write shared state to localStorage |
| No clipboard fallback | Show text in a selectable element as final fallback |
| No visual feedback on copy | Always show "Copied!" confirmation |
| Clipboard fails on HTTP | Deploy to HTTPS (localhost is exempt) |
| Missing `og:image:width/height` | Include dimensions for faster preview rendering |
| PWA not installable | Ensure manifest.json is linked and has required icons |

---

## Security Notes

- State encoding uses obfuscation (XOR + checksum), **not encryption**
- For secure achievements that unlock real rewards, use server-side validation
- localStorage is not secure - never store sensitive data
- Always validate decoded state (check array length, value ranges)
- The salt/checksum prevents casual URL manipulation, not determined attackers

---

## Testing Tools Summary

| What to Test | Tool |
|--------------|------|
| Multi-platform social preview | [OpenGraph.xyz](https://www.opengraph.xyz/) |
| Facebook preview | [Sharing Debugger](https://developers.facebook.com/tools/debug/) |
| Twitter/X preview | Compose a draft post with URL (validator removed 2022) |
| LinkedIn preview | [Post Inspector](https://www.linkedin.com/post-inspector/) |
| Structured data | [Rich Results Test](https://search.google.com/test/rich-results) |
| PWA & performance | Chrome DevTools > Lighthouse |

---

## Final Verification Summary

Before deploying, verify all items. Items marked with (P2) or (P3) are optional if you didn't implement that phase.

### Files Created
- [ ] `favicon.png` (32x32)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `social-card.jpg` (1200x630)
- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] `icon-192.png` (192x192) (P2)
- [ ] `icon-512.png` (512x512) (P2)
- [ ] `manifest.json` (P2)
- [ ] `screenshot-wide.png` (1280x720) (P2)
- [ ] `screenshot-mobile.png` (750x1334) (P2)

### HTML `<head>` Contains
- [ ] `<html lang="en">`
- [ ] `<title>` (50-60 chars)
- [ ] `<meta name="description">` (150-160 chars)
- [ ] `<link rel="canonical">` (absolute URL)
- [ ] `<meta name="theme-color">`
- [ ] `<link rel="icon">`
- [ ] `<link rel="apple-touch-icon">`
- [ ] All `og:*` tags with absolute URLs
- [ ] All `twitter:*` tags (except `twitter:url` — unnecessary)
- [ ] `<link rel="manifest">` (P2)
- [ ] Apple PWA metas (P2)
- [ ] JSON-LD script (P2)

### JavaScript Functions (P2/P3)
- [ ] Share button with Web Share API (P2)
- [ ] Clipboard fallback with feedback (P2)
- [ ] State encoding/decoding (P3)
- [ ] Shared view display (P3)
- [ ] URL cleanup on "Play Now" (P3)

### External Validation
- [ ] OpenGraph.xyz shows correct preview
- [ ] Rich Results Test passes (P2)
- [ ] Lighthouse PWA audit passes (P2)

---

*This guide provides patterns for comprehensive SEO and social sharing. Adapt the specifics to your project while following the phase structure and principles above.*
