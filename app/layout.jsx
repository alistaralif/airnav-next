import "./globals.css";
import AuthProvider from "@/context/AuthProvider";
import { BookmarkProvider } from "@/context/BookmarkContext";

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
            {children}
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
