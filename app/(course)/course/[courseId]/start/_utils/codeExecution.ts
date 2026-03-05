import axios from "axios";

export const LANGUAGE_VERSIONS = {
  python: "3.10.0",
  javascript: "18.15.0",
  // Add more languages and their versions as needed
} as const;

const API = axios.create({
  baseURL: "https://emkc.org/api/v2/piston",
});

export const executeCode = async (
  language: keyof typeof LANGUAGE_VERSIONS,
  sourceCode: string
) => {
  const response = await API.post("/execute", {
    language: language,
    version: LANGUAGE_VERSIONS[language],
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};

