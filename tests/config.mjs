// Addresses of the stack under test. Override them to test another copy of the application.
export const GATEWAY = process.env.GATEWAY_URL ?? 'http://localhost:9999';
export const PORTS = {
  discovery: Number(process.env.DISCOVERY_PORT ?? 8761),
  customer: Number(process.env.CUSTOMER_PORT ?? 8085),
  ebank: Number(process.env.EBANK_PORT ?? 8057),
  bot: Number(process.env.BOT_PORT ?? 8058),
  auth: Number(process.env.AUTH_PORT ?? 8059),
  gateway: Number(new URL(GATEWAY).port || 80),
};
