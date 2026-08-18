import "./globals.css";
import AuthProvider from "@/context/AuthProvider";
import { BookmarkProvider } from "@/context/BookmarkContext";
import SentryUserContext from "@/components/SentryUserContext";

export const metadata = {
  title: "AirNav",
  description: "Aviation Navigation App",
  icons: {
    icon: "/airnav_sg.svg",
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <BookmarkProvider>
            <SentryUserContext />
            {children}
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
