"use client";

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

type EditCourseBasicInfoProps = {
  courseInfo: CourseType | null;
  onRefresh: (refresh: boolean) => void;
};

const EditCourseBasicInfo = ({ courseInfo, onRefresh }: EditCourseBasicInfoProps) => {
  const [courseTitle, setCourseTitle] = useState<string>("");
  const [courseDescription, setCourseDescription] = useState<string>("");

  useEffect(() => {
    setCourseTitle(courseInfo?.courseOutput.topic!);
    setCourseDescription(courseInfo?.courseOutput.description!);
  }, [courseInfo]);

  if (!courseInfo) return null;

  const updateCourseInfo = async () => {
    courseInfo.courseOutput.topic = courseTitle;
    courseInfo.courseOutput.description = courseDescription;
    // console.log(courseInfo);
    try {
      await fetch(`/api/courses/${encodeURIComponent(courseInfo.courseId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseOutput: courseInfo.courseOutput }),
      })
      onRefresh(true);
    } catch (e) {
      console.error('Error updating course info', e);
    }
  };

  return (
    <Dialog>
      <DialogTrigger>
        <FaEdit className="text-primary mx-1"/>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Course Title and Description</DialogTitle>
          <DialogDescription>
            <div className="mt-3">
              <label htmlFor="">Course Title</label>
              <Input
                placeholder="Enter course title"
                defaultValue={courseInfo?.courseOutput.topic}
                onChange={(e) => setCourseTitle(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="">Description</label>
              <Textarea
                className="h-40"
                placeholder="Enter course description"
                defaultValue={courseInfo?.courseOutput.description}
                onChange={(e) => setCourseDescription(e.target.value)}
              />
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={updateCourseInfo}>Update</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCourseBasicInfo;
