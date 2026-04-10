import React, { useCallback, useEffect, useState } from "react";
import { useResumeContext } from "@/context/resume-info-provider";
import useUpdateDocument from "@/features/document/use-update-document";
import { INITIAL_THEME_COLOR } from "@/constant/colors";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Palette, ChevronDown } from "lucide-react";
import { generateThumbnail } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";
import useDebounce from "@/hooks/use-debounce";

const ThemeColor = () => {
  const colors = [
    "#FF6F61", // Warm Coral
    "#33B679", // Fresh Green
    "#4B9CD3", // Soft Blue
    "#FF6F91", // Bright Magenta
    "#9B59B6", // Rich Purple
    "#1ABC9C", // Mint Green
    "#FF8C00", // Tangerine Orange
    "#B2D300", // Vibrant Lime
    "#8E44AD", // Deep Violet
    "#FF4F81", // Hot Pink
    "#2ECC71", // Light Jade
    "#3498DB", // Calm Sky Blue
    "#A3D550", // Neon Yellow-Green
    "#00BFFF", // Cool Azure
    "#FF6F61", // Coral Orange
    "#8E44AD", // Royal Blue
    "#2ECC71", // Electric Green
    "#5B2C6F", // Indigo Purple
    "#FF4F81", // Crimson Red
    "#2980B9", // Cobalt Blue
  ];

  const { resumeInfo, onUpdate } = useResumeContext();
  const { mutateAsync } = useUpdateDocument();

  const [selectedColor, setSelectedColor] = useState(INITIAL_THEME_COLOR);

  const debouncedColor = useDebounce<string>(selectedColor, 1000);

  useEffect(() => {
    if (debouncedColor) onSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedColor]);

  const onColorSelect = useCallback(
    (color: string) => {
      setSelectedColor(color);

      if (!resumeInfo) return;
      onUpdate({
        ...resumeInfo,
        themeColor: color,
      });
    },
    [resumeInfo, onUpdate]
  );

  const onSave = useCallback(async () => {
    if (!selectedColor) return;
    if (selectedColor === INITIAL_THEME_COLOR) return;
    const thumbnail = await generateThumbnail();

    await mutateAsync(
      {
        themeColor: selectedColor,
        thumbnail: thumbnail,
      },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Theme updated successfully",
          });
        },
        onError() {
          toast({
            title: "Error",
            description: "Failed to update theme",
            variant: "destructive",
          });
        },
      }
    );
  }, [selectedColor]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          disabled={resumeInfo?.status === "archived" ? true : false}
          variant="secondary"
          className="rounded-lg gap-1 !p-2 lg:w-auto lg:p-4"
          style={{
            backgroundColor: "#27272A",
            borderColor: "#27272A",
            color: "#E4E4E7"
          }}
        >
          <div className="flex items-center gap-1">
            <Palette size="18px" />
            <span className="hidden lg:flex text-md px-1">Theme</span>
          </div>
          <ChevronDown size="16px" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="rounded-xl border"
        style={{
          backgroundColor: "#0A0A0A",
          borderColor: "#27272A"
        }}
      >
        <h2
          className="mb-4 text-md font-semibold"
          style={{ color: "#E4E4E7" }}
        >
          Select Theme Color
        </h2>

        <div className="grid grid-cols-4 gap-3">
          {colors.map((item: string, index: number) => (
            <div
              role="button"
              key={index}
              onClick={() => onColorSelect(item)}
              className="h-8 w-12 rounded-lg border-2 transition-all cursor-pointer"
              style={{
                background: item,
                borderColor: selectedColor === item ? "#3B82F6" : "#27272A",
                boxShadow: selectedColor === item ? "0 0 0 2px rgba(59, 130, 246, 0.3)" : "none"
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ThemeColor;
