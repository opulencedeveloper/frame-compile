type HttpRequestConfigType = {
  url: string;
  method: string;
  contentType?: string;
  successMessage?: string;
  baseURL?: string;
  isAuth?: boolean;
  params?: any;
  body?: any;
};

export interface HttpRequestConfigProps {
  requestConfig: HttpRequestConfigType;
  successRes: (data: any) => void;
  errorRes?: (error: any) => boolean | void; // Return false to prevent default error handling
}