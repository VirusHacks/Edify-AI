import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const UserToolTip = ({
  username,
  userProfileImage,
}: {
  username: string
  userProfileImage: string
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2 cursor-pointer">
            <p className="text-sm" style={{ color: "#A1A1AA" }}>This Course is by</p>
            <Badge 
              variant="secondary" 
              className="rounded-lg"
              style={{ 
                backgroundColor: "#27272A", 
                color: "#E4E4E7",
                borderColor: "#27272A"
              }}
            >
              {username}
            </Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom"
          className="rounded-lg border"
          style={{
            backgroundColor: "#27272A",
            borderColor: "#27272A"
          }}
        >
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarImage src={userProfileImage || "/userProfile.png"} alt={username} />
              <AvatarFallback style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}>{username.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium" style={{ color: "#E4E4E7" }}>{username}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default UserToolTip

