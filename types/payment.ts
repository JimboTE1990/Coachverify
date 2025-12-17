export type BillingCycle = 'monthly' | 'annual';

export interface PaymentMethod {
  id: string;
  type: 'card';
  cardLast4: string;
  cardBrand: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  billingCycle: BillingCycle;
  periodStart: string;
  periodEnd: string;
  paidAt?: string;
  invoiceUrl?: string;
}

export interface CheckoutSession {
  coachId: string;
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  isTrialIncluded: boolean;
  trialEndDate?: string;
  firstChargeDate: string;
}

export interface PaymentFormData {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  billingPostcode: string;
}

export interface PaymentResult {
  success: boolean;
  error?: string;
  paymentMethodId?: string;
  subscriptionId?: string;
}

export interface SubscriptionDetails {
  id: string;
  coachId: string;
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  billingCycle: BillingCycle;
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  cancelledAt?: string;
  trialEnd?: string;
  paymentMethod?: PaymentMethod;
}
