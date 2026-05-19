import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'QRtrol — Control horario por QR',
  description: 'Sistema de fichaje por QR dinámico para equipos',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} h-full`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fafafa',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
