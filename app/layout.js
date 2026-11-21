import "./globals.css";

export const metadata = { title: "Join your group", description: "Get added to your class WhatsApp group" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
