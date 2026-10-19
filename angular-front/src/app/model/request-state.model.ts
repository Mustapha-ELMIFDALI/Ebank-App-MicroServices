import { HttpErrorResponse } from '@angular/common/http';

export enum RequestStatus {
  LOADING,
  SUCCESS,
  ERROR,
}

export interface ListState<T> {
  status: RequestStatus;
  items: T[];
  errorMessage?: string;
}

export function errorMessageOf(error: HttpErrorResponse): string {
  if (error.status === 0) return 'The gateway cannot be reached. Start it on port 9999, then retry.';
  if (typeof error.error?.detail === 'string' && error.error.detail) return error.error.detail;
  if (error.status === 404 || error.status === 503) {
    return 'This service is not registered yet. Start it, wait a few seconds, then retry.';
  }
  return `The request failed (${error.status}). Retry in a moment.`;
}
