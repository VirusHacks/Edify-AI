import { firebaseStorage } from "@/configs/firebase.config";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { CourseType } from "@/types/resume.type";

export const uploadFilesToFirebase = async (
  file: Blob,
  courseInfo: CourseType
) => {
  const fileName = `${Date.now()}-${courseInfo?.courseId!}-${
    courseInfo?.category
  }.jpg`;
  const storageRef = ref(firebaseStorage, "ai-content-generator/" + fileName);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
};
