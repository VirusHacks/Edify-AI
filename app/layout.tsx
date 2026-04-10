import "regenerator-runtime/runtime"
import type { Metadata } from "next"
import { Urbanist } from "next/font/google"
import dynamic from "next/dynamic"
import "./globals.css"
import "@stream-io/video-react-sdk/dist/css/styles.css"
import { cn } from "@/lib/utils"
import Navbar from "@/components/nav-bar"
import type React from "react"
import { NuqsAdapter } from "nuqs/adapters/next";
import { TRPCReactProvider } from "@/trpc/client";  
import { AllProviders } from "@/lib/providers"

const Dictaphone = dynamic(() => import("@/components/dictaphone"), { ssr: false })

const urbanist = Urbanist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-urbanist",
})

export const metadata: Metadata = {
  title: "Ediffy AI",
  description: "Interactive E - Learning Platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <NuqsAdapter>
      <TRPCReactProvider>
        <html lang="en" className="dark">
          <body className={cn("bg-[#0A0A0A] text-[#E4E4E7] font-sans antialiased", urbanist.variable)}>
            <Navbar />
            <AllProviders>
              <main className="min-h-screen w-full">
                <div className="w-full mx-auto">
                  {children}
                </div>
              </main>
              <span>
                <Dictaphone />
              </span>
            </AllProviders>
          </body>
        </html>
      </TRPCReactProvider>
    </NuqsAdapter>
  )
}

