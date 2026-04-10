"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import io from "socket.io-client"
import { motion, AnimatePresence } from "framer-motion"
import { PlusCircle, Send, ArrowLeft, Menu, X } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

type Topic = {
  id: number
  title: string
  content: string
  userId: string
  courseId: number
  createdAt: Date | null
  updatedAt?: Date | null
}

type Reply = {
  id: number
  topicId: number
  userId: string
  content: string
  createdAt: Date | null
  updatedAt?: Date | null
}

export default function Forum() {
  const params = useParams()
  const courseId = params?.courseId as string
  const { user } = useKindeBrowserClient()
  const [topics, setTopics] = useState<Topic[]>([])
  const [newTopic, setNewTopic] = useState({ title: "", content: "" })
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [newReply, setNewReply] = useState("")
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { toast } = useToast()
  const socketRef = useRef<ReturnType<typeof io>>()
  const replyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (courseId) {
      fetchTopics()
      socketInitializer()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId])

  const socketInitializer = async () => {
    await fetch("/api/socket")
    socketRef.current = io()

    socketRef.current.on("receive-message", (message: Reply) => {
      setReplies((prevReplies) => [...prevReplies, message])
    })
  }

  const fetchTopics = async () => {
    try {
      const resp = await fetch(`/api/forum/topics?courseId=${encodeURIComponent(courseId)}`)
      const json = await resp.json()
      if (json?.success) setTopics(json.data as Topic[])
    } catch (e) {
      console.error('Error fetching topics', e)
    }
  }

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({ title: "Please log in to create a topic", variant: "destructive" })
      return
    }
    try {
      const resp = await fetch('/api/forum/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: Number(courseId), userId: user?.given_name ?? user?.email ?? 'anonymous', title: newTopic.title, content: newTopic.content })
      })
      const json = await resp.json()
      if (json?.success) {
        setNewTopic({ title: "", content: "" })
        setIsCreatingTopic(false)
        fetchTopics()
        toast({ title: "Topic created successfully" })
      }
    } catch (e) {
      console.error('Error creating topic', e)
    }
  }

  const handleViewReplies = async (topic: Topic) => {
    setSelectedTopic(topic)
    setIsMobileMenuOpen(false) // Close mobile menu when topic is selected
    try {
      const resp = await fetch(`/api/forum/replies?topicId=${topic.id}`)
      const json = await resp.json()
      if (json?.success) setReplies(json.data as Reply[])
      socketRef.current?.emit("join-room", topic.id)
    } catch (e) {
      console.error('Error fetching replies', e)
    }
  }

  const handleSendReply = async () => {
    if (!user || !selectedTopic) {
      toast({ title: "Please log in to reply", variant: "destructive" })
      return
    }
    const reply = {
      topicId: selectedTopic.id,
      userId: user?.given_name ?? user?.email ?? 'anonymous',
      content: newReply,
      createdAt: new Date(),
    }
    try {
      const resp = await fetch('/api/forum/replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic.id, userId: user?.given_name ?? user?.email ?? 'anonymous', content: newReply, createdAt: new Date() })
      })
      const json = await resp.json()
      if (json?.success) {
        socketRef.current?.emit("send-message", { ...reply, roomId: selectedTopic.id })
        setNewReply("")
        setReplies([...replies, reply as Reply])
      }
    } catch (e) {
      console.error('Error sending reply', e)
    }
  }

  const TopicsPanel = () => (
    <>
      <AnimatePresence>
        {isCreatingTopic && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-4 sm:mb-6 bg-transparent rounded-xl sm:rounded-2xl border border-[#27272A] p-4 sm:p-6 shadow-sm"
          >
            <h3 className="text-base sm:text-lg font-semibold text-[#E4E4E7] mb-3 sm:mb-4">Create New Topic</h3>
            <form onSubmit={handleCreateTopic} className="space-y-3 sm:space-y-4">
              <Input
                placeholder="What's your topic about?"
                value={newTopic.title}
                onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                required
                className="border-[#27272A] rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-transparent text-[#E4E4E7] placeholder-[#A1A1AA] text-sm sm:text-base h-10 sm:h-11"
              />
              <Textarea
                placeholder="Share your thoughts or ask a question..."
                value={newTopic.content}
                onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                required
                rows={4}
                className="border-[#27272A] rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6] resize-none bg-transparent text-[#E4E4E7] placeholder-[#A1A1AA] text-sm sm:text-base"
              />
              <div className="flex justify-end gap-2 sm:gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsCreatingTopic(false)}
                  className="rounded-xl text-[#A1A1AA] text-sm sm:text-base"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white rounded-xl px-4 sm:px-6 text-sm sm:text-base"
                >
                  Create Topic
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2 sm:space-y-3">
        {topics.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-transparent border border-[#27272A] rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-[#E4E4E7] mb-1 sm:mb-2">No discussions yet</h3>
            <p className="text-[#A1A1AA] text-xs sm:text-sm">Start the conversation by creating the first topic</p>
          </div>
        ) : (
          topics.map((topic) => (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => handleViewReplies(topic)}
                className={`w-full p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-200 text-left group ${
                  selectedTopic?.id === topic.id
                    ? "bg-[#071033] border-[#3B82F6] shadow-md"
                    : "bg-transparent border-[#27272A] hover:bg-[#071019] hover:border-[#3B82F6] hover:shadow-sm"
                }`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-transparent shadow-sm flex-shrink-0">
                    <AvatarFallback className={`text-xs sm:text-sm font-semibold ${
                      selectedTopic?.id === topic.id 
                        ? "bg-[#3B82F6] text-white" 
                        : "bg-[#1f1f1f] text-[#A1A1AA]"
                    }`}>
                      {topic.title[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-[#E4E4E7] truncate group-hover:text-[#E4E4E7] transition-colors">
                      {topic.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#A1A1AA] line-clamp-2 mt-1">
                      {topic.content}
                    </p>
                    <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2">
                      <span className="text-[10px] sm:text-xs text-[#A1A1AA]">by {topic.userId}</span>
                      <span className="w-0.5 h-0.5 sm:w-1 sm:h-1 bg-[#27272A] rounded-full" />
                      <span className="text-[10px] sm:text-xs text-[#A1A1AA]">
                        {new Date(topic.createdAt ?? Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            </motion.div>
          ))
        )}
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E4E4E7]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-transparent backdrop-blur-sm border-b border-[#27272A]">
        <div className="w-full max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#E4E4E7] truncate">Course Discussion</h1>
              <p className="text-xs sm:text-sm text-[#A1A1AA] hidden sm:block">Connect with fellow learners</p>
            </div>
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl transition-all duration-200 hover:opacity-90 flex-shrink-0"
                  style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
                >
                  <Menu className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] sm:w-[350px] overflow-y-auto p-0"
                style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}
              >
                <SheetHeader className="p-4 border-b" style={{ borderColor: "#27272A" }}>
                  <SheetTitle className="text-left text-base sm:text-lg" style={{ color: "#E4E4E7" }}>Discussion Topics</SheetTitle>
                </SheetHeader>
                <div className="p-4">
                  <TopicsPanel />
                </div>
              </SheetContent>
            </Sheet>
            <Button
              onClick={() => setIsCreatingTopic(true)}
              className="hidden md:flex bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] hover:from-[#2563EB] hover:to-[#3B82F6] text-white rounded-xl px-4 sm:px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            >
              <PlusCircle className="w-4 h-4 mr-2" />
              New Topic
            </Button>
            {/* Mobile New Topic Button */}
            <Button
              onClick={() => setIsCreatingTopic(true)}
              className="md:hidden bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] hover:from-[#2563EB] hover:to-[#3B82F6] text-white rounded-xl px-3 py-1.5 shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto flex-grow flex overflow-hidden">
        {/* Left Panel - Topics (Desktop) */}
        <div className="hidden md:flex w-96 flex-col bg-transparent border-r border-[#27272A]">
          <ScrollArea className="flex-grow">
            <div className="p-4">
              <TopicsPanel />
            </div>
          </ScrollArea>
        </div>

        {/* Right Panel - Messages */}
        <div className="flex-1 flex flex-col min-w-0">
          {selectedTopic ? (
            <>
              {/* Topic Header */}
              <div className="bg-transparent border-b border-[#27272A] p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTopic(null)}
                    className="md:hidden rounded-xl transition-all duration-200 hover:opacity-90 flex-shrink-0"
                    style={{ borderColor: "#27272A", backgroundColor: "#27272A", color: "#E4E4E7" }}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-0 shadow-none flex-shrink-0">
                    <AvatarFallback className="bg-[#3B82F6] text-white text-base sm:text-lg font-semibold">
                      {selectedTopic.title[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold text-[#E4E4E7] truncate">{selectedTopic.title}</h2>
                    <p className="text-xs sm:text-sm text-[#A1A1AA]">
                      {replies.length} {replies.length === 1 ? 'reply' : 'replies'} • Started by {selectedTopic.userId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-grow">
                <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-5 md:space-y-6 w-full">
                  {/* Original Topic */}
                  <div className="bg-[#071019] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-[#27272A]">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-0 shadow-none flex-shrink-0">
                        <AvatarFallback className="bg-[#3B82F6] text-white text-xs sm:text-sm font-semibold">
                          {selectedTopic.userId[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base text-[#E4E4E7]">{selectedTopic.userId}</span>
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-transparent text-[#3B82F6] text-[10px] sm:text-xs font-medium rounded-full border border-[#27272A]">
                            Topic Starter
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm md:text-base text-[#A1A1AA] leading-relaxed">{selectedTopic.content}</p>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.map((reply, index) => (
                    <motion.div
                      key={reply.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="bg-transparent rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-[#27272A] shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex items-start gap-3 sm:gap-4">
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-0 shadow-none flex-shrink-0">
                          <AvatarFallback className="bg-[#1f1f1f] text-[#A1A1AA] text-xs sm:text-sm font-semibold">
                            {reply.userId[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                            <span className="font-semibold text-sm sm:text-base text-[#E4E4E7]">{reply.userId}</span>
                            <span className="text-[10px] sm:text-xs text-[#A1A1AA]">
                              {new Date(reply.createdAt ?? Date.now()).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm md:text-base text-[#A1A1AA] leading-relaxed">{reply.content}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="bg-transparent border-t border-[#27272A] p-3 sm:p-4 md:p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendReply()
                  }}
                  className="w-full"
                >
                  <div className="flex items-end gap-2 sm:gap-3 md:gap-4">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-white shadow-sm flex-shrink-0 hidden sm:block">
                      <AvatarFallback className="bg-slate-100 text-slate-600 text-xs sm:text-sm font-semibold">
                        {user?.given_name?.[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder="Share your thoughts..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        ref={replyInputRef}
                        className="border-[#27272A] rounded-xl focus:ring-[#3B82F6] focus:border-[#3B82F6] bg-transparent text-[#E4E4E7] placeholder-[#A1A1AA] text-sm sm:text-base h-10 sm:h-11"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={!newReply.trim()}
                      className="bg-gradient-to-r from-[#3B82F6] to-[#60A5FA] text-white rounded-xl px-3 sm:px-4 md:px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:scale-100 flex-shrink-0"
                    >
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Reply</span>
                    </Button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center p-4">
              <div className="text-center max-w-md w-full">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-transparent border border-[#27272A] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-[#E4E4E7] mb-1.5 sm:mb-2">Select a Topic</h3>
                <p className="text-xs sm:text-sm md:text-base text-[#A1A1AA] px-2">Choose a discussion topic from the sidebar to join the conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

