import { Noto_Sans_TC } from 'next/font/google'
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans',
})

export const metadata = {
  title: "NCUE 獎助學金資訊平台",
  description: "彰化師範大學獎助學金資訊平台",
  icons: {
    icon: '/logo_b.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW" className={notoSans.variable}>
      <body className={notoSans.className}>
        <AuthProvider>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
