/**
 * Technical Blog Post Template
 * Looks like a dev blog article about web performance.
 */

module.exports = {
  header: `# Optimizing Web Performance: Lessons from a Side Project

*Published on March 15, 2023* | *5 min read*

A few months ago, I started a small project to learn about web performance optimization. What began as a weekend experiment turned into a deep dive that changed how I approach frontend development. Here are the key lessons.

---

`,
  sections: [
    `## The Problem

My side project was a simple dashboard for tracking personal habits. It worked fine on my MacBook, but when I tested it on an older Android phone, the experience was... painful. First Contentful Paint (FCP) took over 3 seconds, and interactions felt sluggish.

I needed to understand why.

`,
    `## Measuring Before Optimizing

The first rule of optimization: **measure first**. I added these tools to my workflow:

- **Lighthouse** - Built into Chrome DevTools, gives a comprehensive score
- **WebPageTest** - Tests from real devices and networks worldwide
- **Chrome Performance Tab** - Flame graphs showing exactly where time is spent

My initial scores were:

| Metric | Before | Target |
|--------|--------|--------|
| FCP | 3.2s | < 1.8s |
| LCP | 4.1s | < 2.5s |
| TTI | 5.8s | < 3.8s |
| CLS | 0.15 | < 0.1 |

`,
    `## Quick Wins

### 1. Image Optimization

I was serving full-resolution PNGs. Switching to WebP with fallback reduced image sizes by ~70%.

\`\`\`html
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
\`\`\`

### 2. Code Splitting

Instead of one giant bundle, I split routes:

\`\`\`javascript
const Dashboard = lazy(() => import('./Dashboard'));
const Settings = lazy(() => import('./Settings'));
\`\`\`

### 3. Font Loading Strategy

Preconnect to font domains and use \`font-display: swap\`:

\`\`\`css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter.woff2') format('woff2');
  font-display: swap;
}
\`\`\`

`,
    `## Deeper Optimizations

After the quick wins, I focused on architectural changes:

**Virtual scrolling** for long lists - only render what's visible.

**Service Worker caching** for offline support and instant repeat visits.

**Critical CSS inlining** to eliminate render-blocking resources.

Each of these required more effort but yielded significant improvements.

`,
    `## Results

After two weeks of incremental improvements:

| Metric | Before | After |
|--------|--------|-------|
| FCP | 3.2s | 1.1s |
| LCP | 4.1s | 1.8s |
| TTI | 5.8s | 2.9s |
| CLS | 0.15 | 0.03 |

The dashboard now feels snappy even on low-end devices. More importantly, I developed a performance-first mindset that I apply to every project.

`,
    `## What's Next

I'm now exploring:
- **Core Web Vitals** monitoring with real-user data
- **Edge caching** with Cloudflare Workers
- **Partial hydration** frameworks like Astro and Qwik

Performance optimization is a journey, not a destination. Start measuring today.

---

*Have questions? Open an issue or reach out on Twitter.*
`
  ],
  footer: `\n<!-- End of blog post -->\n`,
  slots: 6
};
