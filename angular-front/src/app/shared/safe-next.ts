// ?next= must stay inside the application
export function safeNext(next: string | undefined): string {
  return next && /^\/(?![\/\\])/.test(next) ? next : '/';
}
