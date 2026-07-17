import "./globals.css";

export const metadata = {
  title: "Quotation & Risk Register",
  description: "Commercial Property Risk Unit - Quotation & Risk Register",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
