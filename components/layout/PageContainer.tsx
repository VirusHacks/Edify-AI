import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  withPadding?: boolean;
}

export const PageContainer = ({ 
  children, 
  className = "", 
  withPadding = true 
}: PageContainerProps) => {
  return (
    <div className={cn(
      "w-full max-w-[1400px] mx-auto",
      withPadding && "px-4 sm:px-6 lg:px-8",
      className
    )}>
      {children}
    </div>
  );
};

export default PageContainer;
