import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// 다크모드 관련 next-theme
import { ThemeProvider } from "../components/theme-provider"

// 로그인 토큰 관련
import { AuthProvider } from '../contexts/AuthContext';

const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2"
});

export const metadata: Metadata = {
  title: "StudyMAIT",
  description: "공부의 습관화.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${pretendard.className}`}>
        <AuthProvider>
          <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
          >
              {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
