import { z } from "zod";
import {
	ListCoursesInputSchema,
	ListCoursesOutputSchema,
	CreateCourseInputSchema,
	CreateCourseOutputSchema,
	GetCourseInputSchema,
	GetCourseOutputSchema,
	UpdateCourseInputSchema,
	UpdateCourseOutputSchema,
	DeleteCourseInputSchema,
	DeleteCourseOutputSchema,
	GetCourseChapterInputSchema,
	GetCourseChapterOutputSchema,
	IncrementCourseProgressInputSchema,
	IncrementCourseProgressOutputSchema,
	ListUserCoursesInputSchema,
	ListUserCoursesOutputSchema,
	GenerateCourseInputSchema,
	GenerateCourseOutputSchema
} from "@/services/courses";

export const CourseListInput = ListCoursesInputSchema;
export const CourseListOutput = ListCoursesOutputSchema;
export const CourseCreateInput = CreateCourseInputSchema;
export const CourseCreateOutput = CreateCourseOutputSchema;

// New schemas
export const CourseGetInput = GetCourseInputSchema;
export const CourseGetOutput = GetCourseOutputSchema;
export const CourseUpdateInput = UpdateCourseInputSchema;
export const CourseUpdateOutput = UpdateCourseOutputSchema;
export const CourseDeleteInput = DeleteCourseInputSchema;
export const CourseDeleteOutput = DeleteCourseOutputSchema;
export const CourseChapterGetInput = GetCourseChapterInputSchema;
export const CourseChapterGetOutput = GetCourseChapterOutputSchema;
export const CourseProgressIncrementInput = IncrementCourseProgressInputSchema;
export const CourseProgressIncrementOutput = IncrementCourseProgressOutputSchema;
export const CourseListByUserInput = ListUserCoursesInputSchema;
export const CourseListByUserOutput = ListUserCoursesOutputSchema;
export const CourseGenerateAIInput = GenerateCourseInputSchema;
export const CourseGenerateAIOutput = GenerateCourseOutputSchema;

export type CourseListInputT = z.infer<typeof CourseListInput>;
export type CourseListOutputT = z.infer<typeof CourseListOutput>;
export type CourseCreateInputT = z.infer<typeof CourseCreateInput>;
export type CourseCreateOutputT = z.infer<typeof CourseCreateOutput>;
export type CourseGetInputT = z.infer<typeof CourseGetInput>;
export type CourseGetOutputT = z.infer<typeof CourseGetOutput>;
export type CourseUpdateInputT = z.infer<typeof CourseUpdateInput>;
export type CourseUpdateOutputT = z.infer<typeof CourseUpdateOutput>;
export type CourseDeleteInputT = z.infer<typeof CourseDeleteInput>;
export type CourseDeleteOutputT = z.infer<typeof CourseDeleteOutput>;
export type CourseChapterGetInputT = z.infer<typeof CourseChapterGetInput>;
export type CourseChapterGetOutputT = z.infer<typeof CourseChapterGetOutput>;
export type CourseProgressIncrementInputT = z.infer<typeof CourseProgressIncrementInput>;
export type CourseProgressIncrementOutputT = z.infer<typeof CourseProgressIncrementOutput>;
export type CourseListByUserInputT = z.infer<typeof CourseListByUserInput>;
export type CourseListByUserOutputT = z.infer<typeof CourseListByUserOutput>;
export type CourseGenerateAIInputT = z.infer<typeof CourseGenerateAIInput>;
export type CourseGenerateAIOutputT = z.infer<typeof CourseGenerateAIOutput>;
