export const paystackConfig = {
  publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
  secretKey: process.env.PAYSTACK_SECRET_KEY ?? "",
  webhookSecret: process.env.PAYSTACK_WEBHOOK_SECRET ?? "",
};

export function hasPaystackCredentials() {
  return Boolean(paystackConfig.publicKey && paystackConfig.secretKey);
}

export function hasPaystackWebhookSecret() {
  return Boolean(paystackConfig.webhookSecret);
}

export async function initializePaystackTransaction(data: {
  amount: number;
  email: string;
  reference: string;
  currency: string;
  callback_url: string;
  metadata?: any;
}) {
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paystackConfig.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to initialize Paystack transaction");
  }
  return result;
}

export async function verifyPaystackTransaction(reference: string) {
  const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${paystackConfig.secretKey}`,
    },
  });

  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || "Failed to verify Paystack transaction");
  }
  return result;
}
