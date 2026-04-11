"use client";

import { useEffect, useState } from "react";

import { DashboardCommand } from "@/modules/dashboard/ui/components/dashboard-command";

export const DashboardNavbar = () => {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", down);

    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <DashboardCommand open={commandOpen} setOpen={setCommandOpen} />

      <nav className="bg-background flex items-center gap-x-2 border-b px-4 py-3">
        {/* Sidebar toggle button hidden */}
        {/* <Button variant="outline" className="size-9" onClick={toggleSidebar}>
          {state === "collapsed" || isMobile ? (
            <PanelLeftIcon className="size-4" />
          ) : (
            <PanelLeftCloseIcon className="size-4" />
          )}
        </Button> */}
      </nav>
    </>
  );
};
