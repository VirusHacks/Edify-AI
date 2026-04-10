import React, { useCallback, useEffect } from "react";
import { Loader, Plus, X } from "lucide-react";
import { Rating } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResumeContext } from "@/context/resume-info-provider";
import useUpdateDocument from "@/features/document/use-update-document";
import { generateThumbnail } from "@/lib/helper";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

const initialState = {
  name: "",
  rating: 0,
};

const SkillsForm = () => {
  const { resumeInfo, onUpdate } = useResumeContext();
  const { mutateAsync, isPending } = useUpdateDocument();

  const [skillsList, setSkillsList] = React.useState([
    ...(resumeInfo?.skills || []),
    initialState,
  ]);

  useEffect(() => {
    if (!resumeInfo) {
      return;
    }
    onUpdate({
      ...resumeInfo,
      skills: skillsList,
    });
  }, [skillsList]);

  const handleChange = (
    value: string | number,
    name: string,
    index: number
  ) => {
    setSkillsList((prevState) => {
      const newSkillList = [...prevState];
      newSkillList[index] = {
        ...newSkillList[index],
        [name]: value,
      };
      return newSkillList;
    });
  };

  const addNewSkill = () => {
    setSkillsList([...skillsList, initialState]);
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...skillsList];
    updatedSkills.splice(index, 1);
    setSkillsList(updatedSkills);
  };

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();
      const thumbnail = await generateThumbnail();

      await mutateAsync(
        {
          currentPosition: 1,
          thumbnail: thumbnail,
          skills: skillsList,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "Skills updated successfully",
            });
          },
          onError() {
            toast({
              title: "Error",
              description: "Failed to update skills",
              variant: "destructive",
            });
          },
        }
      );
    },
    [skillsList]
  );

  return (
    <div>
      <div className="w-full mb-6">
        <h2 className="font-bold text-xl mb-2" style={{ color: "#E4E4E7" }}>Skills</h2>
        <p className="text-base" style={{ color: "#A1A1AA" }}>Add your skills information</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div
          className="border w-full h-auto divide-y-[1px] rounded-md px-3 pb-4 my-5"
          style={{ borderColor: "#27272A" }}
        >
          {skillsList.map((item, index) => (
            <div key={index}>
              <div
                className="relative flex 
                items-center 
    justify-between mb-5 pt-4 gap-3"
              >
                {skillsList?.length > 1 && (
                  <Button
                    variant="secondary"
                    type="button"
                    className="size-[20px] text-center rounded-full absolute -top-3 -right-5"
                    style={{
                      backgroundColor: "#EF4444",
                      color: "#FFFFFF"
                    }}
                    size="icon"
                    disabled={isPending}
                    onClick={() => removeSkill(index)}
                  >
                    <X size="13px" />
                  </Button>
                )}

                <div className="flex-1">
                  <Label className="text-sm font-medium mb-2 px-2" style={{ color: "#E4E4E7" }}>Name</Label>
                  <Input
                    name="name"
                    placeholder=""
                    required
                    autoComplete="off"
                    value={item.name || ""}
                    onChange={(e) =>
                      handleChange(e.target.value, "name", index)
                    }
                    className="text-md rounded-lg"
                    style={{
                      backgroundColor: "#27272A",
                      borderColor: "#27272A",
                      color: "#E4E4E7"
                    }}
                  />
                </div>

                <div className="shrink-0 pt-5">
                  <Rating
                    style={{ maxWidth: 120 }}
                    isDisabled={!item.name}
                    value={item?.rating || 0}
                    onChange={(value: number) =>
                      handleChange(value, "rating", index)
                    }
                  />
                </div>
              </div>

              {index === skillsList.length - 1 && skillsList.length < 15 && (
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
                  onClick={addNewSkill}
                >
                  <Plus size="15px" />
                  Add More Skills
                </Button>
              )}
            </div>
          ))}
        </div>
        <Link href={'/dashboard'}>
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
          Save & Done
        </Button>
        </Link>
      </form>
    </div>
  );
};

export default SkillsForm;
