import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { MARKED_OPTIONS, MarkedRenderer, provideMarkdown } from 'ngx-markdown';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

// Answers are model output: no remote images, no clickable links, no raw HTML
function safeMarkdownOptions() {
  const renderer = new MarkedRenderer();
  renderer.image = ({ text }) => text;
  renderer.link = ({ text }) => text;
  renderer.html = ({ text }) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return { renderer, gfm: true };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([loadingInterceptor, authInterceptor])),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideMarkdown({ markedOptions: { provide: MARKED_OPTIONS, useFactory: safeMarkdownOptions } }),
  ],
};
