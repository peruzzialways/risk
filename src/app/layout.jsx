import "./globals.css";

export const metadata = {
  title: "Quotation & Risk Register",
  description: "Commercial Property Risk Unit - Quotation & Risk Register",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
