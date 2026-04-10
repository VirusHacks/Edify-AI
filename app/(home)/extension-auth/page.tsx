"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

// Chrome extension global (only available in browser extension context)
// Declared as `any` so TypeScript doesn't error in non-extension environments.
declare const chrome: any;

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const generateToken = async () => {
    setStatus("loading");
    setMessage("Generating extension token...");

    try {
      const response = await fetch("/api/extension-token", {
        method: "POST",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.token) {
        // Send token to extension
        if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage(
            chrome.runtime.id,
            {
              action: "storeToken",
              token: data.token,
              expiresAt: data.expiresAt,
            },
            (response: any) => {
              if (chrome.runtime.lastError) {
                setStatus("error");
                setMessage(
                  "Extension not found. Please make sure the extension is installed and reloaded."
                );
              } else {
                setStatus("success");
                setMessage("Token generated and stored successfully! You can now use the extension.");
              }
            }
          );
        } else {
          setStatus("error");
          setMessage("Extension context not available. Please reload the extension.");
        }
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to generate token");
      }
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to generate token. Please try again."
      );
    }
  };

  useEffect(() => {
    // Auto-generate token on page load
    generateToken();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-3 sm:p-4" style={{ backgroundColor: "#0A0A0A" }}>
      <Card className="w-full max-w-md rounded-xl sm:rounded-2xl" style={{ backgroundColor: "#18181B", borderColor: "#27272A" }}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg md:text-xl text-[#E4E4E7]">Extension Authentication</CardTitle>
          <CardDescription className="text-xs sm:text-sm text-[#A1A1AA]">
            Generate a token for the Chrome extension to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0 sm:pt-0">
          {status === "loading" && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#A1A1AA]">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              <span>{message}</span>
            </div>
          )}

          {status === "success" && (
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#22C55E]">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>{message}</span>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#EF4444]">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{message}</span>
              </div>
              <Button
                onClick={generateToken}
                className="w-full h-10 sm:h-11 text-sm sm:text-base"
                style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
              >
                Try Again
              </Button>
            </div>
          )}

          {status === "idle" && (
            <Button
              onClick={generateToken}
              className="w-full h-10 sm:h-11 text-sm sm:text-base"
              style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            >
              Generate Token
            </Button>
          )}

          <p className="text-[10px] sm:text-xs text-[#71717A] mt-3 sm:mt-4">
            This token allows the extension to track jobs on your behalf. It expires in 7 days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

