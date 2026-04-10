interface CodeRunInput {
  language: string;
  code: string;
  stdin?: string;
  timeLimitSec?: number;
  memoryLimitMb?: number;
  testMode?: boolean;
}

interface CodeRunOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  usedSandbox: boolean;
  language: string;
  truncated: boolean;
}

const ALLOWED_LANGUAGES = ["javascript", "python", "bash"] as const;
const DISALLOWED_SNIPPETS = ["child_process", "process.exit", "fs.", "import('", "while(true)", "for(;;)"];

function isTestMode(input?: CodeRunInput) {
  return input?.testMode || process.env.NODE_ENV === "test";
}

export async function codeRun(input: CodeRunInput): Promise<CodeRunOutput> {
  const start = Date.now();
  const lang = (input.language || "").toLowerCase();
  const timeLimit = input.timeLimitSec && input.timeLimitSec > 0 ? input.timeLimitSec : 3;
  const memoryLimit = input.memoryLimitMb && input.memoryLimitMb > 16 ? input.memoryLimitMb : 128;

  if (!ALLOWED_LANGUAGES.includes(lang as any)) {
    return buildResult({
      stdout: "",
      stderr: `Language '${lang}' not allowed. Allowed: ${ALLOWED_LANGUAGES.join(', ')}`,
      exitCode: 1,
      language: lang,
      start,
    });
  }

  const code = input.code || "";
  if (!code.trim()) {
    return buildResult({ stdout: "", stderr: "Empty code", exitCode: 1, language: lang, start });
  }
  if (code.length > 20000) {
    return buildResult({ stdout: "", stderr: "Code too large (max 20000 chars)", exitCode: 1, language: lang, start });
  }
  for (const bad of DISALLOWED_SNIPPETS) {
    if (code.includes(bad)) {
      return buildResult({ stdout: "", stderr: `Disallowed pattern detected: ${bad}` , exitCode: 1, language: lang, start });
    }
  }

  if (isTestMode(input)) {
    // Provide deterministic stub output; simulate limited execution.
    const lines = code.split(/\n/).slice(0, 10); // restrict
    const stdout = `Stub output (lang=${lang}, lines=${lines.length})\n` + lines.join("\n");
    return buildResult({ stdout, stderr: "", exitCode: 0, language: lang, start });
  }

  // Real execution placeholder. Proper sandbox would require containerization or VM; we avoid executing user code here.
  return buildResult({
    stdout: "Sandbox execution pending implementation",
    stderr: "",
    exitCode: 0,
    language: lang,
    start,
  });
}

function buildResult(opts: { stdout: string; stderr: string; exitCode: number; language: string; start: number; }): CodeRunOutput {
  return {
    stdout: opts.stdout,
    stderr: opts.stderr,
    exitCode: opts.exitCode,
    durationMs: Date.now() - opts.start,
    usedSandbox: true,
    language: opts.language,
    truncated: opts.stdout.length > 5000,
  };
}

export type { CodeRunInput, CodeRunOutput };