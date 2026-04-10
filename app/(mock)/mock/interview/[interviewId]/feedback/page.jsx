"use client";
import React, { useEffect, useState } from "react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
  } from "@/components/ui/collapsible"
import { ChevronsUpDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
  

function Feedback({ params }) {
  const [feedbackList, setFeedbackList] = useState([]);
  const [avgRating,setAvgRating]=useState()
  const router=useRouter()
  useEffect(() => {
    GetFeedBack();
  }, []);
  const GetFeedBack = async () => {
    try {
      const response = await fetch(`/api/mock-interview/${params.interviewId}/feedback`);
      const result = await response.json();

      if (result.success && result.data) {
        setFeedbackList(result.data);
        let getTotalOfRating = result.data.reduce((sum, item) => sum + Number(item.rating), 0)
        setAvgRating(Math.round(getTotalOfRating / result.data?.length))
      } else {
        console.error("Failed to fetch feedback:", result.error);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    }
  };
  return (
    <div className="p-10">
     
      {
        feedbackList?.length==0? <h2 className="font-bold text-xl text-gray-500">No Interview Feedback Record Found</h2> :
        <>
         <h2 className="text-3xl font-bold text-green-500">Congratulation!</h2>
         <h2 className="font-bold text-2xl">Here is your interview feedback</h2>
        <h2 className="text-primary text-lg my-3">
        Your overall interview rating <strong  className={avgRating<6?'text-red-600':'text-green-500'} >{avgRating}/10</strong>
      </h2>

      <h2 className="text-sm text-gray-200">
        Find blow interview question with correct answer, Your answer and
        feedback for improvement{" "}
        
        </h2>
      {feedbackList&&feedbackList.map((item,index)=>(
        <Collapsible key={index} className="mt-7">
        <CollapsibleTrigger className="p-2 bg-secondary rounded-lg my-2 text-left flex items-center justify-between gap-7 w-full">{item.question} <ChevronsUpDownIcon className="h-5 w-5"/></CollapsibleTrigger>
        <CollapsibleContent>
          <div className="flex flex-col g-2">
            <h2 className="text-red-600 p-2 rounded-lg"><strong>Rating:</strong> {item.rating}</h2>
            <h2 className="p-2 border rounded-lg bg-red-50 text-sm text-red-900 "><strong>Your Answer: </strong> {item.userAns} </h2>
            <h2 className="p-2 border rounded-lg bg-green-50 text-sm text-green-900 mt-2"><strong>Correct Answer: </strong> {item.correctAns} </h2>
            <h2 className="p-2 border rounded-lg bg-blue-50 text-sm text-primary mt-2"><strong>Feedback: </strong> {item.feedback} </h2>
          </div>
        </CollapsibleContent>
      </Collapsible>
      

      ))}
        </>
      }
      
      <Button onClick={()=>router.replace('/dashboard')}>Go Home</Button>
    </div>
  );
}

export default Feedback;
