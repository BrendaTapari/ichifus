import type { Metadata } from "next";

import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Panel",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}
