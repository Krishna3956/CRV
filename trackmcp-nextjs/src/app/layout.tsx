import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { ScrollToTop } from "@/components/ScrollToTop";
import { serializeJsonLd, SITE_DESCRIPTION, SITE_JSON_LD, SITE_URL, DEFAULT_IMAGE } from "@/lib/seo";
import "./globals.css";

// Analytics IDs carried over from the live site.
const GA_ID = "G-PSZBQBCRQX";
const CLARITY_ID = "tsoodirahp";
const ENABLE_CLARITY = process.env.NODE_ENV === "production";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const TITLE = "TrackMCP: See how your MCP server is being used";

export const metadata: Metadata = {
  title: TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png", sizes: "96x96" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  applicationName: "TrackMCP",
  keywords: [
    "MCP",
    "Model Context Protocol",
    "MCP server analytics",
    "MCP directory",
    "MCP repository",
    "MCP servers",
    "AI agents",
  ],
  authors: [{ name: "TrackMCP" }],
  openGraph: {
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "TrackMCP",
    type: "website",
    images: [DEFAULT_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_IMAGE.url],
  },
  robots: { index: true, follow: true },
  // Google Search Console verification — replace with the real code when available.
  // verification: { google: "your-google-verification-code" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-canvas text-body">
        <ScrollToTop />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(SITE_JSON_LD) }} />
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
        />
        {children}

        {/* Google Analytics 4 */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>

        {/* Microsoft Clarity */}
        {ENABLE_CLARITY && (
          <Script id="clarity" strategy="lazyOnload">
            {`
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${CLARITY_ID}");
            `}
          </Script>
        )}

        {/* Vercel Analytics + Speed Insights */}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
