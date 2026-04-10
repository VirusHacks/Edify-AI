import { db } from "@/configs/db";
import { documentTable } from "@/db/schema/document";
import { z } from "zod";
import { eq, ne, and, desc } from "drizzle-orm";

// Input schema for listing documents
export const ListDocumentsInputSchema = z.object({
  userId: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(20),
});
export type ListDocumentsInput = z.infer<typeof ListDocumentsInputSchema>;

// Document summary for list output
export const DocumentSummarySchema = z.object({
  id: z.number(),
  documentId: z.string(),
  title: z.string(),
  status: z.enum(["archived", "private", "public"]),
  themeColor: z.string(),
  thumbnail: z.string().nullable().optional(),
  authorName: z.string(),
  authorEmail: z.string(),
  createdAt: z.any(),
  updatedAt: z.any(),
  url: z.string(), // Generated redirect URL
});

export const ListDocumentsOutputSchema = z.object({
  data: z.array(DocumentSummarySchema),
});
export type ListDocumentsOutput = z.infer<typeof ListDocumentsOutputSchema>;

/**
 * List resume documents for a user
 */
export async function listDocuments(input: ListDocumentsInput): Promise<ListDocumentsOutput> {
  const { userId, limit } = ListDocumentsInputSchema.parse(input);

  const documents = await db
    .select({
      id: documentTable.id,
      documentId: documentTable.documentId,
      title: documentTable.title,
      status: documentTable.status,
      themeColor: documentTable.themeColor,
      thumbnail: documentTable.thumbnail,
      authorName: documentTable.authorName,
      authorEmail: documentTable.authorEmail,
      createdAt: documentTable.createdAt,
      updatedAt: documentTable.updatedAt,
    })
    .from(documentTable)
    .where(
      and(
        eq(documentTable.userId, userId),
        ne(documentTable.status, "archived")
      )
    )
    .orderBy(desc(documentTable.updatedAt))
    .limit(limit);

  // Add URL to each document
  const documentsWithUrl = documents.map((doc: typeof documents[number]) => ({
    ...doc,
    url: `/dashboard/document/${doc.documentId}/edit`,
  }));

  return { data: documentsWithUrl };
}
