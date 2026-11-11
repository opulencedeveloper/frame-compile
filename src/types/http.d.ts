import { AxiosResponse } from "axios";

type HttpRequestConfigType = {
  url: string;
  method: string;
  contentType?: string;
  successMessage?: string;
  baseURL?: string;
  isAuth?: boolean;
  params?: Record<string, unknown>;
  body?: unknown;
};

// The body of an error response from the API.
export interface ApiErrorBody {
  message?: string;
  description?: string;
  // Per endpoint, e.g. { retryAfterSeconds } when a code was resent too soon.
  data?: Record<string, unknown> | null;
}

export interface HttpRequestConfigProps {
  requestConfig: HttpRequestConfigType;
  successRes: (res: AxiosResponse) => void;
  // Return false to prevent default error handling.
  errorRes?: (error: AxiosResponse<ApiErrorBody>) => boolean | void;
}
