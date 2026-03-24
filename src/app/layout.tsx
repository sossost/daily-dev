import type { Metadata, Viewport } from "next";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SentryProvider } from "@/components/SentryProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { DataProvider } from "@/components/DataProvider";
import { getUserId } from "@/lib/supabase/getUserId";
import { loadServerUserData } from "@/lib/supabase/loadUserData";
import { SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "DailyDev",
    images: [
      { url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_TITLE },
    ],
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialData = null;
  let isAuthenticated = false;
  let userId: string | null = null;
  try {
    const identity = await getUserId();
    if (identity != null) {
      userId = identity.id;
      isAuthenticated = identity.type === "auth";
      initialData = await loadServerUserData(identity.id);
    }
  } catch {
    // Supabase unavailable — continue with empty state
  }
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VV73KM83GP"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-VV73KM83GP');`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=JSON.parse(localStorage.getItem('daily-dev-theme')||'{}');var mode=m.state&&m.state.mode||'system';var dark=mode==='dark'||(mode==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark')}catch(e){}})()`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen antialiased transition-colors">
        <SentryProvider>
          <ErrorBoundary>
            <DataProvider userId={userId} isAuthenticated={isAuthenticated} initialData={initialData}>
              <main className="max-w-lg mx-auto px-4 py-8">{children}</main>
              <ToastProvider />
            </DataProvider>
          </ErrorBoundary>
        </SentryProvider>
      </body>
    </html>
  );
}
