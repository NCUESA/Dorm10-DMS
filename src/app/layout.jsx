'use client'

import { Noto_Sans_TC } from 'next/font/google'
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { useState, useLayoutEffect, useRef } from 'react';
import logo from "@/app/assets/logo.ico";

const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans',
})

const metadata = {
  title: '彰師大生輔組 校外獎助學金資訊平台',
  icon: logo,
}

export default function RootLayout({ children }) {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    // Initial height calculation
    updateHeaderHeight();

    // Observe header for resize changes
    const resizeObserver = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    return () => {
      if (headerRef.current) {
        resizeObserver.unobserve(headerRef.current);
      }
    };
  }, []);

  return (
    <html lang="zh-TW" className={notoSans.variable}>
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="shortcut icon" href={metadata.icon} type="image/x-icon" />
        <title>{metadata.title}</title>
      </head>
      <body className={notoSans.className}>
          <AuthProvider>
            <Header ref={headerRef} />
            <main style={{ paddingTop: `${headerHeight}px` }}>
              {children}
            </main>
            <Footer />
          </AuthProvider>
      </body>
    </html>
  );
}
