# iStory SEO Audit Report

**Date:** January 29, 2026
**App:** iStory - AI-Powered Blockchain Journaling dApp
**URL:** https://istory.vercel.app
**Stack:** Next.js 15.5.9, React 19, Supabase, Base (Ethereum L2)

---

## Score Summary

| Category | Score | Status |
|----------|-------|--------|
| Metadata & Titles | 4/10 | Needs work |
| Sitemap & Robots | 0/10 | Missing |
| Structured Data (JSON-LD) | 0/10 | Missing |
| Open Graph / Social Sharing | 3/10 | Partial |
| Semantic HTML | 8/10 | Good |
| Image Optimization | 5/10 | Inconsistent |
| Dynamic Page Metadata | 1/10 | Missing |
| Performance / Crawlability | 5/10 | Client-side rendering risk |
| PWA / Manifest | 0/10 | Missing |
| Favicon & Icons | 1/10 | Missing |
| **Overall** | **27/100** | **Needs significant work** |

---

## Critical Issues

### 1. No Dynamic Metadata for Story Pages

**File:** `app/story/[storyId]/page.tsx`

Story pages are client-side rendered (`"use client"`) with no `generateMetadata` export. Every story shares the same generic title and description from the root layout. Search engines cannot differentiate stories.

**Impact:** Each story URL looks identical to Google. Zero unique indexing value per story.

**Fix:** Add server-side `generateMetadata` function:
```typescript
export async function generateMetadata({ params }: { params: { storyId: string } }): Promise<Metadata> {
  const story = await fetchStoryServerSide(params.storyId);
  return {
    title: `${story.title} | iStory`,
    description: story.content?.slice(0, 155) + '...',
    openGraph: {
      title: story.title,
      description: story.content?.slice(0, 155),
      type: 'article',
      publishedTime: story.created_at,
      authors: [story.author_name],
    },
  };
}
```

### 2. No sitemap.xml

**Missing file:** `app/sitemap.ts`

No sitemap exists. Search engines have no efficient way to discover the app's stories, profiles, or pages.

**Fix:** Create `app/sitemap.ts`:
```typescript
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const stories = await fetchAllPublicStoryIds();
  return [
    { url: 'https://istory.vercel.app', lastModified: new Date(), priority: 1 },
    { url: 'https://istory.vercel.app/social', priority: 0.8 },
    { url: 'https://istory.vercel.app/record', priority: 0.7 },
    ...stories.map(s => ({
      url: `https://istory.vercel.app/story/${s.id}`,
      lastModified: new Date(s.updated_at),
      priority: 0.6,
    })),
  ];
}
```

### 3. No robots.txt

**Missing file:** `app/robots.ts`

No crawl directives exist. API routes and auth pages could be indexed unnecessarily.

**Fix:** Create `app/robots.ts`:
```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/'] },
    sitemap: 'https://istory.vercel.app/sitemap.xml',
  };
}
```

### 4. No Structured Data (JSON-LD)

No Schema.org markup anywhere. Stories are perfect candidates for `BlogPosting` schema, which enables rich snippets in Google Search (author, date, description).

**Impact:** No rich snippets, no Knowledge Graph eligibility, no voice assistant understanding.

### 5. Client-Side Rendering for Story Content

Story pages fetch data client-side via Supabase. Google's crawler may not see story content on first load, hurting indexing.

**Impact:** Story content may not be indexed by search engines.

---

## High Priority Issues

### 6. No Open Graph Images

**File:** `app/layout.tsx` (lines 13-25)

Root metadata defines OG title/description but no `image`. Social shares on Twitter, Facebook, LinkedIn show no thumbnail.

```typescript
// Current (missing image):
openGraph: {
  title: "IStory - AI-Powered Blockchain Journaling",
  description: "...",
  type: "website",
}
```

**Fix:** Add a default OG image and per-story dynamic images (Next.js `ImageResponse` API).

### 7. No Twitter Card Tags

No `twitter:card`, `twitter:site`, `twitter:creator` tags. Social shares on X/Twitter render as plain links.

**Fix:** Add to root metadata:
```typescript
twitter: {
  card: 'summary_large_image',
  site: '@iStoryApp',
  creator: '@remyOreo_',
}
```

### 8. Missing Favicon & Icons

**Files checked:** `public/` directory

No `favicon.ico`, no `apple-touch-icon.png`, no `icon.svg`. Browser tabs show the default Next.js icon or nothing.

**Fix:** Add to `public/`:
- `favicon.ico` (32x32)
- `apple-touch-icon.png` (180x180)
- `icon.svg` (scalable)

Or use Next.js metadata API:
```typescript
icons: {
  icon: '/favicon.ico',
  apple: '/apple-touch-icon.png',
}
```

### 9. Inconsistent Image Alt Text

Some images have proper alt attributes, others don't:

| Component | Alt Text | Status |
|-----------|----------|--------|
| `profile/page.tsx` AvatarImage | `alt={profileData?.name}` | Good |
| `StoryCard.tsx` AvatarImage | `alt={story.author_wallet?.name}` | Good |
| Social page avatars | Missing explicit alt | Needs fix |
| Decorative icons (Lucide) | No alt needed | OK |

### 10. No Canonical URLs on Dynamic Pages

Relying on Next.js 15 defaults. Explicit canonical URLs should be set on story pages to prevent duplicate content issues (e.g., query params creating duplicates).

---

## Medium Priority Issues

### 11. No Web App Manifest

**Missing file:** `public/manifest.json`

No PWA metadata. Mobile users can't "Add to Home Screen" with proper branding.

### 12. No Per-Page Metadata on Static Pages

Pages like `/library`, `/record`, `/social`, `/profile`, `/tracker` all use the root layout metadata. Each should have unique titles and descriptions.

| Page | Current Title | Recommended Title |
|------|--------------|-------------------|
| `/record` | (root default) | "Record Your Story - iStory" |
| `/library` | (root default) | "Your Story Archive - iStory" |
| `/social` | (root default) | "Community Stories - iStory" |
| `/profile` | (root default) | "Your Profile - iStory" |
| `/tracker` | (root default) | "Daily Tracker - iStory" |

### 13. No Robots Meta Tag

No explicit `<meta name="robots">` directive. Should add:
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
```

### 14. Build Warnings Suppressed

**File:** `next.config.mjs`

```javascript
typescript: { ignoreBuildErrors: true }
eslint: { ignoreDuringBuilds: true }
```

This suppresses warnings that could surface SEO issues (missing alt text, invalid HTML, etc.).

---

## What's Working Well

| Aspect | Details |
|--------|---------|
| Semantic HTML | Proper `<main>`, `<nav>`, `<section>`, `<article>`, `<h1>`-`<h3>` hierarchy |
| `lang="en"` attribute | Set on `<html>` tag |
| Next.js Link prefetching | All internal navigation uses `<Link>` component |
| Root metadata exists | Title, description, keywords defined |
| Heading hierarchy | Single `<h1>` per page, logical nesting |
| Content quality | Natural keyword usage (journaling, blockchain, NFT, Web3, AI) |
| Story content structure | Stories wrapped in `<article>` tag |
| Form labels | Proper `<Label htmlFor>` + `<Input id>` association |

---

## Recommended Implementation Order

### Phase 1: Foundations (Critical)
1. Create `app/robots.ts`
2. Create `app/sitemap.ts` with dynamic story URLs
3. Add favicon and OG image to `public/`
4. Add Twitter Card tags to root metadata
5. Add unique metadata exports to each static page

### Phase 2: Dynamic SEO
1. Add `generateMetadata` to `app/story/[storyId]/page.tsx` (requires refactoring to server component or hybrid)
2. Add JSON-LD `BlogPosting` schema to story pages
3. Add JSON-LD `Organization` schema to root layout
4. Generate dynamic OG images per story using Next.js `ImageResponse`

### Phase 3: Enhancement
1. Create `public/manifest.json` for PWA support
2. Add `BreadcrumbList` schema
3. Add explicit canonical URLs
4. Audit and fix all image alt texts
5. Re-enable TypeScript/ESLint build checks

---

## Files to Create

| File | Purpose |
|------|---------|
| `app/sitemap.ts` | Dynamic sitemap generation |
| `app/robots.ts` | Crawler directives |
| `public/favicon.ico` | Browser tab icon |
| `public/apple-touch-icon.png` | iOS home screen icon |
| `public/og-image.png` | Default social sharing image |
| `public/manifest.json` | PWA manifest |

## Files to Modify

| File | Change |
|------|--------|
| `app/layout.tsx` | Add Twitter cards, icons, viewport, theme-color |
| `app/story/[storyId]/page.tsx` | Add `generateMetadata`, JSON-LD |
| `app/record/page.tsx` | Add page-level metadata |
| `app/library/page.tsx` | Add page-level metadata |
| `app/social/page.tsx` | Add page-level metadata |
| `app/profile/page.tsx` | Add page-level metadata |
| `app/tracker/page.tsx` | Add page-level metadata |
| `next.config.mjs` | Re-enable build checks (medium priority) |

---

*Generated by Claude Code SEO Audit*
