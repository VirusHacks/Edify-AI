"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Send, 
  Image as ImageIcon, 
  Mic, 
  Settings, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Sparkles,
  Code2,
  ArrowLeft
} from "lucide-react";
import { GenerativeUI } from "./components/GenerativeUI";
import { useRouter } from "next/navigation";

type Msg = { 
  role: "user" | "assistant" | "system"; 
  content: string;
  toolName?: string;
  toolResult?: any;
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me anything. I can list courses, generate pathways, analyze resumes, find events/internships, solve math from images, transcribe audio, and more." },
  ]);
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  // Manual MCP tool mode state
  const [tools, setTools] = useState<{ name: string; description: string }[]>([]);
  const [manualTool, setManualTool] = useState<string>("");
  const [manualInput, setManualInput] = useState<string>("{}");
  const [manualLoading, setManualLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [toolFilter, setToolFilter] = useState("");
  const [lastToolMeta, setLastToolMeta] = useState<{ name: string; durationMs: number; ok: boolean } | null>(null);
  const [manualError, setManualError] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (tools.length === 0) {
      (async () => {
        try {
          const res = await fetch("/api/mcp");
          const data = await res.json();
          if (data?.success) setTools(data.tools || []);
        } catch (e) {
          setManualError("Failed to load tool metadata");
        }
      })();
    }
  }, [tools.length]);

  async function toBase64(file: File) {
    const buf = await file.arrayBuffer();
    const bytes = Buffer.from(buf);
    return bytes.toString("base64");
  }

  const samplePayloads: Record<string, any> = {
    'course.list': { page: 0, limit: 4 },
    'resume.analyze': { jobDescription: 'Looking for JS dev', resumeText: 'I build React + Node projects.' },
    'pathway.create': { career: 'backend engineer', description: 'Node.js fundamentals and databases', userId: 'stub-user' },
    'events.list': {},
    'internships.list': { testMode: true },
  };

  async function invokeManualTool() {
    if (!manualTool) return;
    let parsed: any = {};
    try {
      parsed = manualInput.trim() ? JSON.parse(manualInput) : {};
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: `Manual input JSON parse error: ${e.message}` }]);
      return;
    }
    setManualLoading(true);
    setManualError("");
    // Add a system-style echo of invocation
    setMessages(m => [...m, { role: "user", content: `[manual tool] ${manualTool} → ${manualInput}` }]);
    try {
      const started = performance.now();
      const res = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool: manualTool, input: parsed }),
      });
      const data = await res.json();
      const durationMs = Math.round(performance.now() - started);
      if (data.success) {
        const resultMsg: Msg = {
          role: "assistant",
          content: `Result (${manualTool}): ${truncate(JSON.stringify(data.result), 400)}`,
          toolName: manualTool,
          toolResult: data.result
        };
        setMessages(m => [...m, resultMsg]);
        setLastToolMeta({ name: manualTool, durationMs, ok: true });
      } else {
        setMessages(m => [...m, { role: "assistant", content: `Error (${manualTool}): ${data.error}` }]);
        setLastToolMeta({ name: manualTool, durationMs, ok: false });
        setManualError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setMessages(m => [...m, { role: "assistant", content: `Network error (${manualTool}): ${err.message || err}` }]);
      setManualError(err.message || String(err));
    } finally {
      setManualLoading(false);
    }
  }

  function truncate(str: string, max: number) {
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input && !imageFile && !audioFile) return;

    const userMsg: Msg = { role: "user", content: input || (imageFile ? "[image]" : "[audio]") };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const attachments: any[] = [];
      if (imageFile) attachments.push({ type: "image", base64: await toBase64(imageFile), mimeType: imageFile.type });
      if (audioFile) attachments.push({ type: "audio", base64: await toBase64(audioFile), mimeType: audioFile.type });

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], attachments }),
      });
      const data = await res.json();

      if (data?.success) {
        const reply = (data.messages?.[0]?.content as string) ?? "Done.";
        const assistantMsg: Msg = { 
          role: "assistant", 
          content: reply,
          toolName: data.toolCall?.name,
          toolResult: data.toolResult
        };
        setMessages((m) => [...m, assistantMsg]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${data?.error || "Unknown"}` }]);
      }
    } catch (err: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${err?.message || err}` }]);
    } finally {
      setLoading(false);
      setImageFile(null);
      setAudioFile(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7]">
      <div className="mx-auto max-w-screen-xl p-3 sm:p-4 md:p-6">
        {/* Mobile Back Button */}
        <div className="md:hidden mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="rounded-xl transition-all duration-200 hover:opacity-90"
            style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 space-y-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#8B5CF6] flex-shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight truncate">Edify AI Chat</h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] hidden sm:block">Intelligent assistant powered by MCP tools</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-3 sm:space-y-4 md:space-y-6">
          <TabsList className="bg-[#18181B] border border-[#27272A] w-full sm:w-auto">
            <TabsTrigger value="chat" className="data-[state=active]:bg-[#27272A] text-xs sm:text-sm flex-1 sm:flex-initial">
              <Sparkles className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-[#27272A] text-xs sm:text-sm flex-1 sm:flex-initial">
              <Code2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Manual Tools</span>
              <span className="sm:hidden">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-3 sm:space-y-4">
            <Card className="border-[#27272A] bg-[#0A0A0A]">
              <ScrollArea className="h-[calc(100vh-16rem)] sm:h-[calc(100vh-18rem)] md:h-[calc(100vh-20rem)] p-3 sm:p-4 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {messages.map((m, i) => (
                    <div
                      key={i}
                      className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[80%] rounded-xl sm:rounded-2xl p-3 sm:p-4 ${
                          m.role === "user"
                            ? "bg-[#3B82F6] text-white"
                            : "border border-[#27272A] bg-[#18181B]"
                        }`}
                      >
                        <div className="mb-1.5 sm:mb-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <Badge
                            variant={m.role === "assistant" ? "secondary" : "default"}
                            className="text-[10px] sm:text-xs"
                          >
                            {m.role}
                          </Badge>
                          {m.content.startsWith("Result (") && (
                            <Badge variant="outline" className="text-[10px] sm:text-xs">
                              <CheckCircle2 className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              <span className="hidden sm:inline">Tool Result</span>
                              <span className="sm:hidden">Result</span>
                            </Badge>
                          )}
                          {m.content.startsWith("Error (") && (
                            <Badge variant="destructive" className="text-[10px] sm:text-xs">
                              <XCircle className="mr-0.5 sm:mr-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              Error
                            </Badge>
                          )}
                        </div>
                        {m.toolResult ? (
                          <GenerativeUI toolName={m.toolName!} result={m.toolResult} />
                        ) : m.content.startsWith("Result (") || m.content.startsWith("Error (") ? (
                          <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="details" className="border-none">
                              <AccordionTrigger className="py-2 text-sm hover:no-underline">
                                View Details
                              </AccordionTrigger>
                              <AccordionContent>
                                <pre className="mt-2 overflow-x-auto rounded-lg bg-[#0A0A0A] p-3 text-xs text-[#10B981]">
                                  {m.content
                                    .replace(/^Result \([^)]+\): /, "")
                                    .replace(/^Error \([^)]+\): /, "")}
                                </pre>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        ) : (
                          <p className="text-xs sm:text-sm leading-relaxed break-words">{m.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#A1A1AA]">
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                      Thinking...
                    </div>
                  )}
                  <div ref={endRef} />
                </div>
              </ScrollArea>
            </Card>

            {/* Input Area */}
            <Card className="border-[#27272A] bg-[#0A0A0A]">
              <CardContent className="p-3 sm:p-4">
                <form onSubmit={onSend} className="space-y-3 sm:space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ask me anything..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 border-[#27272A] bg-[#18181B] text-[#E4E4E7] placeholder:text-[#A1A1AA] focus-visible:ring-[#3B82F6] text-sm sm:text-base h-10 sm:h-11"
                    />
                    <Button
                      type="submit"
                      disabled={loading || (!input && !imageFile && !audioFile)}
                      className="bg-[#3B82F6] hover:bg-[#2563EB] flex-shrink-0 h-10 sm:h-11 px-3 sm:px-4"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-wrap">
                    <Label
                      htmlFor="image-upload"
                      className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg border border-[#27272A] bg-[#18181B] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-[#27272A] flex-1 sm:flex-initial min-w-0"
                    >
                      <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">{imageFile ? imageFile.name : "Upload Image"}</span>
                      <span className="truncate sm:hidden">{imageFile ? "Image" : "Image"}</span>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </Label>

                    <Label
                      htmlFor="audio-upload"
                      className="flex cursor-pointer items-center gap-1.5 sm:gap-2 rounded-lg border border-[#27272A] bg-[#18181B] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-[#27272A] flex-1 sm:flex-initial min-w-0"
                    >
                      <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">{audioFile ? audioFile.name : "Upload Audio"}</span>
                      <span className="truncate sm:hidden">{audioFile ? "Audio" : "Audio"}</span>
                      <input
                        id="audio-upload"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </Label>

                    {(imageFile || audioFile) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageFile(null);
                          setAudioFile(null);
                        }}
                        className="text-[#A1A1AA] hover:text-[#E4E4E7] text-xs sm:text-sm flex-shrink-0"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <p className="text-[10px] sm:text-xs text-[#A1A1AA] leading-relaxed">
                    💡 Tip: Upload images for math problems or audio for transcription. The AI agent automatically selects the right tool.
                  </p>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Tools Tab */}
          <TabsContent value="tools" className="space-y-3 sm:space-y-4">
            <Card className="border-[#27272A] bg-[#0A0A0A]">
              <CardHeader className="p-3 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
                  Manual MCP Tool Invocation
                </CardTitle>
                <CardDescription className="text-[#A1A1AA] text-xs sm:text-sm mt-1 sm:mt-2">
                  Directly invoke MCP tools by selecting from the registry and providing JSON input.
                  Fields are enforced by server-side Zod schemas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-6">
                {/* Sample Payloads */}
                <div>
                  <Label className="mb-1.5 sm:mb-2 text-xs sm:text-sm font-medium">Quick Start Templates</Label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {Object.entries(samplePayloads).map(([toolName, payload]) => (
                      <Button
                        key={toolName}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setManualTool(toolName);
                          setManualInput(JSON.stringify(payload, null, 2));
                        }}
                        className="border-[#27272A] hover:bg-[#27272A] text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                      >
                        {toolName}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-[#27272A]" />

                {/* Tool Selection */}
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="tool-filter" className="text-xs sm:text-sm">Filter Tools</Label>
                    <Input
                      id="tool-filter"
                      placeholder="Search tools..."
                      value={toolFilter}
                      onChange={(e) => setToolFilter(e.target.value)}
                      className="border-[#27272A] bg-[#18181B] focus-visible:ring-[#3B82F6] text-sm sm:text-base h-9 sm:h-10"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="tool-select" className="text-xs sm:text-sm">Select Tool</Label>
                    <select
                      id="tool-select"
                      value={manualTool}
                      onChange={(e) => setManualTool(e.target.value)}
                      className="flex h-9 sm:h-10 w-full rounded-lg border border-[#27272A] bg-[#18181B] px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[#E4E4E7] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
                    >
                      <option value="">Choose a tool...</option>
                      {tools
                        .filter(
                          (t) =>
                            !toolFilter ||
                            t.name.includes(toolFilter) ||
                            t.description.toLowerCase().includes(toolFilter.toLowerCase())
                        )
                        .map((t) => (
                          <option key={t.name} value={t.name}>
                            {t.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {manualTool && (
                  <div className="rounded-lg border border-[#27272A] bg-[#18181B] p-2.5 sm:p-3">
                    <p className="text-xs sm:text-sm text-[#A1A1AA] leading-relaxed">
                      {tools.find((t) => t.name === manualTool)?.description ||
                        "Tool description unavailable."}
                    </p>
                  </div>
                )}

                {/* JSON Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="json-input" className="text-xs sm:text-sm">Input Parameters (JSON)</Label>
                  <Textarea
                    id="json-input"
                    rows={6}
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder='{"page": 0, "limit": 5}'
                    className="border-[#27272A] bg-[#18181B] font-mono text-xs sm:text-sm focus-visible:ring-[#3B82F6] sm:rows-8"
                  />
                </div>

                {/* Invoke Button */}
                <Button
                  type="button"
                  disabled={!manualTool || manualLoading}
                  onClick={invokeManualTool}
                  className="w-full bg-[#3B82F6] hover:bg-[#2563EB] h-10 sm:h-11 text-sm sm:text-base"
                >
                  {manualLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Invoking...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Invoke Tool
                    </>
                  )}
                </Button>

                {/* Status Display */}
                {lastToolMeta && !manualLoading && (
                  <div
                    className={`flex items-center justify-between rounded-lg border p-2.5 sm:p-3 ${
                      lastToolMeta.ok
                        ? "border-green-500/20 bg-green-500/10 text-green-400"
                        : "border-red-500/20 bg-red-500/10 text-red-400"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                      {lastToolMeta.ok ? (
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                      )}
                      <span className="text-xs sm:text-sm font-medium truncate">{lastToolMeta.name}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs flex-shrink-0 ml-2">
                      {lastToolMeta.durationMs}ms • {lastToolMeta.ok ? "Success" : "Failed"}
                    </span>
                  </div>
                )}

                {manualError && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 sm:p-3 text-xs sm:text-sm text-red-400 break-words">
                    {manualError}
                  </div>
                )}

                {showManual && tools.length === 0 && !manualLoading && !manualError && (
                  <div className="text-center text-sm text-[#A1A1AA]">
                    Loading tool metadata...
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
