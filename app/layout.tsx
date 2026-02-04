import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext";
import { PushNotificationPrompt } from "./components/PushNotificationPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CPM - Günlük Hedefler",
  description: "CPM Günlük Hedefler Takip Sistemi",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme_setting");var a=localStorage.getItem("accent_color");var m;if(t==="light"||t==="dark"){m=t}else{m=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}var e=document.documentElement;e.classList.remove("light","dark");e.classList.add(m);if(a==="blue"||a==="orange"||a==="green"){if(m==="dark"){if(a==="blue"){e.style.setProperty("--primary","#90CAF9");e.style.setProperty("--primary-container","#1E3A8A");e.style.setProperty("--selected-bg","#1E3A8A");e.style.setProperty("--selected-border","#90CAF9")}else if(a==="orange"){e.style.setProperty("--primary","#FFB74D");e.style.setProperty("--primary-container","#E65100");e.style.setProperty("--selected-bg","#E65100");e.style.setProperty("--selected-border","#FFB74D")}else{e.style.setProperty("--primary","#81C784");e.style.setProperty("--primary-container","#1B5E20");e.style.setProperty("--selected-bg","#1B5E20");e.style.setProperty("--selected-border","#81C784")}}else{if(a==="blue"){e.style.setProperty("--primary","#2196F3");e.style.setProperty("--primary-container","#E3F2FD");e.style.setProperty("--selected-bg","#E3F2FD");e.style.setProperty("--selected-border","#1976D2")}else if(a==="orange"){e.style.setProperty("--primary","#FF9800");e.style.setProperty("--primary-container","#FFF3E0");e.style.setProperty("--selected-bg","#FFF3E0");e.style.setProperty("--selected-border","#F57C00")}else{e.style.setProperty("--primary","#4CAF50");e.style.setProperty("--primary-container","#E8F5E8");e.style.setProperty("--selected-bg","#E8F5E8");e.style.setProperty("--selected-border","#2E7D32")}}}}catch(_){}})();`,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <NotificationProvider>
            <AuthProvider>
              {children}
              <PushNotificationPrompt />
            </AuthProvider>
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
