---
name: social-seo
description: Implement SEO and social sharing for any website. Adds meta tags, Open Graph, Twitter cards, social card images, structured data, optional PWA support with service worker, share buttons, and shareable result links.
disable-model-invocation: true
argument-hint: [phase1|phase2|phase3|all]
---

# Social & SEO Implementation Skill

Implement comprehensive SEO and social sharing capabilities for any web-based project. See [reference.md](reference.md) for detailed templates, code snippets, and platform-specific notes.

## Arguments

- `phase1` - Foundation only (meta tags, social card, robots.txt, sitemap)
- `phase2` - Foundation + Enhancement (adds structured data, share buttons, and optionally PWA)
- `phase3` - All phases including shareable result links
- `all` - Same as phase3
- No argument - Ask user which phases to implement

## Step 1: Gather Required Information

Before implementing, collect this information from the user:

| Information | Example | Used For |
|-------------|---------|----------|
| Site name | "My Site" | Title, OG tags, structured data |
| Site type | game, app, art/gallery, blog, personal/portfolio, business, docs | Structured data, content templates |
| Tagline | "A Short Tagline" | Meta description, social cards |
| Full description | "A compelling 150-char description..." | Meta description (150-160 chars) |
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

Use AskUserQuestion to gather any missing information. **Site type** is important - it determines which structured data schema, content patterns, and additional info to collect.

**Title/description length**: If the natural title is under 50 chars or description under 150 chars, that's fine — don't pad artificially. The ranges (50-60, 150-160) are maximums to avoid truncation, not minimums to hit.

## Step 2: Determine Project Structure

1. Find the main HTML file (usually `index.html`)
2. Identify existing `<head>` content to preserve — do not duplicate tags that already exist
3. Note the project root for asset placement

**Framework note:** For framework-based sites (React, Vue, Svelte, Astro, Next.js, etc.), meta tags may need to go in a layout component or framework-specific head management (e.g., `next/head`, `svelte:head`, Astro frontmatter) rather than a raw HTML file. Static assets still go in the public/root directory.

---

## Phase 1: Foundation (Essential)

### 1.1 HTML Meta Tags

Add to `<head>` (ensure `<html lang="en">` is set):

```html
<!-- Basic SEO -->
<title>[Site Name] - [Tagline]</title>
<meta name="description" content="[150-160 char description]">
<link rel="canonical" href="https://[domain]">
<meta name="theme-color" content="[primary-color]">

<!-- Favicon (ICO for legacy, SVG for modern browsers with dark mode support) -->
<link rel="icon" href="favicon.ico" sizes="32x32">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="apple-touch-icon.png">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://[domain]">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="[Site Name] - [Tagline]">
<meta property="og:description" content="[Description]">
<meta property="og:image" content="https://[domain]/social-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="[Alt text - describe what is visually shown, not the site's purpose]">
<meta property="og:site_name" content="[Brand Name]">

<!-- Twitter/X (twitter:url is unnecessary - X derives it from the shared link) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Site Name] - [Tagline]">
<meta name="twitter:description" content="[Description]">
<meta name="twitter:image" content="https://[domain]/social-card.jpg">
<meta name="twitter:image:alt" content="[Alt text]">
```

### 1.2 Create Social Card Image (1200x630)

**Using the pre-configured Playwright browser control (preferred method):**

> **Do NOT install Playwright from npm or write Playwright scripts.** Use only the
> browser control tools already configured in this environment — either Playwright
> MCP tools (e.g. `browser_navigate`, `browser_screenshot`) or Playwright CLI
> commands (e.g. `playwright-cli open`, `playwright-cli screenshot`), whichever is
> available.

1. Create `social-card.html` with project colors/branding (see [reference.md S1.3](reference.md#13-social-card-image) for HTML template)
2. Capture using the pre-configured browser control tools:
   - Navigate to `file:///[path]/social-card.html`
   - Resize the viewport to 1200 x 630
   - Take a screenshot, saving as `social-card.png`
3. Convert to JPG: `magick social-card.png -quality 85 social-card.jpg` (or `convert` on ImageMagick 6)
4. Clean up: delete `social-card.html` and `social-card.png` (keep the HTML if the user may want to iterate on the design later)

**If no browser control tools are available:** Ask the user to provide a social card image (1200x630 JPG), or create one using an external design tool and place it in the project root as `social-card.jpg`.

### 1.3 Create Icon Files

| File | Size | Purpose |
|------|------|---------|
| `favicon.ico` | 32x32 | Legacy browsers, search results |
| `icon.svg` | Scalable | Modern browsers (supports dark mode) |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

**What to put in the icon:** Use the site's initial letter or a simple symbol in the primary brand color. If a logo already exists in the project, use that. Keep it recognizable at 32x32.

**Simple geometric icons:** Write SVG directly. **Complex graphics:** Use browser control tools to screenshot HTML at each size. **Transparency:** Set HTML/body background to `transparent`, use PNG format. See [reference.md S1.5](reference.md#15-icon-files) for details.

### 1.4 Search Engine Files

**Before creating `robots.txt`, ask the user these questions:**

1. **"Are there any paths or directories that should be hidden from search engines?"** (e.g., `/admin`, `/api`, `/staging`, `/drafts`, private asset folders). Most single-page sites can use `Allow: /`, but sites with admin panels, API endpoints, draft/preview pages, or private directories should disallow those paths.

2. **"Do you want to block AI training crawlers?"** If yes, see [reference.md S1.4](reference.md#14-search-engine-files) for the full bot list. **Tip:** Allow search-only bots (`OAI-SearchBot`, `PerplexityBot`) while blocking training bots.

**Basic robots.txt** (adjust `Disallow` lines based on user answers):
```
User-agent: *
Allow: /

Sitemap: https://[domain]/sitemap.xml
```

**sitemap.xml** (`changefreq`/`priority` are ignored by Google; only `lastmod` matters if consistently accurate):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://[domain]/</loc>
    <lastmod>[YYYY-MM-DD]</lastmod>
  </url>
</urlset>
```

### Phase 1 Checklist
- [ ] `<html lang="en">` set
- [ ] `<title>` (50-60 chars)
- [ ] `<meta name="description">` (150-160 chars)
- [ ] `<link rel="canonical">` absolute URL
- [ ] `<meta name="theme-color">`
- [ ] All `og:*` tags with absolute URLs
- [ ] All `twitter:*` tags (except `twitter:url`)
- [ ] `favicon.ico` (32x32)
- [ ] `icon.svg` (scalable)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `social-card.jpg` (1200x630)
- [ ] `robots.txt`
- [ ] `sitemap.xml`

---

## Phase 2: Enhancement (Recommended)

### 2.1 Structured Data (JSON-LD)

Add to `<head>` after Twitter tags. Choose the schema based on **site type**:

| Site Type | Schema `@type` |
|-----------|---------------|
| Game | `["VideoGame", "WebApplication"]` (co-typing required for Google rich results) |
| Web app | `"WebApplication"` |
| Art site / Gallery | `"WebSite"` (homepage) or `"VisualArtwork"` (individual pieces) |
| Blog/Article | `"Blog"` or `"Article"` |
| Personal site / Portfolio | `"ProfilePage"` with `"Person"` mainEntity |
| Business | `"LocalBusiness"` or `"Organization"` |
| Documentation | `"WebSite"` with `"potentialAction": "SearchAction"` (if search works) |

See [reference.md S2.1](reference.md#21-structured-data-json-ld) for complete JSON-LD templates for each type.

### 2.2 PWA Support (Optional - Ask User)

**Ask the user:** "Would you like PWA support? This makes your site installable as an app on mobile/desktop, with optional offline support. Recommended for interactive apps and games; usually unnecessary for blogs, portfolios, or documentation sites."

**If the user wants PWA**, implement all of the following:

#### 2.2a Manifest

Create `manifest.json` with `id`, `name`, `short_name`, `display`, `icons`, `screenshots`, and `shortcuts`. Add `<link rel="manifest">` and `<meta name="mobile-web-app-capable">` to `<head>`. Create `icon-192.png` (192x192) and `icon-512.png` (512x512). See [reference.md S2.2](reference.md#22-pwa-manifest) for the complete manifest template.

#### 2.2b Service Worker (Strongly Recommended for PWA)

A service worker is **strongly recommended** for a full PWA experience. While modern browsers (Chrome 112+) can show install prompts with just a manifest, a service worker is needed for offline support, caching, and passing Lighthouse PWA audits.

Create `sw.js` in the project root with a cache-first strategy for static assets and network-first for navigation. Register it from the main HTML file. See [reference.md S2.3](reference.md#23-service-worker) for the complete service worker code and registration snippet.

Key requirements:
- Site must be served over HTTPS (localhost exempt)
- `sw.js` must be in the root (or scope it with `Service-Worker-Allowed` header)
- Cache name should include a version string for easy cache busting
- Must handle the `install`, `activate`, and `fetch` events
- Should precache the app shell (HTML, CSS, JS, icons)
- Should provide an offline fallback for navigation requests

#### 2.2c PWA Icons and Screenshots

| File | Size | Purpose |
|------|------|---------|
| `icon-192.png` | 192x192 | Android/PWA |
| `icon-512.png` | 512x512 | PWA splash/install |
| `screenshot-wide.png` | 1280x720 | PWA install preview (desktop) |
| `screenshot-mobile.png` | 750x1334 | PWA install preview (mobile) |

**If user declines PWA**, skip 2.2 entirely and move to 2.3.

### 2.3 Share Button

Implement Web Share API with clipboard fallback. Requirements: HTTPS (localhost exempt), user gesture trigger. Fallback chain: `navigator.share()` -> `navigator.clipboard.writeText()` -> selectable text element. See [reference.md S2.4](reference.md#24-share-button-implementation) for complete code.

**Ask the user** what content should be shareable (the page URL, a result/score, a custom message, etc.) to tailor the share functionality.

### Phase 2 Checklist
- [ ] JSON-LD structured data added (type matches site)
- [ ] **If PWA:** `manifest.json` created and linked
- [ ] **If PWA:** `sw.js` service worker created
- [ ] **If PWA:** Service worker registered in HTML
- [ ] **If PWA:** `icon-192.png` (192x192)
- [ ] **If PWA:** `icon-512.png` (512x512)
- [ ] **If PWA:** PWA screenshots created (wide + narrow)
- [ ] **If PWA:** `mobile-web-app-capable` meta added
- [ ] Share button implemented
- [ ] Clipboard fallback with visual feedback
- [ ] Share content includes URL

---

## Phase 3: Shareable Result Links

Only implement if users have content/state worth sharing that others should view (scores, configurations, results, selections, etc.).

**Ask the user:** "Do your users have results, configurations, or content they'd want to share via URL? For example: game scores, quiz results, saved configurations, curated selections." This helps determine if Phase 3 is needed and what state to encode.

1. **Encode state** into a short URL parameter (`?s=base36encoded`)
2. **Parse parameter** on page load, before normal initialization
3. **Display shared view** (read-only — NEVER overwrite user's localStorage)
4. **Show "shared content" messaging** so viewer knows it's not their data
5. **Provide CTA** (e.g., "Try it yourself!") that cleans the URL parameter

See [reference.md S3.3](reference.md#33-implementation-approach) for state encoding/decoding code and shared results landing page implementation. See [reference.md S3.4](reference.md#34-localstorage-safety) for localStorage safety wrapper.

### Phase 3 Checklist
- [ ] State encoding/decoding implemented
- [ ] URL parameter parsing (`?s=...`)
- [ ] Share link generation function
- [ ] Shared content display (read-only)
- [ ] "Shared content" messaging shown
- [ ] CTA button cleans URL
- [ ] User localStorage NEVER overwritten by shared state
- [ ] Decoded state validated before use

---

## Testing

| What | Tool |
|------|------|
| Social preview | [OpenGraph.xyz](https://www.opengraph.xyz/) |
| Structured data | [Rich Results Test](https://search.google.com/test/rich-results) |
| PWA | Chrome DevTools > Lighthouse |

Remind user to test with these tools after deployment.

---

## Platform Cache Notes

When updating social cards, add version parameter: `social-card.jpg?v=2`

Force refresh tools:
- Facebook/Threads: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Twitter/X: Compose a draft post with the URL (public validator removed 2022)
- LinkedIn: [Post Inspector](https://www.linkedin.com/post-inspector/)
- Mastodon: No universal tool (each instance caches independently)
- Bluesky: Client-side fetching (no centralized cache to bust)

See [reference.md Platform-Specific Notes](reference.md#platform-specific-notes) for full platform quirks and cache behavior.
