import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import DeleteAlertDialog from "./DeleteAlertDialog";
import { useState } from "react";

type DropDownOptionsProps = {
  children: React.ReactNode;
  handleDeleteCourse: () => void;
};

const DropDownOptions = ({
  children,
  handleDeleteCourse,
}: DropDownOptionsProps) => {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent 
          className="rounded-lg border min-w-[10rem]"
          style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
        >
          <DropdownMenuItem
            className="cursor-pointer rounded-md text-sm"
            style={{ color: "#E4E4E7" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#27272A";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
            onClick={() => setOpenDeleteAlertDialog(true)}
          >
            <Trash2 className="mr-2 w-4 h-4" style={{ color: "#DC2626" }} />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAlertDialog
        open={openDeleteAlertDialog}
        setIsOpen={setOpenDeleteAlertDialog}
        handleDeleteCourse={handleDeleteCourse}
      />
    </div>
  );
};

export default DropDownOptions;
