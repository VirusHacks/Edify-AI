"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Sparkles } from "lucide-react";

interface SectionOptimization {
  section_name: string;
  original_content: string;
  optimized_content: string;
  improvements: string[];
  keywords_added: string[];
}

interface SectionComparisonProps {
  optimization: SectionOptimization;
  onAccept: () => void;
  onReject: () => void;
  isAccepted?: boolean;
}

const SectionComparison: React.FC<SectionComparisonProps> = ({
  optimization,
  onAccept,
  onReject,
  isAccepted = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card
      className="rounded-xl border transition-all duration-200"
      style={{
        backgroundColor: isAccepted ? "#1E3A2E" : "#0A0A0A",
        borderColor: isAccepted ? "#22C55E" : "#27272A",
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize" style={{ color: "#E4E4E7" }}>
            {optimization.section_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isAccepted ? (
              <Badge
                className="rounded-lg px-2 py-1"
                style={{ backgroundColor: "#22C55E", color: "#FFFFFF" }}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Accepted
              </Badge>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAccept}
                  className="rounded-lg text-xs"
                  style={{
                    borderColor: "#22C55E",
                    color: "#22C55E",
                    backgroundColor: "transparent",
                  }}
                >
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onReject}
                  className="rounded-lg text-xs"
                  style={{
                    borderColor: "#EF4444",
                    color: "#EF4444",
                    backgroundColor: "transparent",
                  }}
                >
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Side-by-side comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#EF4444" }}></div>
              <span className="text-xs font-medium" style={{ color: "#A1A1AA" }}>
                Original
              </span>
            </div>
            <div
              className="p-3 rounded-lg text-sm whitespace-pre-wrap"
              style={{
                backgroundColor: "#27272A",
                color: "#A1A1AA",
                minHeight: "100px",
                maxHeight: "300px",
                overflowY: "auto",
              }}
            >
              {optimization.original_content || "No content"}
            </div>
          </div>

          {/* Optimized */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#22C55E" }}></div>
              <span className="text-xs font-medium" style={{ color: "#A1A1AA" }}>
                Optimized
              </span>
              <Sparkles className="w-3 h-3" style={{ color: "#3B82F6" }} />
            </div>
            <div
              className="p-3 rounded-lg text-sm whitespace-pre-wrap"
              style={{
                backgroundColor: "#27272A",
                color: "#E4E4E7",
                minHeight: "100px",
                maxHeight: "300px",
                overflowY: "auto",
                border: "1px solid #3B82F6",
              }}
            >
              {optimization.optimized_content || "No content"}
            </div>
          </div>
        </div>

        {/* Improvements and Keywords */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
            style={{ color: "#3B82F6" }}
          >
            {showDetails ? "Hide" : "Show"} Details
            <ArrowRight
              className={`w-3 h-3 ml-1 transition-transform ${showDetails ? "rotate-90" : ""}`}
            />
          </Button>
        </div>

        {showDetails && (
          <div className="space-y-3 pt-3 border-t" style={{ borderColor: "#27272A" }}>
            {optimization.improvements && optimization.improvements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2" style={{ color: "#E4E4E7" }}>
                  Improvements:
                </h4>
                <ul className="space-y-1">
                  {optimization.improvements.map((improvement, idx) => (
                    <li
                      key={idx}
                      className="text-xs flex items-start gap-2"
                      style={{ color: "#A1A1AA" }}
                    >
                      <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "#22C55E" }} />
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {optimization.keywords_added && optimization.keywords_added.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold mb-2" style={{ color: "#E4E4E7" }}>
                  Keywords Added:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {optimization.keywords_added.map((keyword, idx) => (
                    <Badge
                      key={idx}
                      className="rounded-md px-2 py-0.5 text-xs"
                      style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionComparison;

