---
name: social-seo
description: Implement SEO and social sharing for web games and apps. Adds meta tags, Open Graph, Twitter cards, social card images, PWA support, share buttons, and shareable result links.
disable-model-invocation: true
argument-hint: [phase1|phase2|phase3|all]
---

# Social & SEO Implementation Skill

Implement comprehensive SEO and social sharing capabilities for web-based projects. See [reference.md](reference.md) for detailed templates, code snippets, and platform-specific notes.

## Arguments

- `phase1` - Foundation only (meta tags, social card, robots.txt, sitemap)
- `phase2` - Foundation + Enhancement (adds PWA, structured data, share buttons)
- `phase3` - All phases including shareable result links
- `all` - Same as phase3
- No argument - Ask user which phases to implement

## Step 1: Gather Required Information

Before implementing, collect this information from the user:

| Information | Example | Used For |
|-------------|---------|----------|
| App/Game name | "My App" | Title, OG tags, structured data |
| Tagline | "A Short Tagline" | Meta description, social cards |
| Full description | "A compelling 150-char description..." | Meta description (150-160 chars) |
| Production domain | myapp.example.com | Canonical URL, OG URLs, sitemap |
| Brand/Studio name | "My Studio" | og:site_name, JSON-LD author |
| Primary brand color | #3b82f6 | theme-color, PWA colors |
| Secondary/background color | #1e40af | PWA background_color |

Use AskUserQuestion to gather any missing information.

## Step 2: Determine Project Structure

1. Find the main HTML file (usually `index.html`)
2. Identify existing `<head>` content to preserve
3. Note the project root for asset placement

---

## Phase 1: Foundation (Essential)

### 1.1 HTML Meta Tags

Add to `<head>` (ensure `<html lang="en">` is set):

```html
<!-- Basic SEO -->
<title>[Game Name] - [Tagline]</title>
<meta name="description" content="[150-160 char description]">
<link rel="canonical" href="https://[domain]">
<meta name="theme-color" content="[primary-color]">

<!-- Favicon -->
<link rel="icon" type="image/png" href="favicon.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">

<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:url" content="https://[domain]">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="[Game Name] - [Tagline]">
<meta property="og:description" content="[Description]">
<meta property="og:image" content="https://[domain]/social-card.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="[Alt text]">
<meta property="og:site_name" content="[Brand Name]">

<!-- Twitter/X (twitter:url is unnecessary - X derives it from the shared link) -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="[Game Name] - [Tagline]">
<meta name="twitter:description" content="[Description]">
<meta name="twitter:image" content="https://[domain]/social-card.jpg">
```

### 1.2 Create Social Card Image (1200x630)

**Using the pre-configured Playwright browser control (preferred method):**

> **Do NOT install Playwright from npm or write Playwright scripts.** Use only the
> browser control tools already configured in this environment — either Playwright
> MCP tools (e.g. `browser_navigate`, `browser_screenshot`) or Playwright CLI
> commands (e.g. `playwright-cli open`, `playwright-cli screenshot`), whichever is
> available.

1. Create `social-card.html` with project colors/branding (see [reference.md §1.3](reference.md#13-social-card-image) for HTML template)
2. Capture using the pre-configured browser control tools:
   - Navigate to `file:///[path]/social-card.html`
   - Resize the viewport to 1200 x 630
   - Take a screenshot, saving as `social-card.png`
3. Convert to JPG: `magick social-card.png -quality 85 social-card.jpg` (or `convert` on ImageMagick 6)
4. Delete `social-card.html` and `social-card.png`

**If no browser control tools are available:** Ask the user to provide a social card image (1200x630 JPG), or create one using an external design tool and place it in the project root as `social-card.jpg`.

### 1.3 Create Icon Files

| File | Size | Purpose |
|------|------|---------|
| `favicon.png` | 32x32 | Browser tab |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

**Simple geometric icons:** Write SVG directly. **Complex graphics:** Use browser control tools to screenshot HTML at each size. **Transparency:** Set HTML/body background to `transparent`, use PNG format. See [reference.md §1.5](reference.md#15-icon-files) for details.

### 1.4 Search Engine Files

**robots.txt:**
```
User-agent: *
Allow: /

Sitemap: https://[domain]/sitemap.xml
```

Ask the user if they want to block AI training crawlers. If yes, see [reference.md §1.4](reference.md#14-search-engine-files) for the full bot list. **Tip:** Allow search-only bots (`OAI-SearchBot`, `PerplexityBot`) while blocking training bots.

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
- [ ] `favicon.png` (32x32)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `social-card.jpg` (1200x630)
- [ ] `robots.txt`
- [ ] `sitemap.xml`

---

## Phase 2: Enhancement (Recommended)

### 2.1 Structured Data (JSON-LD)

Add to `<head>` after Twitter tags. Use `"@type": ["VideoGame", "WebApplication"]` for games (co-typing is required for Google rich results). See [reference.md §2.1](reference.md#21-structured-data-json-ld) for complete JSON-LD templates for games and web apps.

### 2.2 PWA Support

Create `manifest.json` with `id`, `name`, `short_name`, `display`, `icons`, `screenshots`, and `shortcuts`. Add `<link rel="manifest">` and `<meta name="mobile-web-app-capable">` to `<head>`. Create `icon-192.png` (192x192) and `icon-512.png` (512x512). See [reference.md §2.2](reference.md#22-pwa-support) for the complete manifest template.

### 2.3 Share Button

Implement Web Share API with clipboard fallback. Requirements: HTTPS (localhost exempt), user gesture trigger. Fallback chain: `navigator.share()` → `navigator.clipboard.writeText()` → selectable text element. See [reference.md §2.3](reference.md#23-share-button-implementation) for complete code.

### Phase 2 Checklist
- [ ] JSON-LD structured data added
- [ ] `manifest.json` created and linked
- [ ] `icon-192.png` (192x192)
- [ ] `icon-512.png` (512x512)
- [ ] PWA screenshots created (wide + narrow)
- [ ] `mobile-web-app-capable` meta added
- [ ] Share button implemented
- [ ] Clipboard fallback with visual feedback

---

## Phase 3: Shareable Result Links

Only implement if users share scores/achievements that others should view.

1. **Encode state** into a short URL parameter (`?s=base36encoded`)
2. **Parse parameter** on page load, before normal initialization
3. **Display shared view** (read-only — NEVER overwrite user's localStorage)
4. **Show "shared results" messaging** so viewer knows it's not their data
5. **Provide "Play Now" CTA** that cleans the URL parameter

See [reference.md §3.3](reference.md#33-implementation-approach) for state encoding/decoding code and shared results landing page implementation. See [reference.md §3.4](reference.md#34-localstorage-safety) for localStorage safety wrapper.

### Phase 3 Checklist
- [ ] State encoding/decoding implemented
- [ ] URL parameter parsing (`?s=...`)
- [ ] Shared results display (read-only)
- [ ] "Shared results" messaging shown
- [ ] "Play Now" CTA cleans URL
- [ ] User localStorage protected

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
