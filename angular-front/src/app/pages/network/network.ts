import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { catchError, forkJoin, map, of, timeout } from 'rxjs';
import { GATEWAY_URL } from '../../api.config';

type Health = 'checking' | 'up' | 'down';

@Component({
  selector: 'app-network',
  templateUrl: './network.html',
})
export class Network {
  private readonly http = inject(HttpClient);
  private readonly gateway = inject(GATEWAY_URL);

  protected readonly services = [
    { key: 'gateway', name: 'Gateway', port: 9999, path: '', icon: 'ph-signpost', role: 'Finds each service in Eureka and routes every request to it.' },
    { key: 'customer', name: 'Customer service', port: 8085, path: '/CUSTOMER-SERVICE', icon: 'ph-users-three', role: 'Stores customers. Offers REST and three MCP tools.' },
    { key: 'ebank', name: 'EBank service', port: 8057, path: '/EBANK-SERVICE', icon: 'ph-vault', role: 'Stores accounts. Checks owners with OpenFeign and a circuit breaker.' },
    { key: 'bot', name: 'EBank bot', port: 8058, path: '/EBANK-BOT', icon: 'ph-sparkle', role: 'Gemini agent with memory, calling both services through MCP.' },
  ];
  protected readonly health = signal<Partial<Record<string, Health>>>({});

  constructor() {
    this.check();
  }

  protected check(): void {
    this.health.set({});
    const probes = this.services.map((service) =>
      this.http.get<{ status: string }>(`${this.gateway}${service.path}/actuator/health`).pipe(
        timeout(8000),
        map((body): Health => (body.status === 'UP' ? 'up' : 'down')),
        catchError(() => of<Health>('down')),
      ),
    );
    forkJoin(probes).subscribe((states) =>
      this.health.set(Object.fromEntries(this.services.map((service, i) => [service.key, states[i]]))),
    );
  }
}
