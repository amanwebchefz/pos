import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
 import { ToastContainer } from 'react-toastify';


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Enterprise POS System',
  description: 'Modern Point of Sale System for Retail, Restaurant, and Warehouse',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <ToastContainer position="top-right" autoClose={3000} />
        </body>
    </html>
  )
}
