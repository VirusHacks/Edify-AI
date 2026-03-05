"use client"

import { useContext } from "react"
import { categoryList } from "../_shared/CategoryList"
import Image from "next/image"
import { UserInputContext } from "@/app/(course)/_context/UserInputContext"
import { Card, CardContent } from "@/components/ui/card"

const SelectCategory = () => {
  const { userInput, setUserInput } = useContext(UserInputContext)

  const handleCategorySelect = (category: string) => {
    setUserInput((prev) => ({ ...prev, category }))
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight" style={{ color: "#E4E4E7" }}>
          Select the course category
        </h2>
        <p className="text-sm" style={{ color: "#A1A1AA" }}>
          Choose a category that best matches your course topic
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {categoryList.map((category, index) => {
          const isSelected = userInput?.category === category.name
          return (
            <Card
              key={index}
              className={`
                cursor-pointer transition-all duration-200 rounded-2xl border
                hover:shadow-lg hover:scale-[1.02]
                ${isSelected ? 'ring-2 ring-offset-2' : ''}
              `}
              style={{
                backgroundColor: isSelected ? "#27272A" : "#0A0A0A",
                borderColor: isSelected ? "#3B82F6" : "#27272A",
                ...(isSelected ? {
                  boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.5), 0 0 0 4px rgba(10, 10, 10, 1)"
                } : {})
              }}
              onClick={() => handleCategorySelect(category.name)}
            >
              <CardContent className="flex flex-col items-center p-6 md:p-8">
                <div className="relative w-20 h-20 md:w-24 md:h-24 mb-4">
                  <Image
                    src={category.icon || "/placeholder.svg"}
                    alt={category.name}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h3 
                  className="text-base md:text-lg font-semibold text-center"
                  style={{ color: isSelected ? "#E4E4E7" : "#E4E4E7" }}
                >
                  {category.name}
                </h3>
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                    <span className="text-xs font-medium" style={{ color: "#3B82F6" }}>Selected</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default SelectCategory

