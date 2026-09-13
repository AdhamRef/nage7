import { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import DeviceGuard from '@/components/device-guard'
 import ToastProvider from '@/components/providers/toastProvider'
import AuthSessionProvider from '@/components/providers/session-provider'
import { ConfettiProvider } from '@/components/providers/confetti-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

const SITE_NAME = 'ناجح'
const TITLE = 'ناجح | مدرسك الخصوصي في برمجة ٢ بكالوريا'
const DESCRIPTION =
  'شرح منهج برمجة ٢ للبكالوريا درس ورا درس: فيديو مقسّم، تمارين بتتصحّح، امتحانات على المنهج، ومتابعة لدرجاتك — أونلاين وفي وقتك.'

/**
 * The tab icon, Apple icon and Open Graph image are picked up automatically
 * from app/icon.png, app/apple-icon.png and app/opengraph-image.png — square
 * and 1200×630 crops of the logo, since the wide wordmark on its own squashes
 * into a sliver in a browser tab.
 *
 * metadataBase turns those into absolute URLs, which social crawlers need.
 */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.NEXTAUTH_URL ??
      'http://localhost:3000'
  ),
  title: {
    default: TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ar_EG',
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
}

/**
 * Cairo, self-hosted. It is a variable font, so the whole 200–1000 range comes
 * from the one file — declaring it means `font-black` renders at 900 instead
 * of being synthesised by the browser.
 */
const cairo = localFont({
  src: '../public/fonts/Cairo-VariableFont_slnt,wght.ttf',
  weight: '200 1000',
  style: 'normal',
  display: 'swap',
  variable: '--font-cairo',
  fallback: ['Segoe UI', 'Tahoma', 'sans-serif'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" className={cairo.variable}>
      <body className={cairo.className}>
        <AuthSessionProvider>
          <ConfettiProvider />
          <ThemeProvider
            attribute="class"
            defaultTheme='dark'
            enableSystem
            disableTransitionOnChange
          >
          <DeviceGuard />
          <ToastProvider />
          {children}
          </ThemeProvider>
        </AuthSessionProvider>
      </body>
    </html>
  )
}
