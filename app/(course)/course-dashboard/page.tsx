"use client";

import AddCourse from "./_components/AddCourse";
import ExplorePage from "./_components/ExplorePage";
import UserCourseList from "./_components/UserCourseList";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const Page = () => {
  const router = useRouter();
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      <PageContainer className="py-4 sm:py-6 md:py-8 lg:py-12 space-y-6 sm:space-y-8 md:space-y-12 max-w-screen-xl">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
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
        
        <AddCourse />
        <UserCourseList />
        <ExplorePage />
      </PageContainer>
    </div>
  );
};

export default Page;
