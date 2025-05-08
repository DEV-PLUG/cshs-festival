import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI로 배우는 볼링 - 과학창의체험전",
  description: "AI로 볼링을 배워보자!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko-kr">
      <body>
        {children}
      </body>
    </html>
  );
}
