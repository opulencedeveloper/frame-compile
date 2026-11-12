import Link from "next/link";
import Logo from "@/assets/logo/logo.svg";
import SmartImage from "@/components/shared/SmartImage";
import { AppLogoProps } from "@/types/shared";

export default function AppLogo({ href = "/" }: AppLogoProps) {
  return (
    <Link href={href} className="flex w-max gap-1.25">
      <div className="h-5 w-5">
        <SmartImage
          src={Logo}
          alt=""
          width={20}
          height={20}
          preload={true}
          className="w-5 h-5 shrink-0 mt-0.5"
        />
      </div>
      <p className="text-base">FrameCompile</p>
    </Link>
  );
}
