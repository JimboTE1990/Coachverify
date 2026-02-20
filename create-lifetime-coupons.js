// Create lifetime discount coupons in Stripe
// Run with: node create-lifetime-coupons.js

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

async function createLifetimeCoupons() {
  try {
    const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    console.log(`\n📋 Creating lifetime discount coupons in Stripe (${mode} mode)...\n`);

    // BETA100: £100 off lifetime (£149 → £49)
    console.log('Creating BETA100_LIFETIME coupon...');
    try {
      const beta100 = await stripe.coupons.create({
        id: 'BETA100_LIFETIME',
        amount_off: 10000, // £100.00 in pence
        currency: 'gbp',
        duration: 'once',
        name: 'Beta Tester - £100 off',
        metadata: {
          type: 'lifetime_fixed',
          code: 'BETA100',
          max_uses: '10',
        },
      });
      console.log('✅ BETA100_LIFETIME created:', beta100.id);
      console.log('   Amount off: £100.00');
      console.log('   Duration: Once (applies to one-time payments)');
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        console.log('⚠️  BETA100_LIFETIME already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('');

    // LIMITED60: £60 off lifetime (£149 → £89)
    console.log('Creating LIMITED60_LIFETIME coupon...');
    try {
      const limited60 = await stripe.coupons.create({
        id: 'LIMITED60_LIFETIME',
        amount_off: 6000, // £60.00 in pence
        currency: 'gbp',
        duration: 'once',
        name: 'Limited - £60 off',
        metadata: {
          type: 'lifetime_fixed',
          code: 'LIMITED60',
          max_uses: '50',
        },
      });
      console.log('✅ LIMITED60_LIFETIME created:', limited60.id);
      console.log('   Amount off: £60.00');
      console.log('   Duration: Once (applies to one-time payments)');
    } catch (err) {
      if (err.code === 'resource_already_exists') {
        console.log('⚠️  LIMITED60_LIFETIME already exists, skipping...');
      } else {
        throw err;
      }
    }

    console.log('\n🎉 Done! Lifetime discount coupons are ready.');
    console.log('\n📝 Note: These coupons can be used directly in Stripe Checkout.');
    console.log('The edge function will automatically apply them when users enter:');
    console.log('  - Code: BETA100 → Stripe Coupon: BETA100_LIFETIME (£49 final price)');
    console.log('  - Code: LIMITED60 → Stripe Coupon: LIMITED60_LIFETIME (£89 final price)');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createLifetimeCoupons();
