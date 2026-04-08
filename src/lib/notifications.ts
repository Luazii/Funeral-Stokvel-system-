export const smsConfig = {
  provider: process.env.SMS_PROVIDER ?? "",
  apiKey: process.env.SMS_API_KEY ?? "",
  senderId: process.env.SMS_SENDER_ID ?? "",
};

export function hasSmsConfig() {
  return Boolean(smsConfig.provider && smsConfig.apiKey && smsConfig.senderId);
}
