import { useRouter, usePathname } from "next/navigation";
import { useState, useCallback } from "react";

import { isAxiosError } from "axios";

import axios from "@/lib/axios";
import { ApiErrorBody, HttpRequestConfigProps } from "@/types/http";

export const useHttp = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const sendHttpRequest = useCallback(
    async ({ successRes, errorRes, requestConfig }: HttpRequestConfigProps) => {
      setError(null);

      setIsLoading(true);

      try {
          // For FormData, don't set Content-Type - let axios set it with boundary
          const isFormData = requestConfig.body instanceof FormData;
          const config = {
          ...(requestConfig.baseURL && { baseURL: requestConfig.baseURL }),
          ...(requestConfig.url && { url: `/api/v1${requestConfig.url}` }),
          method: requestConfig.method,
          headers: {
            ...(isFormData ? {} : { "Content-Type": requestConfig.contentType || "application/json" }),
            // Note: With httpOnly cookies, the Authorization header is not needed
            // The browser automatically sends the auth-token cookie
          },
          ...(requestConfig.params && { params: requestConfig.params }),
          ...(requestConfig.body !== undefined && { data: requestConfig.body }),
        };
        const res = await axios.request(config);

        if (res.status >= 200 && res.status < 300) {
          if (requestConfig.successMessage) {
          //  toast.success(requestConfig.successMessage);
          }

          successRes(res);
        }
      } catch (caught: unknown) {
        const error = isAxiosError<ApiErrorBody>(caught) ? caught : null;

        // Check if custom error handler is provided and should be used
        if (errorRes && error?.response) {
          const shouldUseCustomHandler = errorRes(error.response);
          if (shouldUseCustomHandler === false) {
            // Custom handler processed the error, don't show default toast
            setError(null);
            setIsLoading(false);
            return;
          }
        }

        let errorMessage = "Something went wrong!";

        // A request that fails or times out is almost always a bad
        // connection, so both say so.
        if (error?.code === "ERR_NETWORK" || error?.code === "ECONNABORTED") {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else if (error?.response?.data?.description) {
          errorMessage = error?.response?.data?.description;
        }

        const isAuthEndpoint =
          error?.config?.url?.includes("auth") ||
          error?.config?.url?.includes("login");

        if (error?.response?.status === 401 && !isAuthEndpoint) {
          errorMessage = "Session expired!";

          if (pathname) {
            sessionStorage.setItem("redirectAfterLogin", pathname);
          }

          const loginPath = pathname?.includes("admin") ? "/admin/login" : "/sign-in";
          router.replace(loginPath);
        }

        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [router, pathname]
  );

  return {
    isLoading,
    sendHttpRequest,
    error,
  };
};

