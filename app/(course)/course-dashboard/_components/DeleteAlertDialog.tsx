import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type DeleteAlertDialogProps = {
  open: boolean;
  setIsOpen: (value: boolean) => void;
  handleDeleteCourse: () => void;
};

const DeleteAlertDialog = ({
  open,
  setIsOpen,
  handleDeleteCourse,
}: DeleteAlertDialogProps) => {
  const deleteCourse = () => {
    handleDeleteCourse();
    setIsOpen(false);
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="rounded-2xl border" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold" style={{ color: "#E4E4E7" }}>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription className="text-sm" style={{ color: "#A1A1AA" }}>
            This action cannot be undone. This will permanently delete your course and remove all data associated with it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel 
            onClick={() => setIsOpen(false)}
            className="rounded-lg"
            style={{ 
              borderColor: "#27272A",
              backgroundColor: "#27272A",
              color: "#E4E4E7"
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => deleteCourse()} 
            className="rounded-lg font-medium"
            style={{ 
              backgroundColor: "#DC2626",
              color: "#FFFFFF"
            }}
          >
            Delete Course
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAlertDialog;
