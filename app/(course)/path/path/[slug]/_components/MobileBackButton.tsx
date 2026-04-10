"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MobileBackButton() {
  const router = useRouter();

  return (
    <div className="md:hidden mb-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="rounded-xl transition-all duration-200 hover:opacity-90"
        style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );
}

