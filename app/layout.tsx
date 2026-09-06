import type { Metadata } from 'next'
import { Be_Vietnam_Pro, Inter } from 'next/font/google'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-be-vietnam-pro',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OBLUE',
  description: 'Nền tảng lớp học cho giáo viên ngoại ngữ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
