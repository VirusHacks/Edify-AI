import React, { useCallback, useEffect } from "react";
import { Loader } from "lucide-react";
import { useResumeContext } from "@/context/resume-info-provider";
import { PersonalInfoType } from "@/types/resume.type";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PersonalInfoSkeletonLoader from "@/components/skeleton-loader/personal-info-loader";
import { generateThumbnail } from "@/lib/helper";
import useUpdateDocument from "@/features/document/use-update-document";
import { toast } from "@/hooks/use-toast";

const initialState = {
  id: undefined,
  firstName: "",
  lastName: "",
  jobTitle: "",
  address: "",
  phone: "",
  email: "",
};

const PersonalInfoForm = (props: { handleNext: () => void }) => {
  const { handleNext } = props;
  const { resumeInfo, isLoading, onUpdate } = useResumeContext();
  const { mutateAsync, isPending } = useUpdateDocument();

  const [personalInfo, setPersonalInfo] =
    React.useState<PersonalInfoType>(initialState);

  useEffect(() => {
    if (!resumeInfo) {
      return;
    }
    if (resumeInfo?.personalInfo) {
      setPersonalInfo({
        ...(resumeInfo?.personalInfo || initialState),
      });
    }
  }, [resumeInfo?.personalInfo]);

  const handleChange = useCallback(
    (e: { target: { name: string; value: string } }) => {
      const { name, value } = e.target;

      setPersonalInfo({ ...personalInfo, [name]: value });

      if (!resumeInfo) return;

      onUpdate({
        ...resumeInfo,
        personalInfo: {
          ...resumeInfo.personalInfo,
          [name]: value,
        },
      });
    },
    [resumeInfo, onUpdate]
  );

  const handleSubmit = useCallback(
    async (e: { preventDefault: () => void }) => {
      e.preventDefault();

      const thumbnail = await generateThumbnail();
      const currentNo = resumeInfo?.currentPosition
        ? resumeInfo?.currentPosition + 1
        : 1;
      await mutateAsync(
        {
          currentPosition: currentNo,
          thumbnail: thumbnail,
          personalInfo: personalInfo,
        },
        {
          onSuccess: () => {
            toast({
              title: "Success",
              description: "PersonalInfo updated successfully",
            });
            handleNext();
          },
          onError: () => {
            toast({
              title: "Error",
              description: "Failed to update personal information",
              variant: "destructive",
            });
          },
        }
      );
    },
    [resumeInfo, personalInfo]
  );

  if (isLoading) {
    return <PersonalInfoSkeletonLoader />;
  }

  return (
    <div>
      <div className="w-full mb-6">
        <h2 className="font-bold text-xl mb-2" style={{ color: "#E4E4E7" }}>Personal Information</h2>
        <p className="text-base" style={{ color: "#A1A1AA" }}>Get Started with the personal information</p>
      </div>
      <div>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 mt-5 gap-4 py-2">
            <div>
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>First Name</Label>
              <Input
                name="firstName"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.firstName || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div>
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>Last Name</Label>
              <Input
                name="lastName"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.lastName || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div className="col-span-2 py-2">
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>Job Title</Label>
              <Input
                name="jobTitle"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.jobTitle || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div className="col-span-2 py-2">
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>Address</Label>
              <Input
                name="address"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.address || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div className="col-span-2 py-2">
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>Phone number</Label>
              <Input
                name="phone"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.phone || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
            <div className="col-span-2 py-2">
              <Label className="text-sm font-medium mb-2" style={{ color: "#E4E4E7" }}>Email</Label>
              <Input
                name="email"
                required
                autoComplete="off"
                placeholder=""
                value={personalInfo?.email || ""}
                onChange={handleChange}
                className="text-md my-1 rounded-lg"
                style={{
                  backgroundColor: "#27272A",
                  borderColor: "#27272A",
                  color: "#E4E4E7"
                }}
              />
            </div>
          </div>

          <Button
            className="mt-4 text-md font-semibold py-2 rounded-lg transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#3B82F6",
              color: "#FFFFFF"
            }}
            type="submit"
            disabled={
              isPending || resumeInfo?.status === "archived" ? true : false
            }
          >
            {isPending && <Loader size="15px" className="animate-spin" />}
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
