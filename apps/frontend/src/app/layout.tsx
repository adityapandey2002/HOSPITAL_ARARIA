import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './styles/globals.css';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'District Hospital Araria | Government of Bihar',
    template: '%s | District Hospital Araria',
  },
  description: 'Official website of District Hospital Araria, Bihar. Book appointments, view doctors, check blood availability, and access healthcare services.',
  keywords: ['hospital', 'araria', 'bihar', 'healthcare', 'appointments', 'doctors', 'blood bank', 'government hospital'],
  authors: [{ name: 'District Hospital Araria' }],
  creator: 'District Hospital Araria',
  publisher: 'Government of Bihar',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://dhararia.bihar.gov.in',
    siteName: 'District Hospital Araria',
    title: 'District Hospital Araria | Government of Bihar',
    description: 'Official website of District Hospital Araria, Bihar. Book appointments, view doctors, check blood availability, and access healthcare services.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'District Hospital Araria',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'District Hospital Araria',
    description: 'Official website of District Hospital Araria, Bihar.',
    images: ['/og-image.jpg'],
  },
  verification: {
    google: 'google-site-verification-code',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0ea5e9' },
    { media: '(prefers-color-scheme: dark)', color: '#0369a1' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
        <Toaster position="top-right" toastOptions={{ className: 'bg-white text-gray-900' }} />
      </body>
    </html>
  );
}