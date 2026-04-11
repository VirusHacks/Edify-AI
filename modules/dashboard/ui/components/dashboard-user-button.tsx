import { ChevronDownIcon, CreditCardIcon, LogOutIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

export const DashboardUserButton = () => {
  const { user, isLoading } = useKindeBrowserClient();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (isLoading || !user) return null;

  if (isMobile) {
    return (
      <Drawer>
        <DrawerTrigger className="border-border/10 flex w-full items-center justify-between gap-x-2 overflow-hidden rounded-lg border bg-white/5 p-3 hover:bg-white/10">
          {user.picture ? (
            <Avatar>
              <AvatarImage src={user.picture} />
            </Avatar>
          ) : (
            <GeneratedAvatar seed={user.given_name ?? "User"} variant="initials" className="mr-3 size-9" />
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden text-left">
            <p className="w-full truncate text-sm">{user.given_name ?? user.email}</p>
            <p className="w-full truncate text-xs">{user.email}</p>
          </div>
          <ChevronDownIcon className="size-4 shrink-0" />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{user.given_name ?? user.email}</DrawerTitle>
            <DrawerDescription>{user.email}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <Button variant="outline" onClick={() => router.push("/upgrade")}> <CreditCardIcon className="size-4 text-black" /> Billing </Button>
            <Button asChild variant="outline">
              <LogoutLink>Logout</LogoutLink>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="border-border/10 flex w-full items-center justify-between gap-x-2 overflow-hidden rounded-lg border bg-white/5 p-3 hover:bg-white/10">
        {user.picture ? (
          <Avatar>
            <AvatarImage src={user.picture} />
          </Avatar>
        ) : (
          <GeneratedAvatar seed={user.given_name ?? "User"} variant="initials" className="mr-3 size-9" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 overflow-hidden text-left">
          <p className="w-full truncate text-sm">{user.given_name ?? user.email}</p>
          <p className="w-full truncate text-xs">{user.email}</p>
        </div>
        <ChevronDownIcon className="size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-72">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="truncate font-medium">{user.given_name ?? user.email}</span>
            <span className="text-muted-foreground truncate text-sm font-normal">{user.email}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="flex cursor-pointer items-center justify-between" onClick={() => router.push("/upgrade")}>Billing<CreditCardIcon className="size-4" /></DropdownMenuItem>
        <DropdownMenuItem asChild className="flex cursor-pointer items-center justify-between">
          <LogoutLink>
            Logout
            <LogOutIcon className="size-4" />
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
