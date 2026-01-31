import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FreshMandi AI - Agricultural Marketplace',
  description: 'AI-powered marketplace for Indian fruits, vegetables, rice & grains with smart pricing and quality assessment',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FreshMandi AI'
  },
  formatDetection: {
    telephone: false
  },
  openGraph: {
    type: 'website',
    siteName: 'FreshMandi AI - Agricultural Marketplace',
    title: 'FreshMandi AI - Agricultural Marketplace',
    description: 'AI-powered marketplace for Indian fruits, vegetables, rice & grains with smart pricing and quality assessment',
  },
  twitter: {
    card: 'summary',
    title: 'FreshMandi AI - Agricultural Marketplace',
    description: 'AI-powered marketplace for Indian fruits, vegetables, rice & grains with smart pricing and quality assessment',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="VendorAI" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}