"use client";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

const AddATSAnalysis = () => {
  return (
    <Link href="/ats" className="block">
      <div
        role="button"
        className="group cursor-pointer transition-all duration-300 hover:-translate-y-1"
      >
        <div 
          className="rounded-2xl border-2 border-dashed transition-all duration-300 h-80 flex flex-col items-center justify-center p-6 hover:shadow-lg group-hover:border-opacity-100"
          style={{
            backgroundColor: "#0A0A0A",
            borderColor: "#27272A",
            borderStyle: "dashed"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3B82F6";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#27272A";
          }}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: "#3B82F6" }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: "#E4E4E7" }}>New ATS Analysis</h3>
          <p className="text-sm text-center leading-relaxed" style={{ color: "#A1A1AA" }}>
            Analyze your resume and improve your ATS score
          </p>
        </div>
      </div>
    </Link>
  );
};

export default AddATSAnalysis;

