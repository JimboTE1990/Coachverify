import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Supabase Edge Functions
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'emcc-playwright-verifier' });
});

// Main verification endpoint
app.post('/verify-emcc', async (req, res) => {
  const { eiaNumber, fullName } = req.body;

  if (!eiaNumber) {
    return res.status(400).json({
      success: false,
      error: 'Missing eiaNumber parameter'
    });
  }

  console.log(`[Playwright] Starting verification for EIA: ${eiaNumber}`);

  let browser;
  try {
    // Launch browser with stealth mode (looks more like a real browser)
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process'
      ]
    });

    // Create context with realistic settings
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-GB',
      timezoneId: 'Europe/London',
      hasTouch: false,
      isMobile: false,
      colorScheme: 'light',
      extraHTTPHeaders: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    const page = await context.newPage();

    // Hide automation indicators that anti-bot systems look for
    await page.addInitScript(() => {
      // Overwrite the `navigator.webdriver` property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Overwrite the `plugins` property to add fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });

      // Overwrite the `languages` property
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-GB', 'en', 'en-US'],
      });

      // Add chrome property
      window.chrome = {
        runtime: {},
      };

      // Permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // Navigate to EMCC directory with EIA number
    const searchUrl = `https://www.emccglobal.org/directory?reference=${eiaNumber}`;
    console.log(`[Playwright] Navigating to: ${searchUrl}`);

    try {
      // Navigate with multiple fallback strategies
      await page.goto(searchUrl, {
        waitUntil: 'load',
        timeout: 60000
      });

      console.log(`[Playwright] Page loaded successfully`);

      // Wait for any AJAX/dynamic content
      await page.waitForTimeout(5000);

    } catch (navError) {
      console.log(`[Playwright] Navigation completed with warnings: ${navError.message}`);
      // Continue anyway - page might still have loaded
    }

    // Get the fully rendered HTML
    const html = await page.content();
    console.log(`[Playwright] Successfully fetched HTML (${html.length} chars)`);

    // Check if EIA number is in the HTML
    const containsEIA = html.includes(eiaNumber);
    console.log(`[Playwright] HTML contains EIA: ${containsEIA}`);

    await browser.close();

    res.json({
      success: true,
      html: html,
      eiaNumber: eiaNumber,
      containsEIA: containsEIA,
      htmlLength: html.length
    });

  } catch (error) {
    console.error(`[Playwright] Error:`, error.message);

    if (browser) {
      await browser.close();
    }

    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`[Playwright Service] Running on port ${PORT}`);
  console.log(`[Playwright Service] Health check: http://localhost:${PORT}/health`);
  console.log(`[Playwright Service] Verify endpoint: http://localhost:${PORT}/verify-emcc`);
});
