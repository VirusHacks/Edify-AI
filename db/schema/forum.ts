import { foreignKey, integer, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { CourseList } from "./chapter";

export const forumReplies = pgTable("forum_replies", {
    id: serial().primaryKey().notNull(),
    topicId: integer("topic_id").notNull(),
    userId: varchar("user_id").notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
    return {
        forumRepliesTopicIdForumTopicsIdFk: foreignKey({
            columns: [table.topicId],
            foreignColumns: [forumTopics.id],
            name: "forum_replies_topic_id_forum_topics_id_fk"
        }),
    }
});

export const forumTopics = pgTable("forum_topics", {
    id: serial().primaryKey().notNull(),
    courseId: integer("course_id").notNull(),
    userId: varchar("user_id").notNull(),
    title: text().notNull(),
    content: text().notNull(),
    createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
    updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
},
(table) => {
    return {
        forumTopicsCourseIdCourseListIdFk: foreignKey({
            columns: [table.courseId],
            foreignColumns: [CourseList.id],
            name: "forum_topics_course_id_courseList_id_fk"
        }),
    }
});

