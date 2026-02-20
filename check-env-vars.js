// Diagnostic script to check environment variables in production
// This will help identify if the issue is with Vercel env var configuration

console.log('\n=== Environment Variable Check ===\n');

// Check if running in Node.js or browser
const isNode = typeof process !== 'undefined' && process.versions?.node;

if (isNode) {
  console.log('Running in Node.js environment');
  console.log('VITE_STRIPE_LIFETIME_PRICE_ID:', process.env.VITE_STRIPE_LIFETIME_PRICE_ID || '(not set)');
  console.log('\nNote: In Vite, VITE_* variables are only available at BUILD TIME in the browser.');
  console.log('This script shows backend env vars. Check browser console for frontend vars.\n');
} else {
  console.log('Running in browser environment');
  console.log('import.meta.env would be available here at build time');
}

console.log('\n=== Common Issues ===\n');
console.log('1. Environment variable not set for "Production" environment in Vercel');
console.log('2. Environment variable set but build cache not cleared');
console.log('3. Viewing Preview deployment instead of Production deployment');
console.log('4. Typo in variable name (case-sensitive)');
console.log('5. Missing "VITE_" prefix in Vercel dashboard');
console.log('\n=== Solution Steps ===\n');
console.log('1. Go to Vercel dashboard → Your Project → Settings → Environment Variables');
console.log('2. Find VITE_STRIPE_LIFETIME_PRICE_ID');
console.log('3. Verify it has checkmarks for: ✓ Production ✓ Preview ✓ Development');
console.log('4. Click "..." menu → Edit → Re-save (this forces refresh)');
console.log('5. Go to Deployments → Click "..." on latest → "Redeploy" → Check "Use existing Build Cache" = OFF');
console.log('6. Wait for build to complete');
console.log('7. Visit production URL (not preview URL)');
console.log('8. Check browser console for logs');
console.log('\n');
