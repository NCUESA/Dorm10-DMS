import { Noto_Sans_TC } from 'next/font/google'
import "./globals.css";
import icon from "./assets/logo_b.png"
import logo from "./assets/logo.png"
import Header from "./components/Header";
import Footer from "./components/Footer";



const notoSans = Noto_Sans_TC({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-noto-sans',
})

export const metadata = {
  title: "NCUE 獎助學金資訊平台",
  description: "",
  icon:icon,
  logo:logo
};

export default function RootLayout({ children }) {
  return (
    <>
      <html lang="en" className={notoSans.variable}>
        <head>
            <meta charSet="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <link rel="icon" href={metadata.icon || "/favicon.ico"} />
            <link rel="apple-touch-icon" href={metadata.logo} />
            <title>{metadata.title}</title>
        </head>
        <body className={notoSans.className}>
          <Header />
          <main>
            {children}
          </main>
          <Footer />
        </body>
      </html>
    </>
  );
}
