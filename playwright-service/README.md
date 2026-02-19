# EMCC Playwright Verification Service

A dedicated microservice using Playwright to verify EMCC credentials by scraping the official EMCC directory.

## Why Playwright?

- **Real browser automation** - Uses actual Chromium browser
- **JavaScript execution** - Waits for dynamic content to load
- **Bypasses anti-bot** - Looks like a legitimate browser visit
- **Reliable** - No dependency on third-party proxy services
- **Fast** - Direct browser automation, ~10-20 seconds per verification

## Local Development

### 1. Install Dependencies

```bash
cd playwright-service
npm install
```

This will install:
- Express (web server)
- Playwright (browser automation)
- CORS (for Supabase Edge Functions)

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

This downloads the Chromium browser (~100MB).

### 3. Run Locally

```bash
npm start
```

Server runs on http://localhost:3000

### 4. Test Locally

```bash
curl -X POST http://localhost:3000/verify-emcc \
  -H "Content-Type: application/json" \
  -d '{"eiaNumber": "EIA20230480", "fullName": "Paula Jones"}'
```

Expected response:
```json
{
  "success": true,
  "html": "...",
  "eiaNumber": "EIA20230480",
  "containsEIA": true,
  "htmlLength": 50000
}
```

## Deploy to Railway

### 1. Create Railway Account
- Go to https://railway.app/
- Sign up with GitHub
- Free tier: $5/month credit (enough for ~1000 verifications)

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Select this `playwright-service` folder
- Railway auto-detects Node.js

### 3. Configure Build
Railway will automatically:
- Run `npm install`
- Install Playwright browsers
- Start the server with `npm start`

### 4. Get Your Service URL
After deployment, Railway gives you a URL like:
```
https://your-service.railway.app
```

### 5. Set Environment Variable (Optional)
In Railway dashboard:
- Go to your service
- Click "Variables"
- Add: `NODE_ENV=production`

## Deploy to Fly.io (Alternative)

### 1. Install Fly CLI
```bash
brew install flyctl  # macOS
# or
curl -L https://fly.io/install.sh | sh  # Linux/WSL
```

### 2. Login
```bash
flyctl auth login
```

### 3. Create fly.toml
```toml
app = "emcc-verifier"

[build]
  builder = "paketobuildpacks/builder:base"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
```

### 4. Deploy
```bash
flyctl launch
flyctl deploy
```

## Update Supabase Edge Function

Once deployed, update your Supabase Edge Function to call this service:

```typescript
// In verify-emcc-accreditation function
const PLAYWRIGHT_SERVICE_URL = 'https://your-service.railway.app';

const response = await fetch(`${PLAYWRIGHT_SERVICE_URL}/verify-emcc`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eiaNumber: normalizedEIA, fullName: expectedName }),
  signal: AbortSignal.timeout(35000)
});

if (!response.ok) {
  return {
    verified: false,
    confidence: 0,
    reason: `Browser service returned HTTP ${response.status}`,
  };
}

const { success, html } = await response.json();

if (!success) {
  return {
    verified: false,
    confidence: 0,
    reason: 'Failed to fetch EMCC directory'
  };
}

// Now parse the HTML (use existing parseEIAResult function)
const match = parseEIAResult(html, normalizedEIA);
```

## Cost Comparison

### Railway (Recommended)
- Free tier: $5/month credit
- After free: ~$5/month for light usage
- Includes automatic scaling
- ~1000 verifications/month on free tier

### Fly.io
- Free tier: 3 shared CPUs, 256MB RAM
- After free: Pay per use
- ~$0.01 per verification

### ScraperAPI (Current)
- $49/month for 100k API credits
- ~10 credits per verification with rendering
- = ~10,000 verifications/month
- **Problem**: HTTP 500 errors, unreliable

## Performance Expectations

- **First request**: ~15-20 seconds (browser startup)
- **Subsequent requests**: ~10-15 seconds (browser pooling)
- **Success rate**: ~95%+ (real browser, bypasses anti-bot)
- **Cost**: $5-10/month for typical usage

## Troubleshooting

### "Browser not found"
```bash
npx playwright install chromium
```

### "Permission denied"
Add to Railway env vars:
```
PLAYWRIGHT_BROWSERS_PATH=/app/.cache/ms-playwright
```

### Timeouts
Increase timeout in server.js:
```javascript
await page.goto(searchUrl, {
  waitUntil: 'networkidle',
  timeout: 60000 // Increase to 60 seconds
});
```

## Next Steps

1. ✅ Test locally with `npm start`
2. ✅ Deploy to Railway
3. ✅ Get service URL
4. ✅ Update Supabase Edge Function
5. ✅ Test with EIA20230480
6. ✅ Monitor performance

## Support

- Railway Docs: https://docs.railway.app/
- Playwright Docs: https://playwright.dev/
- Issues: Create issue in main repo
