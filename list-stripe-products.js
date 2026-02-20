// Script to list all products in Stripe
// Run with: node list-stripe-products.js

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function listProducts() {
  try {
    const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    console.log(`\n📋 Listing Stripe products (${mode} mode)...\n`);

    // List all products
    const products = await stripe.products.list({ limit: 100 });

    if (products.data.length === 0) {
      console.log('❌ No products found in this Stripe account.');
      return;
    }

    console.log(`Found ${products.data.length} product(s):\n`);

    for (const product of products.data) {
      console.log(`📦 ${product.name}`);
      console.log(`   ID: ${product.id}`);
      console.log(`   Active: ${product.active ? '✅' : '❌'}`);

      // List prices for this product
      const prices = await stripe.prices.list({ product: product.id });

      if (prices.data.length > 0) {
        console.log(`   Prices:`);
        for (const price of prices.data) {
          const amount = price.unit_amount ? `£${(price.unit_amount / 100).toFixed(2)}` : 'N/A';
          const interval = price.recurring ? `/${price.recurring.interval}` : ' (one-time)';
          console.log(`      - ${price.id}: ${amount}${interval}`);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

listProducts();
