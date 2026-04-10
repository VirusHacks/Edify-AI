import { useState, useEffect } from "react"
import YouTube, { type YouTubeProps } from "react-youtube"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { Editor } from "@monaco-editor/react"

// Types
import type { ChapterContentType, ChapterType, CourseType } from "@/types/resume.type"
import { executeCode } from "../_utils/codeExecution"

type ChapterContentProps = {
  course: CourseType
  chapter: ChapterType | null
  content: ChapterContentType | null
  handleNext: () => void
}

const videoOpts = {
  height: "390",
  width: "640",
  playerVars: {
    autoplay: 0,
  },
}

const ChapterContent = ({ course, chapter, content, handleNext }: ChapterContentProps) => {
  const [outputs, setOutputs] = useState<{ [key: string]: string | null }>({})
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({})
  const [editedCode, setEditedCode] = useState<{ [key: string]: string }>({})
  const [initialCodes, setInitialCodes] = useState<{ [key: string]: string }>({})

  // Initialize initial codes when content loads
  useEffect(() => {
    if (content?.content) {
      const codes: { [key: string]: string } = {}
      content.content.forEach((item, contentIndex) => {
        item.code_examples?.forEach((example, exampleIndex) => {
          const exampleId = `${contentIndex}-${exampleIndex}`
          const initialCode = example.code
            ? (Array.isArray(example.code)
              ? example.code.join("\n").replace("<pre><code>", "").replace("</pre></code>", "")
              : (example.code as string).replace("<pre><code>", "").replace("</code></pre>", ""))
            : ""
          codes[exampleId] = initialCode
        })
      })
      setInitialCodes(codes)
    }
  }, [content])

  const onPlayerReady: YouTubeProps["onReady"] = (event) => {
    event.target.pauseVideo()
  }

  const runCode = async (exampleId: string, language: string) => {
    setLoading((prev) => ({ ...prev, [exampleId]: true }))
    setOutputs((prev) => ({ ...prev, [exampleId]: null }))

    const codeToRun = editedCode[exampleId] || initialCodes[exampleId] || ""
    const codeLanguage = language || "python"

    try {
      const result = await executeCode(codeLanguage as keyof typeof import("../_utils/codeExecution").LANGUAGE_VERSIONS, codeToRun)
      setOutputs((prev) => ({
        ...prev,
        [exampleId]: result.run.output || "Code executed successfully, but there was no output.",
      }))
    } catch (error) {
      console.error("Error executing code:", error)
      setOutputs((prev) => ({
        ...prev,
        [exampleId]: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred"}`,
      }))
    } finally {
      setLoading((prev) => ({ ...prev, [exampleId]: false }))
    }
  }

  const handleEditorChange = (value: string | undefined, exampleId: string) => {
    if (value !== undefined) {
      setEditedCode((prev) => ({ ...prev, [exampleId]: value }))
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0A" }}>
      {/* Chapter Header */}
      <div className="sticky top-0 z-10 border-b backdrop-blur-xl" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
        <div className="w-full px-8 py-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#E4E4E7" }}>{chapter?.chapter_name}</h1>
          <p className="text-lg" style={{ color: "#A1A1AA" }}>{chapter?.description}</p>
        </div>
      </div>

      <div className="w-full px-8 py-8">
        {/* Video Section */}
        {content?.videoId && (
          <div className="mb-12">
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#27272A" }}>
              <div className="flex justify-center p-8">
                <YouTube 
                  videoId={content?.videoId} 
                  opts={{
                    ...videoOpts,
                    width: "100%",
                    height: "400",
                  }} 
                  onReady={onPlayerReady} 
                  className="rounded-xl overflow-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-8">
          {content?.content.map((item, contentIndex) => (
            <div key={contentIndex} className="rounded-2xl border overflow-hidden transition-shadow duration-300" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
              <div className="p-8">
                <h2 className="text-2xl font-semibold mb-4" style={{ color: "#E4E4E7" }}>{item.title}</h2>
                <div className="prose prose-invert max-w-none mb-6" style={{ color: "#E4E4E7" }}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p style={{ color: "#E4E4E7", marginBottom: "1rem" }}>{children}</p>,
                      h1: ({ children }) => <h1 style={{ color: "#E4E4E7", marginBottom: "1rem", fontSize: "1.5rem", fontWeight: "bold" }}>{children}</h1>,
                      h2: ({ children }) => <h2 style={{ color: "#E4E4E7", marginBottom: "0.75rem", fontSize: "1.25rem", fontWeight: "semibold" }}>{children}</h2>,
                      h3: ({ children }) => <h3 style={{ color: "#E4E4E7", marginBottom: "0.75rem", fontSize: "1.125rem", fontWeight: "semibold" }}>{children}</h3>,
                      ul: ({ children }) => <ul style={{ color: "#E4E4E7", marginLeft: "1.5rem", marginBottom: "1rem", listStyleType: "disc" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ color: "#E4E4E7", marginLeft: "1.5rem", marginBottom: "1rem", listStyleType: "decimal" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ color: "#E4E4E7", marginBottom: "0.25rem" }}>{children}</li>,
                      strong: ({ children }) => <strong style={{ color: "#E4E4E7", fontWeight: "bold" }}>{children}</strong>,
                      code: ({ children }) => <code style={{ backgroundColor: "#27272A", color: "#E4E4E7", padding: "0.125rem 0.375rem", borderRadius: "0.25rem", fontSize: "0.875rem" }}>{children}</code>,
                      blockquote: ({ children }) => <blockquote style={{ borderLeft: "4px solid #27272A", paddingLeft: "1rem", marginBottom: "1rem", color: "#A1A1AA", fontStyle: "italic" }}>{children}</blockquote>,
                    }}
                  >
                    {item.explanation}
                  </ReactMarkdown>
                </div>
                
                {item.code_examples && item.code_examples.length > 0 && (
                  <div className="space-y-6">
                    {item.code_examples.map((example, exampleIndex) => {
                      const exampleId = `${contentIndex}-${exampleIndex}`
                      const initialCode = initialCodes[exampleId] || ""

                      return (
                        <div key={exampleId} className="rounded-xl p-6 border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: "#E4E4E7" }}>Code Example</h3>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-lg text-sm font-medium" style={{ backgroundColor: "#0A0A0A", color: "#A1A1AA", borderColor: "#27272A", border: "1px solid" }}>
                                {example.language || "python"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="rounded-xl overflow-hidden border mb-4" style={{ borderColor: "#27272A" }}>
                            <Editor
                              height="300px"
                              defaultLanguage={example.language || "python"}
                              value={editedCode[exampleId] || initialCode}
                              onChange={(value) => handleEditorChange(value, exampleId)}
                              options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                theme: "vs-dark",
                                padding: { top: 16, bottom: 16 },
                                lineNumbers: "on",
                                renderLineHighlight: "gutter",
                              }}
                            />
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <Button
                              onClick={() => runCode(exampleId, example.language || "python")}
                              disabled={loading[exampleId]}
                              className="font-semibold px-6 py-2 rounded-xl transition-all duration-200 hover:opacity-90"
                              style={{
                                backgroundColor: "#3B82F6",
                                color: "#FFFFFF"
                              }}
                            >
                              {loading[exampleId] ? (
                                <>
                                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                                  Running...
                                </>
                              ) : (
                                "▶ Run Code"
                              )}
                            </Button>
                          </div>

                          {/* Output Section */}
                          {outputs[exampleId] !== undefined && outputs[exampleId] !== null && (
                            <div className="mt-4 rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#3B82F6" }}></div>
                                <h4 className="text-sm font-semibold" style={{ color: "#E4E4E7" }}>Output</h4>
                              </div>
                              <pre className="text-sm whitespace-pre-wrap overflow-x-auto font-mono" style={{ color: "#E4E4E7" }}>
                                {outputs[exampleId]}
                              </pre>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quiz Button */}
        <div className="mt-12 text-center">
          <Button
            onClick={handleNext}
            size="lg"
            className="font-semibold px-8 py-4 rounded-2xl transition-all duration-200 hover:opacity-90"
            style={{
              backgroundColor: "#3B82F6",
              color: "#FFFFFF"
            }}
          >
            🎯 Take Quiz & Continue
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ChapterContent

