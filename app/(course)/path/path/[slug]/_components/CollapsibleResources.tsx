"use client"

import { useState } from "react"
import { BookOpen, ChevronDown, ExternalLink } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface Resource {
  title: string
  url: string
}

interface CollapsibleResourcesProps {
  resources: Resource[]
  defaultOpen?: boolean
}

export default function CollapsibleResources({ resources, defaultOpen = false }: CollapsibleResourcesProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 bg-transparent hover:bg-[#0f0f0f] rounded-xl transition-colors cursor-pointer group border border-[#27272A]">
          <h4 className="font-semibold text-[#E4E4E7] flex items-center gap-2 text-sm uppercase tracking-wide">
            <BookOpen className="w-4 h-4 text-[#3B82F6]" />
            Learning Resources
            <span className="text-xs font-normal text-[#A1A1AA] normal-case">
              ({resources.length})
            </span>
          </h4>
          <ChevronDown 
            className={`w-4 h-4 text-[#A1A1AA] group-hover:text-[#3B82F6] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="space-y-2">
          {resources.map((resource, resourceIndex) => (
            <a 
              key={resourceIndex}
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 p-3 bg-transparent hover:bg-[#0f1724]/5 rounded-lg transition-all duration-200 group border border-[#27272A]"
            >
              <div className="w-2 h-2 rounded-full bg-[#3B82F6] group-hover:bg-[#60A5FA] transition-colors flex-shrink-0"></div>
              <span className="text-[#E4E4E7] group-hover:text-[#3B82F6] font-medium text-sm flex-1">
                {resource.title}
              </span>
              <ExternalLink className="w-4 h-4 text-[#A1A1AA] group-hover:text-[#3B82F6] transition-colors flex-shrink-0" />
            </a>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

