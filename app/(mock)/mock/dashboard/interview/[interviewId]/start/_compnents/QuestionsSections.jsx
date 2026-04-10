import { Lightbulb, Volume2 } from 'lucide-react'
import React, { useEffect } from 'react'

function QuestionsSections({activeQuestionIndex, mockInterViewQuestion}) {
    
   const textToSpeach=(text)=>{
    if('speechSynthesis' in window){
      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();
      const speech= new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(speech)
    }else{
      alert('Sorry, Your browser does not support text to speech (recommended browser Chrome)')
    }
   }

   // Cleanup speech synthesis on unmount
   useEffect(() => {
     return () => {
       if (window.speechSynthesis) {
         window.speechSynthesis.cancel();
       }
     };
   }, []);

  const questions = Array.isArray(mockInterViewQuestion) ? mockInterViewQuestion : [];

  // Don't render if data isn't ready
  if (!questions.length) {
    return (
      <div className='p-5 border rounded-lg my-10'>
        <div className='text-center'>Loading questions...</div>
      </div>
    );
  }

  // Safety check for activeQuestionIndex
  const currentQuestion = questions[activeQuestionIndex];
  if (!currentQuestion) {
    return (
      <div className='p-5 border rounded-lg my-10'>
        <div className='text-center'>Invalid question index</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border shadow-sm p-6" style={{ backgroundColor: "#0A0A0A", borderColor: "#27272A" }}>
      {/* Question Navigation */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: "#E4E4E7" }}>Questions</h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {questions.map((question, index) => (
            <div
              key={index + 1}
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                activeQuestionIndex === index
                  ? 'shadow-lg'
                  : ''
              }`}
              style={
                activeQuestionIndex === index
                  ? { backgroundColor: "#3B82F6", color: "#FFFFFF" }
                  : { backgroundColor: "#27272A", color: "#A1A1AA" }
              }
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-semibold leading-relaxed flex-1" style={{ color: "#E4E4E7" }}>
            <span style={{ color: "#3B82F6" }}>Q{activeQuestionIndex + 1}.</span> {currentQuestion.question}
          </h2>
          <button
            onClick={() => textToSpeach(currentQuestion.question)}
            className="ml-4 p-2 rounded-lg transition-colors"
            style={{ color: "#A1A1AA", backgroundColor: "#27272A" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "#3B82F6"; e.currentTarget.style.backgroundColor = "#27272A"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "#A1A1AA"; e.currentTarget.style.backgroundColor = "#27272A"; }}
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tips Section */}
      <div className="rounded-xl p-4 border" style={{ backgroundColor: "#27272A", borderColor: "#27272A" }}>
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center mt-0.5" style={{ backgroundColor: "#3B82F6" }}>
            <Lightbulb className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-1" style={{ color: "#E4E4E7" }}>Interview Tips</h4>
            <p className="text-sm leading-relaxed" style={{ color: "#A1A1AA" }}>
              {process.env.NEXT_PUBLIC_QUESTION_NOTE || "Take your time to think through your answer. Speak clearly and provide specific examples when possible."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuestionsSections