/**
 * Caption Overlay System -- Copy this into your Playwright demo spec
 *
 * Provides showCaption(), hideCaption(), and caption() functions that render
 * text overlays at the bottom of the viewport during video recording.
 *
 * These functions are the primary input to the demo video pipeline:
 *   extract-captions.mjs parses these calls to generate the caption manifest.
 *
 * Usage:
 *   1. Copy this entire block into the top of your spec file
 *   2. Use showCaption/caption/hideCaption in your test body
 *   3. Run extract-captions.mjs to generate the manifest
 */

import type { Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Caption CSS -- gradient background, white text, fixed to bottom
// ---------------------------------------------------------------------------

const CAPTION_CSS = [
  'position:fixed',
  'bottom:0',
  'left:0',
  'right:0',
  'z-index:99999',
  'padding:20px 40px 28px',
  'background:linear-gradient(transparent 0%,rgba(0,0,0,0.15) 15%,rgba(0,0,0,0.82) 100%)',
  'color:#fff',
  'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
  'font-size:20px',
  'font-weight:500',
  'line-height:1.4',
  'text-align:center',
  'letter-spacing:0.01em',
  'text-shadow:0 1px 3px rgba(0,0,0,0.5)',
  'pointer-events:none',
  'opacity:0',
  'transition:opacity 0.3s ease',
].join(';');

// ---------------------------------------------------------------------------
// Caption functions
// ---------------------------------------------------------------------------

/**
 * Show caption text at the bottom of the viewport.
 * Persists until next showCaption() or hideCaption() call.
 * Re-injects the overlay element if lost after page navigation.
 */
export async function showCaption(page: Page, text: string): Promise<void> {
  await page.evaluate(([t, css]: string[]) => {
    let el = document.getElementById('demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'demo-caption';
      el.style.cssText = css;
      document.body.appendChild(el);
    }
    el.textContent = t;
    el.style.opacity = '1';
  }, [text, CAPTION_CSS]);
  await page.waitForTimeout(300); // fade-in duration
}

/**
 * Fade out the current caption.
 */
export async function hideCaption(page: Page): Promise<void> {
  await page.evaluate(() => {
    const el = document.getElementById('demo-caption');
    if (el) el.style.opacity = '0';
  });
  await page.waitForTimeout(300); // fade-out duration
}

/**
 * Show caption, hold for specified duration, then fade out.
 * Convenience wrapper: showCaption + wait + hideCaption.
 *
 * @param page  Playwright Page instance
 * @param text  Caption text to display
 * @param ms    Hold duration in milliseconds (default: 3000)
 */
export async function caption(page: Page, text: string, ms = 3000): Promise<void> {
  await showCaption(page, text);
  await page.waitForTimeout(ms);
  await hideCaption(page);
}
