"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Types for face analysis metrics
export interface FaceMetrics {
  expressions: {
    neutral: number;
    happy: number;
    sad: number;
    angry: number;
    fearful: number;
    disgusted: number;
    surprised: number;
  };
  eyeContact: boolean;
  headPose: {
    pitch: number; // up/down
    yaw: number;   // left/right
    roll: number;  // tilt
  };
  confidence: number;
  timestamp: number;
}

export interface AggregatedMetrics {
  avgExpressions: FaceMetrics["expressions"];
  eyeContactPercentage: number;
  avgConfidence: number;
  dominantExpression: string;
  engagementScore: number;
  totalFramesAnalyzed: number;
  headMovementScore: number;
}

interface UseFaceAnalysisOptions {
  analysisInterval?: number; // ms between analyses
  onMetricsUpdate?: (metrics: FaceMetrics) => void;
}

export function useFaceAnalysis(options: UseFaceAnalysisOptions = {}) {
  const { analysisInterval = 500, onMetricsUpdate } = options;
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<FaceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const metricsHistoryRef = useRef<FaceMetrics[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);

  // Load face-api.js models
  const loadModels = useCallback(async () => {
    if (typeof window === "undefined") return;
    
    try {
      setError(null);
      
      // Dynamically import face-api.js
      const faceapi = await import("face-api.js");
      faceapiRef.current = faceapi;
      
      // Load models from CDN (more reliable than local)
      const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
      
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      ]);
      
      setIsModelLoaded(true);
      console.log("Face-api.js models loaded successfully");
    } catch (err) {
      console.error("Error loading face-api.js models:", err);
      setError("Failed to load face analysis models");
      setIsModelLoaded(false);
    }
  }, []);

  // Calculate eye contact from landmarks
  const calculateEyeContact = useCallback((landmarks: any): boolean => {
    if (!landmarks) return false;
    
    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      
      if (!leftEye || !rightEye || !nose) return false;
      
      // Get eye centers
      const leftEyeCenter = {
        x: leftEye.reduce((sum: number, p: any) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum: number, p: any) => sum + p.y, 0) / leftEye.length,
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum: number, p: any) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum: number, p: any) => sum + p.y, 0) / rightEye.length,
      };
      
      // Calculate if eyes are relatively centered (looking at camera)
      const eyeMidpoint = {
        x: (leftEyeCenter.x + rightEyeCenter.x) / 2,
        y: (leftEyeCenter.y + rightEyeCenter.y) / 2,
      };
      
      const noseTip = nose[nose.length - 1];
      
      // If nose is roughly below eye midpoint, person is likely looking at camera
      const horizontalDeviation = Math.abs(eyeMidpoint.x - noseTip.x);
      const eyeDistance = Math.abs(leftEyeCenter.x - rightEyeCenter.x);
      
      // Eye contact if horizontal deviation is within 30% of eye distance
      return horizontalDeviation < eyeDistance * 0.3;
    } catch {
      return false;
    }
  }, []);

  // Calculate head pose from landmarks
  const calculateHeadPose = useCallback((landmarks: any): FaceMetrics["headPose"] => {
    if (!landmarks) return { pitch: 0, yaw: 0, roll: 0 };
    
    try {
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const nose = landmarks.getNose();
      const jaw = landmarks.getJawOutline();
      
      if (!leftEye || !rightEye || !nose || !jaw) {
        return { pitch: 0, yaw: 0, roll: 0 };
      }
      
      // Calculate roll (head tilt) from eye positions
      const leftEyeCenter = {
        x: leftEye.reduce((sum: number, p: any) => sum + p.x, 0) / leftEye.length,
        y: leftEye.reduce((sum: number, p: any) => sum + p.y, 0) / leftEye.length,
      };
      const rightEyeCenter = {
        x: rightEye.reduce((sum: number, p: any) => sum + p.x, 0) / rightEye.length,
        y: rightEye.reduce((sum: number, p: any) => sum + p.y, 0) / rightEye.length,
      };
      
      const roll = Math.atan2(
        rightEyeCenter.y - leftEyeCenter.y,
        rightEyeCenter.x - leftEyeCenter.x
      ) * (180 / Math.PI);
      
      // Estimate yaw from nose position relative to face center
      const faceCenter = (jaw[0].x + jaw[jaw.length - 1].x) / 2;
      const noseTip = nose[nose.length - 1];
      const faceWidth = Math.abs(jaw[0].x - jaw[jaw.length - 1].x);
      const yaw = ((noseTip.x - faceCenter) / faceWidth) * 90;
      
      // Estimate pitch from nose tip relative to eye line
      const eyeLine = (leftEyeCenter.y + rightEyeCenter.y) / 2;
      const faceHeight = Math.abs(jaw[8].y - eyeLine); // chin to eye line
      const pitch = ((noseTip.y - eyeLine) / faceHeight - 0.5) * 60;
      
      return { pitch, yaw, roll };
    } catch {
      return { pitch: 0, yaw: 0, roll: 0 };
    }
  }, []);

  // Analyze a single frame
  const analyzeFrame = useCallback(async () => {
    if (!faceapiRef.current || !videoRef.current || !isModelLoaded) return null;
    
    const faceapi = faceapiRef.current;
    const video = videoRef.current;
    
    if (video.readyState !== 4) return null; // Video not ready
    
    try {
      const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks(true)
        .withFaceExpressions();
      
      if (!detection) {
        return null; // No face detected
      }
      
      const metrics: FaceMetrics = {
        expressions: {
          neutral: detection.expressions.neutral || 0,
          happy: detection.expressions.happy || 0,
          sad: detection.expressions.sad || 0,
          angry: detection.expressions.angry || 0,
          fearful: detection.expressions.fearful || 0,
          disgusted: detection.expressions.disgusted || 0,
          surprised: detection.expressions.surprised || 0,
        },
        eyeContact: calculateEyeContact(detection.landmarks),
        headPose: calculateHeadPose(detection.landmarks),
        confidence: detection.detection.score,
        timestamp: Date.now(),
      };
      
      return metrics;
    } catch (err) {
      console.error("Error analyzing frame:", err);
      return null;
    }
  }, [isModelLoaded, calculateEyeContact, calculateHeadPose]);

  // Start continuous analysis
  const startAnalysis = useCallback((video: HTMLVideoElement) => {
    if (!isModelLoaded) {
      console.warn("Models not loaded yet");
      return;
    }
    
    videoRef.current = video;
    metricsHistoryRef.current = [];
    setIsAnalyzing(true);
    
    intervalRef.current = setInterval(async () => {
      const metrics = await analyzeFrame();
      if (metrics) {
        metricsHistoryRef.current.push(metrics);
        setCurrentMetrics(metrics);
        onMetricsUpdate?.(metrics);
      }
    }, analysisInterval);
  }, [isModelLoaded, analysisInterval, analyzeFrame, onMetricsUpdate]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAnalyzing(false);
  }, []);

  // Get aggregated metrics
  const getAggregatedMetrics = useCallback((): AggregatedMetrics | null => {
    const history = metricsHistoryRef.current;
    if (history.length === 0) return null;
    
    // Calculate average expressions
    const avgExpressions = {
      neutral: 0,
      happy: 0,
      sad: 0,
      angry: 0,
      fearful: 0,
      disgusted: 0,
      surprised: 0,
    };
    
    let eyeContactCount = 0;
    let totalConfidence = 0;
    let totalHeadMovement = 0;
    
    history.forEach((m) => {
      avgExpressions.neutral += m.expressions.neutral;
      avgExpressions.happy += m.expressions.happy;
      avgExpressions.sad += m.expressions.sad;
      avgExpressions.angry += m.expressions.angry;
      avgExpressions.fearful += m.expressions.fearful;
      avgExpressions.disgusted += m.expressions.disgusted;
      avgExpressions.surprised += m.expressions.surprised;
      
      if (m.eyeContact) eyeContactCount++;
      totalConfidence += m.confidence;
      
      // Calculate head movement (deviation from neutral)
      const headDeviation = Math.abs(m.headPose.pitch) + Math.abs(m.headPose.yaw) + Math.abs(m.headPose.roll);
      totalHeadMovement += headDeviation;
    });
    
    const count = history.length;
    Object.keys(avgExpressions).forEach((key) => {
      avgExpressions[key as keyof typeof avgExpressions] /= count;
    });
    
    // Find dominant expression
    const dominantExpression = Object.entries(avgExpressions).reduce((a, b) => 
      a[1] > b[1] ? a : b
    )[0];
    
    const eyeContactPercentage = (eyeContactCount / count) * 100;
    const avgConfidence = totalConfidence / count;
    const avgHeadMovement = totalHeadMovement / count;
    
    // Calculate engagement score (0-100)
    // Factors: eye contact, confidence, appropriate expressions, head stability
    const engagementScore = Math.min(100, Math.round(
      (eyeContactPercentage * 0.3) +
      (avgConfidence * 100 * 0.2) +
      ((avgExpressions.neutral + avgExpressions.happy) * 100 * 0.3) +
      (Math.max(0, 100 - avgHeadMovement) * 0.2)
    ));
    
    // Head movement score (lower is better, 100 = very stable)
    const headMovementScore = Math.max(0, Math.round(100 - avgHeadMovement));
    
    return {
      avgExpressions,
      eyeContactPercentage: Math.round(eyeContactPercentage),
      avgConfidence: Math.round(avgConfidence * 100),
      dominantExpression,
      engagementScore,
      totalFramesAnalyzed: count,
      headMovementScore,
    };
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    metricsHistoryRef.current = [];
    setCurrentMetrics(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isModelLoaded,
    isAnalyzing,
    currentMetrics,
    error,
    loadModels,
    startAnalysis,
    stopAnalysis,
    getAggregatedMetrics,
    clearHistory,
    metricsHistory: metricsHistoryRef.current,
  };
}

// Face analysis hooks enhanced

// Face analysis hooks enhanced
