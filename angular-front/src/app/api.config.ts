import { InjectionToken } from '@angular/core';

// Every request goes through the gateway
export const GATEWAY_URL = new InjectionToken<string>('GATEWAY_URL', {
  providedIn: 'root',
  factory: () => 'http://localhost:9999',
});
