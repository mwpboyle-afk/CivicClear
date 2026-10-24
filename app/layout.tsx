import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicClear — Municipal Budget Explorer",
  description:
    "Upload a local government budget PDF, explore it through visualizations, and ask plain-English questions grounded in the document.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
