// Script to create Lifetime Membership product in Stripe
// Run with: node create-lifetime-product.js

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function createLifetimeProduct() {
  try {
    console.log('Creating Lifetime Membership product in Stripe...\n');

    // Create the product
    const product = await stripe.products.create({
      name: 'Lifetime Membership',
      description: 'One-time payment for lifetime access to CoachDog platform',
      metadata: {
        type: 'lifetime',
      },
    });

    console.log('✅ Product created:', product.id);
    console.log('   Name:', product.name);

    // Create the price (one-time payment)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: 14900, // £149.00 in pence
      currency: 'gbp',
      metadata: {
        billing_cycle: 'lifetime',
      },
    });

    console.log('\n✅ Price created:', price.id);
    console.log('   Amount: £' + (price.unit_amount / 100));
    console.log('   Currency:', price.currency.toUpperCase());
    console.log('   Type: One-time payment');

    console.log('\n📋 Add this to your .env file:');
    console.log(`VITE_STRIPE_LIFETIME_PRICE_ID=${price.id}`);

    console.log('\n🎉 Done! Your lifetime product is ready.');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createLifetimeProduct();
