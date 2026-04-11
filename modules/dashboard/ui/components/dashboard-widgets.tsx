"use client";

import { motion } from "framer-motion";
import { CourseWidget } from "./widgets/course-widget";
import { PathwayWidget } from "./widgets/pathway-widget";
import { ResumeWidget } from "./widgets/resume-widget";
import { MeetingWidget } from "./widgets/meeting-widget";
import { AgentWidget } from "./widgets/agent-widget";
import { MockInterviewWidget } from "./widgets/mock-interview-widget";
import { TutorWidget } from "./widgets/tutor-widget";
import { EventsWidget } from "./widgets/events-widget";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export const DashboardWidgets = () => {
  return (
    <motion.div variants={containerVariants}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-[#E4E4E7] mb-2">
          Your Workspace
        </h2>
        <p className="text-base text-[#A1A1AA]">
          Manage all your learning, career, and collaboration tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants}>
          <CourseWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <PathwayWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <ResumeWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MockInterviewWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <MeetingWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AgentWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TutorWidget />
        </motion.div>

        <motion.div variants={itemVariants}>
          <EventsWidget />
        </motion.div>
      </div>
    </motion.div>
  );
};
