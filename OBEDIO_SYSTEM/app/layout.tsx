import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarNav } from '@/components/sidebar-nav'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/toaster'
import { PWAProvider } from '@/components/pwa/pwa-provider'
import { InstallPrompt } from '@/components/pwa/install-prompt'
import { OfflineIndicator, OfflineBanner } from '@/components/pwa/offline-indicator'
import { UpdateNotification, UpdateBanner } from '@/components/pwa/update-notification'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'OBEDIO Admin',
  description: 'OBEDIO MQTT Monitor & Control System - Luxury yacht management and real-time device monitoring',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'OBEDIO Admin',
    startupImage: [
      {
        media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
        url: '/apple-touch-startup-image-640x1136.png'
      },
      {
        media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)',
        url: '/apple-touch-startup-image-750x1334.png'
      },
      {
        media: '(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)',
        url: '/apple-touch-startup-image-1242x2208.png'
      }
    ]
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'OBEDIO Admin',
    'msapplication-TileColor': '#3B7EFF',
    'msapplication-TileImage': '/icon-192x192.svg',
    'msapplication-config': '/browserconfig.xml',
    'msapplication-tap-highlight': 'no'
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3B7EFF'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <PWAProvider>
            <OfflineBanner />
            <UpdateBanner />
            <div className="flex min-h-screen">
              <SidebarNav />
              <div className="flex flex-1 flex-col">
                <Header />
                <OfflineIndicator />
                <main className="flex-1 p-6">
                  {children}
                </main>
              </div>
            </div>
            <Toaster />
            <InstallPrompt />
            <UpdateNotification />
          </PWAProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
