---
name: social-seo
description: Implement SEO and social sharing for web games and apps. Adds meta tags, Open Graph, Twitter cards, social card images, PWA support, share buttons, and shareable result links.
disable-model-invocation: true
argument-hint: [phase1|phase2|phase3|all]
---

# Social & SEO Implementation Skill

Implement comprehensive SEO and social sharing capabilities for web-based projects. This skill guides you through adding meta tags, social cards, PWA support, and shareable links.

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

## Phase 1: Foundation (Essential)

### 1.1 HTML Meta Tags

Add to `<head>`:

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

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:url" content="https://[domain]">
<meta name="twitter:title" content="[Game Name] - [Tagline]">
<meta name="twitter:description" content="[Description]">
<meta name="twitter:image" content="https://[domain]/social-card.jpg">
```

Ensure `<html lang="en">` is set.

### 1.2 Create Social Card Image (1200x630)

**Using Playwright MCP (preferred method):**

1. Create `social-card.html` with project colors/branding:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=1200, height=630">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .card {
      width: 100%; height: 100%;
      background: linear-gradient(135deg, [primary-color] 0%, [secondary-color] 100%);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 60px;
    }
    h1 { color: white; font-size: 72px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); text-align: center; }
    .tagline { color: rgba(255,255,255,0.9); font-size: 32px; margin-top: 20px; }
    .domain { position: absolute; bottom: 30px; right: 40px; color: rgba(255,255,255,0.8); font-size: 24px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>[Game Name]</h1>
    <div class="tagline">[Tagline]</div>
    <div class="domain">[domain]</div>
  </div>
</body>
</html>
```

2. Capture with Playwright MCP:
   - `browser_navigate` to `file:///[path]/social-card.html`
   - `browser_resize` to width: 1200, height: 630
   - `browser_take_screenshot` as `social-card.png`

3. Convert to JPG: `convert social-card.png -quality 85 social-card.jpg`

4. Delete `social-card.html` and `social-card.png`

### 1.3 Create Icon Files

| File | Size | Purpose |
|------|------|---------|
| `favicon.png` | 32x32 | Browser tab |
| `apple-touch-icon.png` | 180x180 | iOS home screen |

Create these from existing project assets or generate using the social card colors.

**Transparency:** When creating icons with rounded corners or non-rectangular shapes, ensure the background is transparent (not white). If using Playwright MCP to capture icons, set the HTML/body background to `transparent` and use PNG format (not JPG). When converting or processing, preserve the alpha channel.

### 1.4 Search Engine Files

**robots.txt:**
```
User-agent: *
Allow: /

Sitemap: https://[domain]/sitemap.xml
```

**sitemap.xml:**
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
- [ ] All `twitter:*` tags
- [ ] `favicon.png` (32x32)
- [ ] `apple-touch-icon.png` (180x180)
- [ ] `social-card.jpg` (1200x630)
- [ ] `robots.txt`
- [ ] `sitemap.xml`

---

## Phase 2: Enhancement (Recommended)

### 2.1 Structured Data (JSON-LD)

Add to `<head>` after Twitter tags.

**For Games:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "VideoGame",
  "name": "[Game Name]",
  "description": "[Description]",
  "url": "https://[domain]",
  "image": "https://[domain]/social-card.jpg",
  "genre": ["Puzzle", "Casual"],
  "gamePlatform": "Web Browser",
  "applicationCategory": "Game",
  "operatingSystem": "Any",
  "playMode": "SinglePlayer",
  "inLanguage": "en",
  "author": { "@type": "Organization", "name": "[Brand Name]" },
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
```

**For Web Apps:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "[App Name]",
  "description": "[Description]",
  "url": "https://[domain]",
  "applicationCategory": "[Category]",
  "operatingSystem": "Any",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
}
</script>
```

### 2.2 PWA Support

**manifest.json:**
```json
{
  "name": "[Full App Name]",
  "short_name": "[Short Name]",
  "description": "[Description]",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "[bg-color]",
  "theme_color": "[primary-color]",
  "icons": [
    { "src": "favicon.png", "sizes": "32x32", "type": "image/png" },
    { "src": "apple-touch-icon.png", "sizes": "180x180", "type": "image/png" },
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

**Add to `<head>`:**
```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

**Create additional icons:**
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)

### 2.3 Share Button

Add share functionality with Web Share API + clipboard fallback:

```javascript
async function shareResults(shareData) {
  if (navigator.share) {
    try {
      await navigator.share({ title: shareData.title, text: shareData.text });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  try {
    await navigator.clipboard.writeText(shareData.text);
    showFeedback('Copied!');
  } catch (err) {
    prompt('Copy your results:', shareData.text);
  }
}
```

**Always show visual feedback** when copying to clipboard.

### Phase 2 Checklist
- [ ] JSON-LD structured data added
- [ ] `manifest.json` created and linked
- [ ] `icon-192.png` (192x192)
- [ ] `icon-512.png` (512x512)
- [ ] Apple PWA metas added
- [ ] Share button implemented
- [ ] Clipboard fallback with visual feedback

---

## Phase 3: Shareable Result Links

Only implement if users share scores/achievements that others should view.

### 3.1 State Encoding

```javascript
function encodeState(stateArray) {
  const salt = 0x7B3F;
  let value = 0;
  for (let i = 0; i < stateArray.length; i++) {
    value = value * 5 + (stateArray[i] || 0);
  }
  const checksum = stateArray.reduce((a, b) => a + b, 0) % 16;
  return (((value ^ salt) << 4) | checksum).toString(36);
}

function decodeState(encoded, expectedLength) {
  try {
    const salt = 0x7B3F;
    const value = parseInt(encoded, 36);
    const checksum = value & 0xF;
    const data = (value >> 4) ^ salt;
    const state = [];
    let remaining = data;
    for (let i = 0; i < expectedLength; i++) {
      state.unshift(remaining % 5);
      remaining = Math.floor(remaining / 5);
    }
    if (state.reduce((a, b) => a + b, 0) % 16 !== checksum) return null;
    return state;
  } catch (e) { return null; }
}
```

### 3.2 Shared Results View

```javascript
function initializeApp() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('s');

  if (encoded) {
    const sharedState = decodeState(encoded, EXPECTED_LENGTH);
    if (sharedState && isValidState(sharedState)) {
      showSharedResultsScreen(sharedState);
      return;
    }
  }
  startGame();
}

function showSharedResultsScreen(sharedState) {
  displayResults(sharedState);
  showMessage("Shared results - play to set your own records!");
  showButton('Play Now!', () => {
    window.history.replaceState({}, '', window.location.pathname);
    startGame();
  });
}
```

**Critical:** NEVER overwrite user's localStorage with shared state.

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
- Facebook: [Sharing Debugger](https://developers.facebook.com/tools/debug/)
- Twitter/X: [Card Validator](https://cards-dev.twitter.com/validator)
- LinkedIn: [Post Inspector](https://www.linkedin.com/post-inspector/)
