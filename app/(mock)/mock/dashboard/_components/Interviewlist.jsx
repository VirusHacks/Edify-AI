"use client"
import {
  LogoutLink,
  useKindeBrowserClient,
} from "@kinde-oss/kinde-auth-nextjs";
import React, { useEffect, useState } from 'react'
import InterviewItemCard from './InterviewItemCard';
import { MessageSquare } from 'lucide-react';

function Interviewlist() {
  const { user } = useKindeBrowserClient();
  const [interviewList, setInterviewList] = useState([])
  useEffect(() => {
    GetInterviewList()
  }, [user])
  const GetInterviewList = async () => {
    try {
      const resp = await fetch(`/api/mock-interview?email=${encodeURIComponent(user?.email || '')}`)
      const json = await resp.json()
      if (json?.success) {
        setInterviewList(json.data || [])
      } else {
        setInterviewList([])
      }
    } catch (e) {
      setInterviewList([])
    }
  }
  return (
    <div className="space-y-6">
      {interviewList.length === 0 ? (
        <div className="text-center py-16 px-6 rounded-2xl border-2 border-dashed" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
          <div className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#27272A" }}>
            <MessageSquare className="w-8 h-8" style={{ color: "#A1A1AA" }} />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "#E4E4E7" }}>No interviews yet</h3>
          <p style={{ color: "#A1A1AA" }}>Start your first mock interview to begin practicing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {interviewList.map((interview, index) => (
            <InterviewItemCard key={index} interviewInfo={interview} />
          ))}
        </div>
      )}
    </div>
  )
}

export default Interviewlist