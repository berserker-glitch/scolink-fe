// Official Paddle.js integration using @paddle/paddle-js
import { initializePaddle as paddleInit, Paddle } from '@paddle/paddle-js';

// Paddle Configuration
export const PADDLE_CONFIG = {
  clientToken: 'test_002efe842e029f562973d724169',//'live_87ce83307a34173fb013fc11b31',
  environment: 'sandbox' as const,
  productId: 'pro_01k63sra91ttt22p29xwxa7k6t',//'pro_01k6512x55qw0ksvfnbspqvrdh',
  prices: {
    professional: 'pri_01k63sshnpmsh731qfefga6kt0', //'pri_01k6513x6vgad5x9yf01qkavgw', // $25/month
    premium: 'pri_01k641bc2ka8crnx09fw50bg5e', //'pri_01k6514j2vsd672528qrkj5tvj',     // $50/month
    lifetime: 'pri_01k641cyt65tvp34y12c44wv4e'//'pri_01k651560kcvm5xsa8s361p8ee'     // $500 one-time
  }
};

// Plan definitions with pricing information
export const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 0,
    priceText: 'Free',
    billingPeriod: '',
    paddlePriceId: null,
    features: [
      'Up to 50 students',
      'Basic reporting',
      'Email support',
      'Standard templates'
    ],
    popular: false,
    color: 'gray'
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 25,
    priceText: '$25',
    billingPeriod: '/month',
    paddlePriceId: PADDLE_CONFIG.prices.professional,
    features: [
      'Up to 500 students',
      'Advanced reporting',
      'Priority support',
      'Custom templates',
      'Payment tracking',
      'Attendance management'
    ],
    popular: true,
    color: 'blue'
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50,
    priceText: '$50',
    billingPeriod: '/month',
    paddlePriceId: PADDLE_CONFIG.prices.premium,
    features: [
      'Unlimited students',
      'Advanced analytics',
      'Phone support',
      'White-label options',
      'API access',
      'Multi-location support',
      'Advanced integrations'
    ],
    popular: false,
    color: 'purple'
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    price: 500,
    priceText: '$500',
    billingPeriod: 'one-time',
    paddlePriceId: PADDLE_CONFIG.prices.lifetime,
    features: [
      'Everything in Premium',
      'Lifetime access',
      'No monthly fees',
      'Priority feature requests',
      'Dedicated support',
      'Future updates included'
    ],
    popular: false,
    color: 'gold'
  }
];

// Global paddle instance
let paddleInstance: Paddle | null = null;

// Initialize Paddle using official method
export const initializePaddle = async (): Promise<Paddle | null> => {
  try {
    console.log('Initializing Paddle with official package...');
    console.log('Token:', PADDLE_CONFIG.clientToken);
    console.log('Environment:', PADDLE_CONFIG.environment);
    
    const paddle = await paddleInit({
      environment: PADDLE_CONFIG.environment,
      token: PADDLE_CONFIG.clientToken
    });
    
    if (paddle) {
      paddleInstance = paddle;
      console.log('Paddle initialized successfully');
      return paddle;
    } else {
      console.error('Failed to initialize Paddle - no instance returned');
      return null;
    }
  } catch (error) {
    console.error('Failed to initialize Paddle:', error);
    return null;
  }
};

// Type definitions for Paddle checkout
export interface PaddleCheckoutOpenOptions {
  priceId: string;
  customerId?: string;
  customer?: {
    email: string;
    name?: string;
  };
  customData?: Record<string, any>; // Keep as object - don't stringify
  successUrl?: string;
  successCallback?: (data: any) => void;
  errorCallback?: (error: any) => void;
}

// Open Paddle checkout using official method
export const openPaddleCheckout = (options: PaddleCheckoutOpenOptions): Promise<any> | null => {
  return new Promise((resolve, reject) => {
    if (!paddleInstance) {
      console.error('Paddle not initialized. Call initializePaddle() first.');
      if (options.errorCallback) {
        options.errorCallback(new Error('Paddle not initialized'));
      }
      reject(new Error('Paddle not initialized'));
      return;
    }

    console.log('Opening Paddle checkout with options:', {
      priceId: options.priceId,
      customer: options.customer,
      customData: options.customData
    });

    try {
      // Use the official Paddle checkout method
      paddleInstance.Checkout.open({
        items: [{
          priceId: options.priceId,
          quantity: 1
        }],
        customer: options.customer,
        customData: options.customData, // Keep as object
        settings: {
          displayMode: 'overlay',
          theme: 'light',
          locale: 'en',
          allowLogout: false,
          successUrl: options.successUrl
        }
      });

      // Paddle checkout opens immediately and doesn't return data until completion
      console.log('Checkout opened successfully');
      
      // For now, resolve immediately since Paddle handles the flow
      // The actual payment completion will be handled by webhooks
      resolve({ status: 'opened' });
      
    } catch (error) {
      console.error('Failed to open Paddle checkout:', error);
      if (options.errorCallback) {
        options.errorCallback(error);
      }
      reject(error);
    }
  });
};

// Utility functions
export const getPlanById = (planId: string) => {
  return PLANS.find(plan => plan.id === planId);
};

export const getPlanByPaddlePriceId = (priceId: string) => {
  return PLANS.find(plan => plan.paddlePriceId === priceId);
};

export const planRequiresPayment = (planId: string) => {
  return planId !== 'basic';
};

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

// Get the current paddle instance
export const getPaddleInstance = (): Paddle | null => {
  return paddleInstance;
};