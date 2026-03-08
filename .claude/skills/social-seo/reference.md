# Social & SEO Implementation Guide

A practical, step-by-step guide for implementing SEO and social sharing on any website. Designed to be followed systematically by AI assistants or developers.

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
  - [2.1 Structured Data (JSON-LD)](#21-structured-data-json-ld) — schema templates by site type
  - [2.2 PWA Manifest](#22-pwa-manifest) — manifest.json with screenshots/shortcuts
  - [2.3 Service Worker](#23-service-worker) — offline support, caching, registration
  - [2.4 Share Button](#24-share-button-implementation) — Web Share API + clipboard fallback code
- **Phase 3: Advanced**
  - [3.1-3.2 When/Pattern](#31-when-to-use-shareable-links) — decision criteria
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
| Site name | "My Site" | Title, OG tags, structured data |
| Site type | game, app, art/gallery, blog, personal/portfolio, business, docs | Structured data schema, content templates |
| Tagline | "A Short Tagline" | Meta description, social cards |
| Full description | "A compelling 150-char description..." | Meta description (150-160 chars max) |
| Production domain | mysite.example.com | Canonical URL, OG URLs, sitemap |
| Brand/Site name | "My Studio" or "Luna Gallery" | og:site_name |
| Author/Creator name | "Jane Doe" or "My Studio" | JSON-LD author (can be same as brand) |
| Author type | Person or Organization | JSON-LD `@type` for author |
| Primary brand color | #3b82f6 | theme-color, PWA colors |
| Secondary/background color | #1e40af | PWA background_color |

**Additional info by site type** (ask only what's relevant):

| Site Type | Also Ask |
|-----------|----------|
| Game | Genre (e.g., Puzzle, Strategy), play mode (SinglePlayer/MultiPlayer), studio website URL |
| App | Application category (e.g., Productivity, Finance, Education), author website URL |
| Art/Gallery | Art medium/form (e.g., Digital Art, Photography), social media profile URLs |
| Personal/Portfolio | Job title, key skills, social media profile URLs (GitHub, LinkedIn, etc.) |
| Business | Contact email, social media profile URLs |
| Blog | Author bio URL, social media profile URLs |

**Title/description length**: The ranges (50-60 chars for title, 150-160 for description) are maximums to avoid truncation, not minimums. Shorter natural values are fine.

---

## Files to Create

Here's exactly what you'll create (PWA files only if user opts in):

```
project/
├── index.html            # Add meta tags to <head>
├── favicon.ico           # 32x32 - legacy browsers
├── icon.svg              # Scalable - modern browsers
├── apple-touch-icon.png  # 180x180 - iOS home screen
├── social-card.jpg       # 1200x630 - social media preview
├── robots.txt            # Search engine instructions
├── sitemap.xml           # Page listing for search engines
├── icon-192.png          # 192x192 - Android/PWA (PWA only)
├── icon-512.png          # 512x512 - PWA splash/install (PWA only)
├── manifest.json         # PWA configuration (PWA only)
├── sw.js                 # Service worker (PWA only)
├── screenshot-wide.png   # 1280x720 - PWA install preview (PWA only)
└── screenshot-mobile.png # 750x1334 - PWA install preview (PWA only)
```

---

## Quick Start (5-Minute Basics)

**Need social sharing working fast?** Do just these 4 things:

1. **Add to `<head>`:**
```html
<title>[Site Name] - [Tagline]</title>
<meta name="description" content="[150 char description]">
<meta property="og:title" content="[Site Name] - [Tagline]">
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
- **Phase 2 (Enhancement)**: Recommended. Adds structured data, share buttons, and optionally PWA.
- **Phase 3 (Advanced)**: Only when needed. Shareable result/state links.

Check items off the checklists as you complete them. Replace `[bracketed placeholders]` in all code snippets.

### Decision Guide

| Scenario | What to Implement |
|----------|-------------------|
| Any website needing social sharing | Phase 1 |
| Interactive app or game for production | Phase 1 + Phase 2 (with PWA) |
| Art site, portfolio, blog, or docs | Phase 1 + Phase 2 (without PWA) |
| Art/game where users share creations/scores | Phase 1 + 2 + 3 |

---

## Phase 1: Foundation (Essential)

**Goal**: Make your site discoverable by search engines and look good when shared on social media.

### 1.1 HTML Meta Tags

Add this complete block to your `<head>`:

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Basic SEO -->
  <title>[Site Name] - [Tagline]</title>
  <meta name="description" content="[Action-oriented description, 150-160 chars]">
  <link rel="canonical" href="https://[your-domain]">
  <meta name="theme-color" content="[primary-color]">

  <!-- Favicon (modern best practice: ICO for legacy, SVG for modern browsers) -->
  <link rel="icon" href="favicon.ico" sizes="32x32">
  <link rel="icon" href="icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="apple-touch-icon.png">

  <!-- Open Graph (Facebook, Discord, LinkedIn, iMessage, etc.) -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://[your-domain]">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="[Site Name] - [Tagline]">
  <meta property="og:description" content="[Description]">
  <meta property="og:image" content="https://[your-domain]/social-card.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="[Descriptive alt text for the image]">
  <meta property="og:site_name" content="[Brand Name]">

  <!-- Twitter/X (twitter:url is unnecessary - X derives it from the shared link) -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="[Site Name] - [Tagline]">
  <meta name="twitter:description" content="[Description]">
  <meta name="twitter:image" content="https://[your-domain]/social-card.jpg">
  <meta name="twitter:image:alt" content="[Descriptive alt text for the image]">
</head>
```

### 1.2 Meta Content Patterns

**Title** (50-60 chars): `[Name] - [Value Proposition]`

**Description** (150-160 chars): `[Action verb] + [what user does/gets] + [benefit/outcome]`

Examples by site type:
- **Game**: "Challenge your word skills in daily puzzles. Compete with friends and track your streak."
- **App**: "Organize your tasks effortlessly. Simple, fast, and works offline."
- **Art/Gallery**: "Digital illustrations and concept art by Alex Chen. Fantasy worlds brought to life."
- **Blog**: "Insights on frontend development, performance, and design patterns. Updated weekly."
- **Personal/Portfolio**: "Design and development work by Jane Doe. Specializing in interactive experiences."
- **Business**: "Custom web development for startups. Fast, accessible, and built to scale."
- **Docs**: "Complete API reference and guides for Acme SDK. Quick start tutorials and code examples."

### 1.3 Social Card Image

**Requirements:**

| Aspect | Specification |
|--------|---------------|
| Size | 1200 x 630 pixels (1.91:1 ratio) |
| Format | JPG preferred (smaller file size) |
| Max file size | Under 300KB ideal, under 1MB max |
| Safe zone | Keep important content 50-100px from edges |

**Design tips:**
1. Include site name/logo prominently
2. Use high-contrast, bold text readable at thumbnail size
3. Consider adding your domain URL
4. Keep the most important content centered — some platforms (WhatsApp) crop to square from center
5. Test at 300px width - can you still read it?

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

1. Create `social-card.html` in project root (customize colors, fonts, layout to match your site):
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
    <h1>[Your Site Name]</h1>
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

**Before creating `robots.txt`, ask the user:**

1. **"Are there paths that should be hidden from search engines?"** Common examples:
   - `/admin`, `/dashboard` — admin/management interfaces
   - `/api` — API endpoints (no reason to index)
   - `/drafts`, `/preview` — unpublished content
   - `/assets/private` — private uploads or files
   - `/staging` — staging/test content
   - Query parameters like `?preview=true` (use `<meta name="robots" content="noindex">` on those pages instead)

2. **"Do you want to block AI training crawlers?"** (see below)

**robots.txt** (place in root — customize `Disallow` lines based on answers):
```txt
User-agent: *
Allow: /
# Disallow: /admin/
# Disallow: /api/
# Disallow: /drafts/

Sitemap: https://[your-domain]/sitemap.xml
```

**Note:** `robots.txt` is publicly readable — don't rely on it to hide sensitive URLs (it actually advertises them). For truly private content, use authentication instead. For pages that shouldn't appear in search results but aren't secret, use `<meta name="robots" content="noindex">` in the HTML `<head>`.

**Optional — Block AI training crawlers** (if you don't want content used for AI training):
```txt
# AI training crawlers (block these to prevent training on your content)
User-agent: GPTBot
User-agent: ChatGPT-User
User-agent: ClaudeBot
User-agent: anthropic-ai
User-agent: CCBot
User-agent: Google-Extended
User-agent: Applebot-Extended
User-agent: Bytespider
User-agent: meta-externalagent
User-agent: FacebookBot
Disallow: /

# AI search bots (uncomment to also block AI-powered search results)
# User-agent: OAI-SearchBot
# User-agent: PerplexityBot
# Disallow: /
```

**Tip:** Keep AI search bots (`OAI-SearchBot`, `PerplexityBot`) allowed so your site appears in AI-powered search results, while blocking training bots above.

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
| `favicon.ico` | 32x32 | Legacy browsers, Google search results |
| `icon.svg` | Scalable | Modern browsers (crisp at any zoom, supports dark mode) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

**Note:** Google requires at least 48x48 for search result favicons. The ICO file at 32x32 meets this minimum when rendered, but consider including 48x48 in the ICO if possible.

**SVG favicon** (preferred for modern browsers — supports dark mode via CSS media query):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <style>
    circle { fill: #3b82f6; }
    @media (prefers-color-scheme: dark) {
      circle { fill: #60a5fa; }
    }
  </style>
  <circle cx="16" cy="16" r="14"/>
</svg>
```

**Converting to ICO:** If you created a PNG or used browser tools for a screenshot, convert: `magick favicon-32.png favicon.ico`. For SVG icons, first render to PNG at 32x32 via browser screenshot, then convert to ICO.

**For complex graphics** (logos, characters, detailed artwork), use the browser control tools to screenshot HTML at each required size.

```html
<link rel="icon" href="favicon.ico" sizes="32x32">
<link rel="icon" href="icon.svg" type="image/svg+xml">
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
- [ ] `favicon.ico` created (32x32)
- [ ] `icon.svg` created (scalable, with optional dark mode support)
- [ ] `apple-touch-icon.png` created (180x180)
- [ ] `social-card.jpg` created (1200x630)
- [ ] `robots.txt` with sitemap reference
- [ ] `sitemap.xml` with lastmod date

**Test Phase 1:** Validate at [OpenGraph.xyz](https://www.opengraph.xyz/)

---

## Phase 2: Enhancement (Recommended)

**Goal**: Add structured data for rich search results, optionally PWA support for installability, and share functionality.

### 2.1 Structured Data (JSON-LD)

Add inside `<head>`, after the Twitter meta tags. Choose the template that matches the **site type**.

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
  "image": "https://[your-domain]/social-card.jpg",
  "applicationCategory": "[Category]",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript",
  "inLanguage": "en",
  "author": {
    "@type": "Organization",
    "name": "[Author Name]",
    "url": "https://[author-website]"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  }
}
</script>
```

**For Blogs:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "[Blog Name]",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "image": "https://[your-domain]/social-card.jpg",
  "inLanguage": "en",
  "author": {
    "@type": "Person",
    "name": "[Author Name]",
    "url": "https://[author-website]"
  }
}
</script>
```

**For Art Sites / Galleries:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[Artist Name] - [Art Site Name]",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "image": "https://[your-domain]/social-card.jpg",
  "author": {
    "@type": "Person",
    "name": "[Artist Name]",
    "jobTitle": "Artist",
    "url": "https://[your-domain]",
    "sameAs": [
      "https://instagram.com/[username]",
      "https://[art-platform].com/[username]"
    ]
  }
}
</script>
```

For individual artwork pages, use `VisualArtwork` instead:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  "name": "[Artwork Title]",
  "description": "[Description of the piece]",
  "image": "https://[your-domain]/[artwork-image].jpg",
  "artform": "[Digital Art, Painting, Photography, Illustration, etc.]",
  "artMedium": "[Digital, Oil on Canvas, Watercolor, etc.]",
  "creator": {
    "@type": "Person",
    "name": "[Artist Name]",
    "url": "https://[your-domain]"
  },
  "dateCreated": "[YYYY-MM-DD]"
}
</script>
```

**For Personal Sites / Portfolios:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "name": "[Your Name] - Portfolio",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "image": "https://[your-domain]/social-card.jpg",
  "dateModified": "[YYYY-MM-DD]",
  "mainEntity": {
    "@type": "Person",
    "name": "[Your Name]",
    "jobTitle": "[Your Title]",
    "url": "https://[your-domain]",
    "knowsAbout": ["[Skill 1]", "[Skill 2]", "[Skill 3]"],
    "sameAs": [
      "https://github.com/[username]",
      "https://linkedin.com/in/[username]",
      "https://twitter.com/[username]"
    ]
  }
}
</script>
```

**For Business/Organization:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "[Business Name]",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "image": "https://[your-domain]/social-card.jpg",
  "logo": "https://[your-domain]/logo.png",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "[contact email]",
    "contactType": "customer service"
  },
  "sameAs": [
    "https://twitter.com/[handle]",
    "https://linkedin.com/company/[name]"
  ]
}
</script>
```

**For Documentation Sites:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "[Docs Name]",
  "description": "[Description]",
  "url": "https://[your-domain]",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://[your-domain]/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>
```

**Note:** Only include `potentialAction: SearchAction` if your site has a working search endpoint. For static sites without search, remove that block.

**Note on pricing:** The Game and WebApplication templates include `"offers": { "price": "0" }` assuming a free site. Adjust or remove the `offers` block for paid apps or subscriptions.

**Test:** Validate at [Google Rich Results Test](https://search.google.com/test/rich-results)

### 2.2 PWA Manifest

> **Only create if user opted in to PWA support.**

**manifest.json** (create in root):
```json
{
  "id": "/",
  "name": "[Full Site Name]",
  "short_name": "[Short Name]",
  "description": "[Brief description]",
  "start_url": "/",
  "display": "standalone",
  "orientation": "any",
  "background_color": "[secondary-color]",
  "theme_color": "[primary-color]",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
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

**Maskable icons**: The manifest lists icons twice — once as `any` (default, no `purpose` field) and once as `maskable`. For the maskable version, keep main content in the center 80% of the image. If your icon already has sufficient padding, you can use the same image file for both; otherwise create a separate padded version for the maskable entries.

**Creating PWA screenshots** (same workflow as social card images):

1. Create `screenshot-template.html` — a page showing your app's UI or a representative mockup:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; overflow: hidden; }
    .screen {
      width: 100%; height: 100%;
      background: [secondary-color];
      display: flex; flex-direction: column;
    }
    .header {
      background: [primary-color]; color: white;
      padding: 16px 24px; font-size: 20px; font-weight: bold;
    }
    .content {
      flex: 1; padding: 24px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .card {
      background: white; border-radius: 12px;
      padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .card h3 { margin-bottom: 8px; color: [primary-color]; }
    .card p { color: #666; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="screen">
    <div class="header">[Site Name]</div>
    <div class="content">
      <div class="card">
        <h3>[Feature or Content Title]</h3>
        <p>[Brief description of what the user sees]</p>
      </div>
      <div class="card">
        <h3>[Another Feature]</h3>
        <p>[Description]</p>
      </div>
    </div>
  </div>
</body>
</html>
```

2. Capture **wide screenshot** (1280x720):
   - Navigate to `file:///[path]/screenshot-template.html`
   - Resize viewport to 1280 x 720
   - Screenshot as `screenshot-wide.png`

3. Capture **mobile screenshot** (750x1334):
   - Resize viewport to 750 x 1334
   - Screenshot as `screenshot-mobile.png`

4. Delete `screenshot-template.html`

**Alternatively**, if the app is already running locally, navigate to `http://localhost:[port]` and capture screenshots at each viewport size directly — this gives more realistic previews.

### 2.3 Service Worker

> **Only create if user opted in to PWA support.** A service worker is **strongly recommended** for a full PWA. While Chrome 112+ can trigger install prompts from a manifest alone, a service worker is needed for offline support, caching, and passing Lighthouse PWA audits. Always include one.

**sw.js** (create in project root):
```javascript
const CACHE_NAME = 'v1';

// Files to cache for offline use (the "app shell")
// Customize this list to match the project's actual files
const APP_SHELL = [
  '/',
  '/style.css',
  '/app.js',
  '/favicon.ico',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Install: precache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for static assets, network-first for navigation
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Navigation requests (HTML pages): network-first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
```

**Register the service worker** — add this script to your HTML, just before `</body>` or in your main JS file:
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
</script>
```

**Key points:**
- **HTTPS required** (localhost exempt) — service workers will not register on plain HTTP
- `sw.js` **must** be in the project root (or the scope it controls will be limited to its directory)
- Update `CACHE_NAME` (e.g., `'v2'`) when deploying changes to force cache refresh
- Customize `APP_SHELL` to list the actual files in the project
- The `skipWaiting()` + `clients.claim()` pattern ensures the new service worker activates immediately
- Navigation requests use network-first so users always get fresh content when online
- Static assets use cache-first for fast loading

**Cache versioning:** When you deploy updates, increment the cache name (e.g., `'v1'` to `'v2'`). The `activate` handler will automatically delete old caches.

### 2.4 Share Button Implementation

Add a share button that uses the Web Share API with clipboard fallback.

**Requirements:** HTTPS required (localhost exempt). Must be triggered by user gesture (button click).

```javascript
async function shareContent(shareData) {
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
    await navigator.clipboard.writeText(shareData.url || shareData.text);
    showFeedback('Copied!', document.activeElement); // ALWAYS show visual confirmation
  } catch (err) {
    // 3. Final fallback - show text in a selectable element
    showCopyFallbackUI(shareData.url || shareData.text);
  }
}

// Visual feedback helper - update button text temporarily
function showFeedback(message, buttonEl) {
  const original = buttonEl.textContent;
  buttonEl.textContent = message;
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
  shareContent({
    title: '[Site Name]',
    text: '[Share message or description]',
    url: window.location.href
  });
});
```

**Share text best practices:**
1. Lead with something attention-grabbing for social feeds
2. Use clear line breaks for structure
3. Keep total under 280 characters if Twitter/X matters
4. **Always include your URL**

### Phase 2 Checklist

- [ ] JSON-LD structured data added to `<head>` (schema matches site type)
- [ ] Validated at Rich Results Test
- [ ] **If PWA:** `manifest.json` created and linked
- [ ] **If PWA:** `sw.js` service worker created with app shell cache
- [ ] **If PWA:** Service worker registered in HTML
- [ ] **If PWA:** `icon-192.png` created (192x192)
- [ ] **If PWA:** `icon-512.png` created (512x512)
- [ ] **If PWA:** PWA screenshots created (wide + narrow)
- [ ] **If PWA:** `mobile-web-app-capable` meta added
- [ ] Share button implemented
- [ ] Web Share API with clipboard fallback
- [ ] Visual "Copied!" feedback shown
- [ ] Share content includes URL

**Test Phase 2:** Run Lighthouse audit in Chrome DevTools (check PWA section if applicable)

---

## Phase 3: Advanced Features

**Goal**: Enable shareable links that encode user state/results for others to view.

*Only implement this if users will share content that should be viewable by others (scores, configurations, quiz results, curated selections, etc.).*

### 3.1 When to Use Shareable Links

Shareable links are useful when:
- Users complete something and want to show others (scores, achievements, quiz results)
- Users create a configuration or selection others should see (playlists, color palettes, builds)
- The shared view should display content without requiring the viewer to recreate it
- You want viral sharing where clicking a link shows what someone created/achieved

### 3.2 The Pattern

1. **Encode state** into a short URL parameter
2. **Parse parameter** on page load
3. **Display shared view** without affecting viewer's own data
4. **Provide CTA** that clears the parameter and lets the viewer engage

### 3.3 Implementation Approach

**URL Structure:**
```
https://your-domain.com?s=abc123
```

**State Encoding — JSON + base64url (recommended default):**

Use this for any state shape. Works with objects, arrays, strings, numbers — anything JSON-serializable.

```javascript
function encodeState(stateObj) {
  return btoa(JSON.stringify(stateObj))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeState(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(padded));
  } catch (e) {
    return null;
  }
}
```

**Compact encoding (optimization for very short URLs):**

If URL length is critical and the state is a small fixed-size array of small integers (e.g., a Wordle-like grid of 0-4 values, max ~13 items), use this compact base-5 encoder instead:

```javascript
function encodeStateCompact(stateArray) {
  const salt = 0x7B3F; // Simple obfuscation (not security!)
  let value = 0;
  for (let i = 0; i < stateArray.length; i++) {
    value = value * 5 + (stateArray[i] || 0);
  }
  const checksum = stateArray.reduce((a, b) => a + b, 0) % 16;
  const encoded = (value ^ salt) * 16 + checksum;
  return encoded.toString(36);
}

function decodeStateCompact(encoded, expectedLength) {
  try {
    const salt = 0x7B3F;
    const value = parseInt(encoded, 36);
    const checksum = value % 16;
    const data = Math.floor(value / 16) ^ salt;
    const state = [];
    let remaining = data;
    for (let i = 0; i < expectedLength; i++) {
      state.unshift(remaining % 5);
      remaining = Math.floor(remaining / 5);
    }
    if (state.reduce((a, b) => a + b, 0) % 16 !== checksum) return null;
    return state;
  } catch (e) {
    return null;
  }
}
```
```

**Share Link Generation:**
```javascript
// Build a shareable URL with encoded state
function generateShareLink(state) {
  const encoded = encodeState(state); // or encodeStateCompact(state) for short URLs
  return `${window.location.origin}${window.location.pathname}?s=${encoded}`;
}
```

**Integrating with Phase 2 Share Button:** If you implemented the Phase 2 share button, update it to share the stateful URL instead of `window.location.href`:
```javascript
shareButton.addEventListener('click', () => {
  const state = getCurrentState(); // your app's state to share
  const shareUrl = generateShareLink(state);
  shareContent({
    title: '[Site Name] - My Results',
    text: '[Share message]',
    url: shareUrl
  });
});
```

**Shared Content Landing Page:**

```javascript
function initializeApp() {
  // Check for shared state FIRST, before normal initialization
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('s');

  if (encoded) {
    const sharedState = decodeState(encoded); // returns parsed object/array, or null
    if (sharedState && isValidState(sharedState)) {
      showSharedContentScreen(sharedState);
      return; // Don't initialize normally
    }
  }

  // Normal app initialization
  startApp();
}

function showSharedContentScreen(sharedState) {
  // Display content (READ-ONLY - never write to localStorage!)
  displayContent(sharedState);

  // Clear messaging
  showMessage("You're viewing shared content - try it yourself!");

  // CTA button
  showButton('Try It Yourself!', () => {
    // Clean URL parameter
    window.history.replaceState({}, '', window.location.pathname);
    // Start app (loads user's own data from localStorage)
    startApp();
  });
}
```

**Critical Rules:**
1. **NEVER overwrite user's localStorage** with shared state
2. **Always show "shared content" messaging** so viewer knows it's not their data
3. **Clean URL** when user engages with their own experience
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
- [ ] Shared content display (read-only view)
- [ ] "Shared content" messaging shown
- [ ] CTA button to engage directly
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
| PWA not installable | Ensure manifest.json is linked **and** service worker is registered |
| Service worker missing | A manifest alone does NOT make a PWA - you need sw.js |
| Old service worker cache | Increment `CACHE_NAME` version on every deploy |
| Service worker scope issues | Place sw.js in root, or use `Service-Worker-Allowed` header |

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

Before deploying, verify all items. Items marked with (PWA) are only needed if PWA was opted into. Items marked with (P3) are only needed if Phase 3 was implemented.

### Files Created
- [ ] `favicon.ico` (32x32)
- [ ] `icon.svg` (scalable)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `social-card.jpg` (1200x630)
- [ ] `robots.txt`
- [ ] `sitemap.xml`
- [ ] `icon-192.png` (192x192) (PWA)
- [ ] `icon-512.png` (512x512) (PWA)
- [ ] `manifest.json` (PWA)
- [ ] `sw.js` (PWA)
- [ ] `screenshot-wide.png` (1280x720) (PWA)
- [ ] `screenshot-mobile.png` (750x1334) (PWA)

### HTML `<head>` Contains
- [ ] `<html lang="en">`
- [ ] `<title>` (50-60 chars)
- [ ] `<meta name="description">` (150-160 chars)
- [ ] `<link rel="canonical">` (absolute URL)
- [ ] `<meta name="theme-color">`
- [ ] `<link rel="icon">` (both ICO and SVG)
- [ ] `<link rel="apple-touch-icon">`
- [ ] All `og:*` tags with absolute URLs
- [ ] All `twitter:*` tags (except `twitter:url` -- unnecessary)
- [ ] `<link rel="manifest">` (PWA)
- [ ] `mobile-web-app-capable` meta (PWA)
- [ ] Service worker registration script (PWA)
- [ ] JSON-LD script (site-type-appropriate schema)

### JavaScript Functions (P2/P3)
- [ ] Share button with Web Share API (P2)
- [ ] Clipboard fallback with feedback (P2)
- [ ] State encoding/decoding (P3)
- [ ] Shared view display (P3)
- [ ] URL cleanup on CTA (P3)

### External Validation
- [ ] OpenGraph.xyz shows correct preview
- [ ] Rich Results Test passes (P2)
- [ ] Lighthouse PWA audit passes (PWA)

---

*This guide provides patterns for comprehensive SEO and social sharing on any website. Adapt the specifics to your project while following the phase structure and principles above.*
