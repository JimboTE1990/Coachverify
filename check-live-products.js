// Check LIVE mode products in Stripe
// Temporarily uses LIVE key to list products
import Stripe from 'stripe';
import dotenv from 'dotenv';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n⚠️  WARNING: This script will check your LIVE Stripe account.');
console.log('Make sure you have your LIVE secret key ready.\n');

rl.question('Enter your LIVE Stripe secret key (sk_live_...): ', async (liveKey) => {
  if (!liveKey.startsWith('sk_live_')) {
    console.error('❌ Invalid key. Must start with sk_live_');
    rl.close();
    return;
  }

  const stripe = new Stripe(liveKey, {
    apiVersion: '2024-12-18.acacia',
  });

  try {
    console.log('\n📋 Fetching LIVE products...\n');

    const products = await stripe.products.list({ limit: 100 });

    const lifetimeProducts = products.data.filter(p =>
      p.name.toLowerCase().includes('lifetime') ||
      p.description?.toLowerCase().includes('lifetime')
    );

    if (lifetimeProducts.length === 0) {
      console.log('❌ No lifetime products found in LIVE mode.');
      console.log('You need to create the lifetime product in LIVE mode.\n');
    } else {
      console.log(`Found ${lifetimeProducts.length} lifetime product(s):\n`);

      for (const product of lifetimeProducts) {
        console.log(`📦 ${product.name}`);
        console.log(`   Product ID: ${product.id}`);
        console.log(`   Active: ${product.active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(product.created * 1000).toLocaleDateString()}`);

        const prices = await stripe.prices.list({ product: product.id });
        if (prices.data.length > 0) {
          console.log(`   Prices:`);
          for (const price of prices.data) {
            const amount = price.unit_amount ? `£${(price.unit_amount / 100).toFixed(2)}` : 'N/A';
            const interval = price.recurring ? `/${price.recurring.interval}` : ' (one-time)';
            console.log(`      - ${price.id}: ${amount}${interval} ${price.active ? '✅' : '❌ INACTIVE'}`);
          }
        }
        console.log('');
      }

      console.log('💡 Recommendation:');
      console.log('   - Keep the most recently created product');
      console.log('   - Archive the duplicate by setting it to "inactive" in Stripe Dashboard');
      console.log('   - Use the ACTIVE price ID in your Vercel env vars\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
});
