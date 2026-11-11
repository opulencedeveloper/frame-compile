import AuthFlow from "@/components/auth/AuthFlow";
import { AuthMode } from "@/utils/enum";

export default function SignUpPage() {
  return <AuthFlow mode={AuthMode.SignUp} />;
}
