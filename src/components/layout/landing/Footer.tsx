import FooterBg from "@/assets/images/footer-bg.svg";
import SmartImage from "@/components/shared/SmartImage";
import FooterLink from "@/components/layout/landing/FooterLink";
import CurrentYear from "@/components/shared/CurrentYear";
import { footerLinks } from "@/resources/layout";

export default function Footer() {
  return (
    <footer className="pb-10 pt-5 md:py-12.5">
      <SmartImage
        src={FooterBg}
        alt=""
        sizes="100vw"
        preload={true}
        className="w-full h-auto"
      />

      <div className="gap-5 mt-8 max-w-198.25 w-full mx-auto flex flex-col md:flex-row justify-between">
        {footerLinks.map((link) => (
          <FooterLink key={`${link.label}-${link.text}`} {...link} />
        ))}
      </div>

      <div className="border-t border-cf4f4f6 mt-8 pt-8 pb-12.5">
        <p className="text-c767676 text-center font-nunito-400 text-sm">
          © <CurrentYear /> CovertoCode. Independent build tool for web creators and
          engineers. Not affiliated with Framer B.V.
        </p>
      </div>
    </footer>
  );
}
