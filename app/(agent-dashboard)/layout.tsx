"use client";

import { DashboardNavbar } from "@/modules/dashboard/ui/components/dashboard-navbar";
import { usePathname } from "next/navigation";

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isProfilePage = pathname === "/profile";
  
  return (
    <main className="bg-muted flex h-screen w-screen flex-col">
      {!isProfilePage && <DashboardNavbar />}
      {children}
    </main>
  );
};

export default DashboardLayout;
