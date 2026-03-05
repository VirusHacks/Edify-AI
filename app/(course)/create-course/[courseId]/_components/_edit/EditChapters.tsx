import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DialogClose } from "@radix-ui/react-dialog";
import { FaEdit } from "react-icons/fa";
import { useEffect, useState } from "react";
// Server updates will be performed via API; avoid importing server DB in client component
import { CourseType } from "@/types/resume.type";

type EditChapterProps = {
  course: CourseType;
  index: number;
  onRefresh: (refresh: boolean) => void;
};

const EditChapters = ({ course, index, onRefresh }: EditChapterProps) => {
  const chapter = course.courseOutput.chapters;
  const [chapterName, setChapterName] = useState<string>("");
  const [chapterDescription, setChapterDescription] = useState<string>("");

  useEffect(() => {
    setChapterName(chapter[index]?.chapter_name);
    setChapterDescription(chapter[index]?.description);
  }, [chapter, index]);

  if (!chapter || chapter.length === 0) {
    return <p>No chapters available to edit.</p>;
  }

  const updateChapter = async () => {
    chapter[index].chapter_name = chapterName;
    chapter[index].description = chapterDescription;
    try {
      await fetch(`/api/courses/${encodeURIComponent(course.courseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOutput: course.courseOutput }),
      })
      onRefresh(true);
    } catch (e) {
      console.error('Error updating chapter', e);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
      <FaEdit className="text-primary mx-3"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Chapter</DialogTitle>
          <DialogDescription>
            <div className="mt-3">
              <label htmlFor="">Chapter Name</label>
              <Input
                placeholder="Enter course title"
                defaultValue={chapter[index]?.chapter_name}
                onChange={(e) => setChapterName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="">Chapter Description</label>
              <Textarea
                className="h-40"
                placeholder="Enter course description"
                defaultValue={chapter[index]?.description}
                onChange={(e) => setChapterDescription(e.target.value)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={updateChapter}>Update</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditChapters;
