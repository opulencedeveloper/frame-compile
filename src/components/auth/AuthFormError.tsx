import { AuthFormErrorProps } from "@/types/auth";

export default function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) return null;

  return (
    <p role="alert" className="text-[13px] text-cdc2626 font-nunito-400 mb-3.5">
      {message}
    </p>
  );
}
