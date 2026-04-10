import React, { useCallback, useEffect } from "react";
import { useResumeContext } from "@/context/resume-info-provider";
import { Button } from "@/components/ui/button";
import { Loader, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import useUpdateDocument from "@/features/document/use-update-document";
import RichTextEditor from "@/components/editor";
import { generateThumbnail } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";

const initialState = {
  id: undefined,
  docId: undefined,
  title: "",
  companyName: "",
  city: "",
  state: "",
  startDate: "",
  endDate: "",
  workSummary: "",
  currentlyWorking: false,
};

const ExperienceForm = (props: { handleNext: () => void }) => {
  const { handleNext } = props;
  const { resumeInfo, onUpdate } = useResumeContext();

  const { mutateAsync, isPending } = useUpdateDocument();

  const [experienceList, setExperienceList] = React.useState(() => {
    return resumeInfo?.experiences?.length
      ? resumeInfo.experiences
      : [initialState];
  });

  useEffect(() => {
    if (!resumeInfo) return;
    onUpdate({
      ...resumeInfo,
      experiences: experienceList,
    });
  }, [experienceList]);

  const handleChange = (
    e: { target: { name: string; value: string } },
    index: number
  ) => {
    const { name, value } = e.target;

    setExperienceList((prevState) => {
      const newExperienceList = [...prevState];
      newExperienceList[index] = {
        ...newExperienceList[index],
        [name]: value,
      };
      return newExperienceList;
    });
  };

  const addNewExperience = () => {
    setExperienceList([...experienceList, initialState]);
  };

  const removeExperience = (index: number) => {
    const updatedExperience = [...experienceList];
    updatedExperience.splice(index, 1);
    setExperienceList(updatedExperience);
  };

  const handEditor = (value: string, name: string, index: number) => {
    setExperienceList((prevState) => {
      const newExperienceList = [...prevState];
      newExperienceList[index] = {
        ...newExperienceList[index],
        [name]: value,
      };
      return newExperienceList;
    });
  };

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();

      const thumbnail = await generateThumbnail();
      const currentNo = resumeInfo?.currentPosition
        ? resumeInfo.currentPosition + 1
        : 1;

      await mutateAsync(
        {
          currentPosition: currentNo,
          thumbnail: thumbnail,
          experience: experienceList,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Experience updated successfully",
            });
            handleNext();
          },
          onError() {
            toast({
              title: "Error",
              description: "Failed to update experience",
              variant: "destructive",
            });
          },
        }
      );
    },
    [resumeInfo, experienceList]
  );

  return (
    <div>
      <div className="w-full mb-6">
        <h2 className="font-bold text-xl mb-2" style={{ color: "#E4E4E7" }}>Professional Experience</h2>
        <p className="text-base" style={{ color: "#A1A1AA" }}>Add previous job experience</p>
      </div>
      <form onSubmit={handleSubmit} className="py-2">
        <div
          className="border w-full h-auto divide-y-[1px] rounded-md px-3 pb-4 my-5"
          style={{ borderColor: "#27272A" }}
        >
          {experienceList?.map((item, index) => (
            <div key={index}>
              <div
                className="relative grid 
                  grid-cols-2 mb-5 pt-4 gap-3
              "
              >
                {experienceList?.length > 1 && (
                  <Button
                    variant="secondary"
                    type="button"
                    className="size-[20px] text-center rounded-full absolute -top-3 -right-5"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF"
                    }}
                    size="icon"
                    onClick={() => removeExperience(index)}
                  >
                    <X size="13px" />
                  </Button>
                )}

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Position title</Label>
                  <Input
                    name="title"
                    placeholder=""
                    required
                    value={item?.title || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Company Name</Label>
                  <Input
                    name="companyName"
                    placeholder=""
                    required
                    value={item?.companyName || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>City</Label>
                  <Input
                    name="city"
                    placeholder=""
                    required
                    value={item?.city || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>State</Label>
                  <Input
                    name="state"
                    placeholder=""
                    required
                    value={item?.state || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Start Date</Label>
                  <Input
                    name="startDate"
                    type="date"
                    placeholder=""
                    required
                    value={item?.startDate || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>End Date</Label>
                  <Input
                    name="endDate"
                    type="date"
                    placeholder=""
                    required
                    value={item?.endDate || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="my-1 text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div className="col-span-2 mt-1">
                  {/* {Work Summary} */}
                  <RichTextEditor
                    jobTitle={item.title}
                    initialValue={item.workSummary || ""}
                    onEditorChange={(value: string) =>
                      handEditor(value, "workSummary", index)
                    }
                  />
                </div>
              </div>

              {index === experienceList.length - 1 &&
                experienceList.length < 5 && (
                  <Button
                    className="gap-1 mt-1 text-md font-semibold rounded-lg"
                    variant="outline"
                    type="button"
                    style={{
                      borderColor: "#27272A",
                      backgroundColor: "transparent",
                      color: "#3B82F6"
                    }}
                    onClick={addNewExperience}
                  >
                    <Plus size="15px" />
                    Add More Experience
                  </Button>
                )}
            </div>
          ))}
        </div>
        <Button 
          className="mt-4 text-md font-semibold rounded-lg transition-all duration-200 hover:opacity-90" 
          style={{
            backgroundColor: "#3B82F6",
            color: "#FFFFFF"
          }}
          type="submit" 
          disabled={isPending}
        >
          {isPending && <Loader size="15px" className="animate-spin" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
};

export default ExperienceForm;
