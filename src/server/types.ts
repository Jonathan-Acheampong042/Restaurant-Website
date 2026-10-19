// Ember & Olive: Backend Types & Context Definitions

export type * from '../../types/shared.ts';

export interface ValidationResult<T> {
  isValid: boolean;
  errors: Record<string, string>;
  data?: T;
}

export interface HttpRequestContext {
  method: string;
  url: string;
  pathname: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string | string[] | undefined>;
  body: any;
}

export interface HttpResponseContext {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
}
