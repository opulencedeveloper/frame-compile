import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { siteSeo } from "@/resources/seo";
import { OgImageContent } from "@/types/seo";

// The share image (Open Graph and X cards): the logo, a headline in the
// site's serif, and what the product does. Rendered when the site is built.
export const ogImageSize = { width: 1200, height: 630 };
export const ogImageContentType = "image/png";

const MARK =
  "M16.6889 3.3388H9.52102L8.34446 2.16224C8.03572 1.8535 7.60181 1.66992 7.1679 1.66992H3.33782C2.41994 1.66992 1.66895 2.42092 1.66895 3.3388V15.021C1.66895 15.9388 2.41994 16.6898 3.33782 16.6898H16.6889C17.6067 16.6898 18.3577 15.9388 18.3577 15.021V5.00768C18.3577 4.0898 17.6067 3.3388 16.6889 3.3388ZM9.35413 11.9252L8.17757 13.1017L6.26188 11.1861C5.61014 10.5343 5.61014 9.47764 6.26188 8.8259L8.17757 6.9102L9.35413 8.08676L8.62334 8.81755C7.9716 9.46929 7.97161 10.526 8.62334 11.1777L9.35413 11.9085V11.9252ZM11.8575 13.1017L10.6809 11.9252L11.4117 11.1944C12.0634 10.5427 12.0634 9.48598 11.4117 8.83424L10.6809 8.10345L11.8575 6.92689L13.7731 8.84259C14.4249 9.49433 14.4249 10.551 13.7731 11.2027L11.8575 13.1184V13.1017Z";

const fontsDir = path.join(process.cwd(), "public", "assets", "fonts");

async function fonts() {
  const [serif, regular, medium] = await Promise.all([
    readFile(path.join(fontsDir, "HedvigLettersSerif_18pt-Regular.ttf")),
    readFile(path.join(fontsDir, "Nunito-Regular.ttf")),
    readFile(path.join(fontsDir, "Nunito-Medium.ttf")),
  ]);
  return [
    { name: "Hedvig", data: serif, weight: 400 as const, style: "normal" as const },
    { name: "Nunito", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Nunito", data: medium, weight: 500 as const, style: "normal" as const },
  ];
}

const chips = ["Pixel-identical pages", "React components", "Deploy to Vercel"];

export async function renderOgImage({ title, subtitle }: OgImageContent) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#FBFAF7",
          backgroundImage:
            "radial-gradient(circle at 92% 8%, rgba(97, 85, 245, 0.22), rgba(97, 85, 245, 0) 45%), radial-gradient(circle at 0% 100%, rgba(0, 129, 216, 0.10), rgba(0, 129, 216, 0) 40%)",
          fontFamily: "Nunito",
          color: "#0A0A0A",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="1.2 1.2 17.6 17.6">
            <path d={MARK} fill="#6155F5" />
          </svg>
          <div style={{ fontSize: 36, fontWeight: 500 }}>{siteSeo.name}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontFamily: "Hedvig", fontSize: 74, lineHeight: 1.08, letterSpacing: -1, maxWidth: 980 }}>
            {title}
          </div>
          <div style={{ fontSize: 31, lineHeight: 1.35, color: "#3F3F46", maxWidth: 940 }}>{subtitle}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 14 }}>
            {chips.map((chip) => (
              <div
                key={chip}
                style={{
                  display: "flex",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#3B32D9",
                  backgroundColor: "rgba(97, 85, 245, 0.10)",
                  border: "1px solid rgba(97, 85, 245, 0.25)",
                  borderRadius: 999,
                  padding: "10px 22px",
                }}
              >
                {chip}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 26, color: "#52525B" }}>{new URL(siteSeo.url).host}</div>
        </div>
      </div>
    ),
    { ...ogImageSize, fonts: await fonts() },
  );
}
