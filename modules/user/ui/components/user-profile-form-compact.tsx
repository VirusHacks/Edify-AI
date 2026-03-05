"use client";

import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon, XIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { userUpdateSchema } from "@/modules/user/schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GeneratedAvatar } from "@/components/generated-avatar";
export const UserProfileFormCompact = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: user } = useSuspenseQuery(trpc.user.getOne.queryOptions());

  const updateUser = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.user.getOne.queryOptions());
        toast.success("Profile updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm<z.infer<typeof userUpdateSchema>>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      bio: user.bio || "",
      interests: (() => {
        try {
          return user.interests ? JSON.parse(user.interests) : [];
        } catch {
          return [];
        }
      })(),
      skills: (() => {
        try {
          return user.skills ? JSON.parse(user.skills) : [];
        } catch {
          return [];
        }
      })(),
      occupation: user.occupation || "",
      location: user.location || "",
    },
  });

  const interests = useFieldArray({ control: form.control as any, name: "interests" });
  const skills = useFieldArray({ control: form.control as any, name: "skills" });

  const isPending = updateUser.isPending;

  const onSubmit = (values: z.infer<typeof userUpdateSchema>) => {
    updateUser.mutate(values);
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4">
          <GeneratedAvatar
            seed={user.name}
            variant="botttsNeutral"
            className="size-20 border-2 border-slate-200"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
        </div>

        {/* Core Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            name="occupation"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Software Engineer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="location"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. San Francisco, CA" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          name="bio"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell us about yourself..."
                  className="min-h-[80px]"
                />
              </FormControl>
              <FormDescription>
                Write a short description about yourself
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Interests */}
        <FormField
          name="interests"
          control={form.control}
          render={() => (
            <FormItem>
              <FormLabel>Interests</FormLabel>
              <div className="flex flex-wrap gap-2">
                {interests.fields.map((field, index) => (
                  <Badge key={field.id} variant="secondary" className="gap-1 pr-1">
                    {form.watch(`interests.${index}`)}
                    <button
                      type="button"
                      onClick={() => interests.remove(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add interest"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value && !form.watch("interests")?.includes(value)) {
                        interests.append(value);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Add interest"]');
                    const value = input?.value.trim();
                    if (value && !form.watch("interests")?.includes(value)) {
                      interests.append(value);
                      input!.value = "";
                    }
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                Add your interests for personalized recommendations. Press Enter to add.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Skills */}
        <FormField
          name="skills"
          control={form.control}
          render={() => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <div className="flex flex-wrap gap-2">
                {skills.fields.map((field, index) => (
                  <Badge key={field.id} variant="secondary" className="gap-1 pr-1">
                    {form.watch(`skills.${index}`)}
                    <button
                      type="button"
                      onClick={() => skills.remove(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim();
                      if (value && !form.watch("skills")?.includes(value)) {
                        skills.append(value);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>('input[placeholder="Add skill"]');
                    const value = input?.value.trim();
                    if (value && !form.watch("skills")?.includes(value)) {
                      skills.append(value);
                      input!.value = "";
                    }
                  }}
                >
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
              <FormDescription>
                List your skills. Press Enter to add.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

