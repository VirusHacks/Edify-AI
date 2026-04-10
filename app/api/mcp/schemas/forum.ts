import {
  ListTopicsInputSchema,
  ListTopicsOutputSchema,
  CreateTopicInputSchema,
  CreateTopicOutputSchema,
  ListRepliesInputSchema,
  ListRepliesOutputSchema,
  CreateReplyInputSchema,
  CreateReplyOutputSchema,
} from "@/services/forum";

export const ForumTopicListInput = ListTopicsInputSchema;
export const ForumTopicListOutput = ListTopicsOutputSchema;
export const ForumTopicCreateInput = CreateTopicInputSchema;
export const ForumTopicCreateOutput = CreateTopicOutputSchema;
export const ForumReplyListInput = ListRepliesInputSchema;
export const ForumReplyListOutput = ListRepliesOutputSchema;
export const ForumReplyCreateInput = CreateReplyInputSchema;
export const ForumReplyCreateOutput = CreateReplyOutputSchema;
