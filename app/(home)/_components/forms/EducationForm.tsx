import React, { useCallback, useEffect } from "react";
import { useResumeContext } from "@/context/resume-info-provider";
import { Button } from "@/components/ui/button";
import { Loader, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import useUpdateDocument from "@/features/document/use-update-document";
import { generateThumbnail } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";

const initialState = {
  id: undefined,
  docId: undefined,
  universityName: "",
  startDate: "",
  endDate: "",
  degree: "",
  major: "",
  description: "",
};

const EducationForm = (props: { handleNext: () => void }) => {
  const { handleNext } = props;
  const { resumeInfo, onUpdate } = useResumeContext();

  const { mutateAsync, isPending } = useUpdateDocument();

  const [educationList, setEducationList] = React.useState(() => {
    return resumeInfo?.educations?.length
      ? resumeInfo.educations
      : [initialState];
  });

  useEffect(() => {
    if (!resumeInfo) return;
    onUpdate({
      ...resumeInfo,
      educations: educationList,
    });
  }, [educationList]);

  const handleChange = (
    e: { target: { name: string; value: string } },
    index: number
  ) => {
    const { name, value } = e.target;

    setEducationList((prevState) => {
      const newEducationList = [...prevState];
      newEducationList[index] = {
        ...newEducationList[index],
        [name]: value,
      };
      return newEducationList;
    });
  };

  const addNewEducation = () => {
    setEducationList([...educationList, initialState]);
  };

  const removeEducation = (index: number) => {
    const updatedEducation = [...educationList];
    updatedEducation.splice(index, 1);
    setEducationList(updatedEducation);
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
          education: educationList,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Education updated successfully",
            });
            handleNext();
          },
          onError() {
            toast({
              title: "Error",
              description: "Failed to update education",
              variant: "destructive",
            });
          },
        }
      );
    },
    [resumeInfo, educationList]
  );

  return (
    <div>
      <div className="w-full mb-6">
        <h2 className="font-bold text-xl mb-2" style={{ color: "#E4E4E7" }}>Education</h2>
        <p className="text-base" style={{ color: "#A1A1AA" }}>Add your education details</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          className="border w-full h-auto divide-y-[1px] rounded-md px-3 pb-4 my-5"
          style={{ borderColor: "#27272A" }}
        >
          {educationList?.map((item, index) => (
            <div key={index}>
              <div
                className="relative grid gride-cols-2
                  mb-5 pt-4 gap-3
                  "
              >
                {educationList?.length > 1 && (
                  <Button
                    variant="secondary"
                    type="button"
                    disabled={isPending}
                    className="size-[20px] text-center rounded-full absolute -top-3 -right-5"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF"
                    }}
                    size="icon"
                    onClick={() => removeEducation(index)}
                  >
                    <X size="13px" />
                  </Button>
                )}

                <div className="col-span-2">
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>University Name</Label>
                  <Input
                    name="universityName"
                    placeholder=""
                    required
                    value={item?.universityName || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="text-md mt-1 rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Degree</Label>
                  <Input
                    name="degree"
                    placeholder=""
                    required
                    value={item?.degree || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="text-md mt-1 rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Major</Label>
                  <Input
                    name="major"
                    placeholder=""
                    required
                    value={item?.major || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="text-md mt-1 rounded-lg"
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
                    className="text-md mt-1 rounded-lg"
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
                    className="text-md mt-1 rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>
                <div className="col-span-2 mt-1">
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Description</Label>
                  <Textarea
                    name="description"
                    placeholder=""
                    required
                    value={item.description || ""}
                    onChange={(e) => handleChange(e, index)}
                    className="text-md mt-1 rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>
              </div>

              {index === educationList.length - 1 &&
                educationList.length < 5 && (
                  <Button
                    className="gap-1 mt-1 text-md font-semibold rounded-lg"
                    variant="outline"
                    type="button"
                    disabled={isPending}
                    style={{
                      borderColor: "#27272A",
                      backgroundColor: "transparent",
                      color: "#3B82F6"
                    }}
                    onClick={addNewEducation}
                  >
                    <Plus size="15px" />
                    Add More Education
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

export default EducationForm;
