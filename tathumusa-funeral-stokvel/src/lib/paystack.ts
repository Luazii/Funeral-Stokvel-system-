import Paystack from 'paystack-api';

export const paystackConfig = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
};

export const paystack = new Paystack(paystackConfig.secretKey);

export function hasPaystackCredentials() {
  return Boolean(paystackConfig.publicKey && paystackConfig.secretKey);
}

export function hasPaystackWebhookSecret() {
  return Boolean(paystackConfig.webhookSecret);
}
