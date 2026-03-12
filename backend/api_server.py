"""
Simple HTTP API server for the Python backend.

This allows the Next.js frontend to call the Python LangGraph backend via HTTP.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import traceback

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.graph.orchestrator import build_langgraph_app
from src.graph.optimization_orchestrator import build_optimization_app
from src.utils.logging_utils import setup_logging, get_logger

# Setup logging
setup_logging("INFO")
logger = get_logger(__name__)

# Build the LangGraph apps once at startup
logger.info("Building LangGraph applications...")
app = build_langgraph_app()
optimization_app = build_optimization_app()
logger.info("LangGraph applications ready")


class ResumeAnalysisHandler(BaseHTTPRequestHandler):
    """HTTP request handler for resume analysis."""
    
    def do_GET(self):
        """Handle GET requests (health check)."""
        if self.path == "/health":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy"}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Handle POST requests for resume analysis and optimization."""
        try:
            # Parse URL path
            parsed_path = urlparse(self.path)
            path = parsed_path.path
            
            # Route to appropriate handler
            if path == "/optimize":
                self._handle_optimize()
            elif path == "/" or path == "":
                self._handle_analysis()
            else:
                self._send_error(404, f"Endpoint not found: {path}")
                
        except Exception as e:
            logger.error(f"Error processing request: {e}")
            logger.error(traceback.format_exc())
            self._send_error(500, f"Internal server error: {str(e)}")
    
    def _handle_analysis(self):
        """Handle resume analysis requests."""
            # Parse request
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Parse JSON
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                self._send_error(400, f"Invalid JSON: {e}")
                return
            
            # Extract required fields
            resume_text = request_data.get('resume_text')
            job_description = request_data.get('job_description')
            
            if not resume_text or not job_description:
                self._send_error(400, "resume_text and job_description are required")
                return
            
            logger.info("Processing resume analysis request")
            
            # Prepare initial state
            initial_state = {
                "resume_text": resume_text,
                "job_description": job_description,
            }
            
            # Invoke the LangGraph app
            result = app.invoke(initial_state)
            
            # Extract final score
            final_score_dict = result.get("final_score")
            if not final_score_dict:
                self._send_error(500, "No final_score in result")
                return
            
            # Format response to match frontend expectations
            overall_score = final_score_dict.get("overall_score", 0)
            resume_structured = result.get("resume_structured", {})
            
            response_data = {
                "success": True,
                "data": {
                    "analysisId": f"analysis_{os.urandom(8).hex()}",
                    "overallScore": round(overall_score),
                    "atsMatchPercentage": round(overall_score),
                    "resumeStructured": resume_structured,  # Include structured resume data
                    "analysis": {
                        "overallScore": round(overall_score),
                        "atsMatchPercentage": round(overall_score),
                        "sectionScores": final_score_dict.get("section_scores", []),
                        "comments": final_score_dict.get("comments", []),
                        "strengths": self._extract_strengths(final_score_dict),
                        "weaknesses": self._extract_weaknesses(final_score_dict),
                        "nextSteps": self._extract_next_steps(final_score_dict),
                        "aiGeneratedSummary": " ".join(final_score_dict.get("comments", [])) or "Analysis completed using multi-agent LangGraph system.",
                    }
                }
            }
            
            # Send response
            self._send_json(200, response_data)
            logger.info("Resume analysis completed successfully")
            
    def _handle_optimize(self):
        """Handle resume optimization requests."""
        try:
            # Parse request
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Parse JSON
            try:
                request_data = json.loads(post_data.decode('utf-8'))
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON in optimization request: {e}")
                self._send_error(400, f"Invalid JSON: {e}")
                return
            
            # Extract required fields
            resume_text = request_data.get('resume_text')
            job_description = request_data.get('job_description')
            resume_structured = request_data.get('resume_structured')  # Optional - if provided, skip extraction
            
            if not job_description:
                logger.error("Missing job_description in optimization request")
                self._send_error(400, "job_description is required")
                return
            
            if not resume_text and not resume_structured:
                logger.error("Missing both resume_text and resume_structured in optimization request")
                self._send_error(400, "Either resume_text or resume_structured is required")
                return
            
            logger.info("Processing resume optimization request")
            
            # Extract resume first if structured data not provided (like ATS scoring does)
            # This way the graph receives structured data and skips extraction = 5 calls total
            if not resume_structured and resume_text:
                logger.info("Extracting structured resume data first")
                try:
                    extract_state = {
                        "resume_text": resume_text,
                        "job_description": job_description,
                    }
                    extract_result = app.invoke(extract_state)  # Use ATS app to extract (1 call)
                    resume_structured = extract_result.get("resume_structured", {})
                    if not resume_structured:
                        logger.error("Failed to extract structured resume data")
                        self._send_error(500, "Failed to extract structured resume data")
                        return
                except Exception as e:
                    logger.error(f"Error extracting resume: {e}")
                    logger.error(traceback.format_exc())
                    self._send_error(500, f"Failed to extract resume: {str(e)}")
                    return
            
            # Prepare initial state with structured data (graph will skip extraction)
            initial_state = {
                "resume_structured": resume_structured,
                "job_description": job_description,
                "resume_text": resume_text,  # Keep for summary extraction if needed
            }
            
            # Invoke the optimization LangGraph app (5 parallel calls, no extraction)
            logger.info("Invoking optimization LangGraph app")
            try:
                result = optimization_app.invoke(initial_state)
            except Exception as e:
                logger.error(f"Error in optimization LangGraph app: {e}")
                logger.error(traceback.format_exc())
                self._send_error(500, f"Optimization failed: {str(e)}")
                return
            
            # Extract optimization result
            optimization_result_dict = result.get("optimization_result")
            resume_structured = result.get("resume_structured", {})
            
            if not optimization_result_dict:
                logger.error("No optimization_result in result")
                self._send_error(500, "No optimization_result in result")
                return
            
            # Format response for frontend
            response_data = {
                "success": True,
                "data": {
                    "optimizationId": f"opt_{os.urandom(8).hex()}",
                    "resumeStructured": resume_structured,
                    "optimization": optimization_result_dict,
                    "original": {
                        "summary": resume_structured.get("summary", ""),
                        "experience": resume_structured.get("experience", []),
                        "skills": resume_structured.get("skills", []),
                        "projects": resume_structured.get("projects", []),
                        "education": resume_structured.get("education", []),
                    }
                }
            }
            
            # Send response
            self._send_json(200, response_data)
            logger.info("Resume optimization completed successfully")
            
        except Exception as e:
            logger.error(f"Error processing optimization request: {e}")
            logger.error(traceback.format_exc())
            self._send_error(500, f"Internal server error: {str(e)}")
    
    def _extract_strengths(self, final_score: Dict[str, Any]) -> list:
        """Extract strengths from final score."""
        strengths = []
        section_scores = final_score.get("section_scores", [])
        for section in section_scores:
            if section.get("score", 0) >= 70:
                reasons = section.get("reasons", [])
                if reasons:
                    strengths.extend(reasons[:2])  # Top 2 reasons per strong section
        return strengths[:5]  # Limit to 5 total
    
    def _extract_weaknesses(self, final_score: Dict[str, Any]) -> list:
        """Extract weaknesses from final score."""
        weaknesses = []
        section_scores = final_score.get("section_scores", [])
        for section in section_scores:
            if section.get("score", 0) < 60:
                missing = section.get("missing_requirements", [])
                if missing:
                    weaknesses.extend(missing[:2])  # Top 2 missing per weak section
        return weaknesses[:5]  # Limit to 5 total
    
    def _extract_next_steps(self, final_score: Dict[str, Any]) -> list:
        """Extract next steps from final score."""
        next_steps = []
        section_scores = final_score.get("section_scores", [])
        
        # Find lowest scoring section
        lowest_section = min(
            section_scores,
            key=lambda s: s.get("score", 0),
            default=None
        )
        
        if lowest_section and lowest_section.get("score", 0) < 70:
            missing = lowest_section.get("missing_requirements", [])
            if missing:
                next_steps.append(f"Focus on improving {lowest_section.get('section_name', 'your resume')}")
                next_steps.extend([f"Add: {req}" for req in missing[:3]])
        
        if not next_steps:
            next_steps = [
                "Continue building relevant experience",
                "Highlight key achievements with metrics",
                "Keep skills section updated with latest technologies"
            ]
        
        return next_steps[:5]
    
    def _send_json(self, status: int, data: Dict[str, Any]):
        """Send JSON response."""
        response_json = json.dumps(data)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response_json.encode('utf-8'))
    
    def _send_error(self, status: int, message: str):
        """Send error response."""
        self._send_json(status, {
            "success": False,
            "error": message
        })
    
    def log_message(self, format, *args):
        """Override to use our logger."""
        logger.info(f"{self.address_string()} - {format % args}")


def run_server(port: int = None):
    """Run the HTTP server."""
    # Cloud Run sets PORT environment variable, use it if available
    if port is None:
        port = int(os.getenv("PORT", "8000"))
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, ResumeAnalysisHandler)
    logger.info(f"Starting HTTP server on port {port}")
    logger.info(f"Server ready at http://0.0.0.0:{port}")
    logger.info(f"Health check: http://0.0.0.0:{port}/health")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
        httpd.shutdown()


if __name__ == '__main__':
    import argparse
    # Cloud Run sets PORT environment variable, default to 8000 for local dev
    default_port = int(os.getenv("PORT", "8000"))
    parser = argparse.ArgumentParser(description='Resume Analysis API Server')
    parser.add_argument('--port', type=int, default=None, help='Port to run server on (defaults to PORT env var or 8000)')
    args = parser.parse_args()
    run_server(args.port if args.port is not None else default_port)


# API endpoints enhanced

# API endpoints enhanced

# API endpoints enhanced
