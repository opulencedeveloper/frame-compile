import AuthFlow from "@/components/auth/AuthFlow";
import { AuthMode } from "@/utils/enum";

export default function SignInPage() {
  return <AuthFlow mode={AuthMode.SignIn} />;
}
