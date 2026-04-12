"""
Edify-AI Python Backend - API Server
------------------------------------
Provides a lightweight HTTP interface over the multi-agent LangGraph system.
Used for resume analysis, optimization, and health monitoring.
Deployed via Cloud Run.
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, List
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import traceback

# Core Path Configuration
sys.path.insert(0, str(Path(__file__).parent))

from src.graph.orchestrator import build_langgraph_app
from src.graph.optimization_orchestrator import build_optimization_app
from src.utils.logging_utils import setup_logging, get_logger

# System Initialization
setup_logging("INFO")
logger = get_logger(__name__)

logger.info("Initializing multi-agent graph architectures...")
app = build_langgraph_app()
optimization_app = build_optimization_app()
logger.info("Backend systems ready for inference.")


class ResumeAnalysisHandler(BaseHTTPRequestHandler):
    """
    Main Request Handler for Resume Intelligence Services.
    Routes:
    - GET  /health   : Vitality check.
    - POST /         : Full ATS analysis and scoring.
    - POST /optimize : Resume-to-Job alignment and refactoring.
    """
    
    def do_GET(self):
        """Standard health check endpoint."""
        if self.path == "/health":
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "service": "edify-ai-python"}).encode())
        else:
            self._send_error(404, "Unknown endpoint")
    
    def do_OPTIONS(self):
        """Cross-Origin Resource Sharing (CORS) preflight support."""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS, GET')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        """Main routing logic for POST requests."""
        try:
            parsed_path = urlparse(self.path)
            path = parsed_path.path
            
            if path == "/optimize":
                self._handle_optimize()
            elif path in ["/", ""]:
                self._handle_analysis()
            else:
                self._send_error(404, f"Endpoint not found: {path}")
                
        except Exception as e:
            logger.error(f"Critical execution error: {e}")
            logger.error(traceback.format_exc())
            self._send_error(500, f"Inference engine failure: {str(e)}")
    
    def _handle_analysis(self):
        """Handles full spectrum ATS scoring and analysis."""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError as e:
            self._send_error(400, "Malformed request: Invalid JSON body")
            return
        
        resume_text = request_data.get('resume_text')
        job_description = request_data.get('job_description')
        
        if not resume_text or not job_description:
            self._send_error(400, "Missing required fields: resume_text and job_description")
            return
        
        logger.info("[Server] Transitioning to ATS Analysis Graph")
        initial_state = {"resume_text": resume_text, "job_description": job_description}
        result = app.invoke(initial_state)
        
        final_score_dict = result.get("final_score")
        if not final_score_dict:
            self._send_error(500, "Graph failed to yield analysis results")
            return
        
        overall_score = final_score_dict.get("overall_score", 0)
        
        response_data = {
            "success": True,
            "data": {
                "analysisId": f"gen_{os.urandom(4).hex()}",
                "overallScore": round(overall_score),
                "atsMatchPercentage": round(overall_score),
                "resumeStructured": result.get("resume_structured", {}),
                "analysis": {
                    "sectionScores": final_score_dict.get("section_scores", []),
                    "comments": final_score_dict.get("comments", []),
                    "strengths": self._extract_strengths(final_score_dict),
                    "weaknesses": self._extract_weaknesses(final_score_dict),
                    "nextSteps": self._extract_next_steps(final_score_dict),
                    "aiGeneratedSummary": "Summary constructed by Edify-AI multi-agent coordinator.",
                }
            }
        }
        self._send_json(200, response_data)
    
    def _handle_optimize(self):
        """Handles resume optimization and refactoring."""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            request_data = json.loads(post_data.decode('utf-8'))
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON payload")
            return
        
        resume_text = request_data.get('resume_text')
        job_description = request_data.get('job_description')
        resume_structured = request_data.get('resume_structured')
        
        if not job_description:
            self._send_error(400, "job_description is a required parameter")
            return

        logger.info("[Server] Transitioning to Optimization Graph")
        initial_state = {
            "resume_structured": resume_structured,
            "job_description": job_description,
            "resume_text": resume_text,
        }
        
        try:
            result = optimization_app.invoke(initial_state)
            opt_data = {
                "success": True,
                "data": {
                    "optimizationId": f"opt_{os.urandom(4).hex()}",
                    "resumeStructured": result.get("resume_structured", {}),
                    "optimization": result.get("optimization_result", {}),
                }
            }
            self._send_json(200, opt_data)
        except Exception as e:
            self._send_error(500, f"Optimization routine crashed: {str(e)}")

    def _extract_strengths(self, final_score: Dict[str, Any]) -> List[str]:
        """Utility to isolate top scoring areas."""
        strengths = []
        for section in final_score.get("section_scores", []):
            if section.get("score", 0) >= 75:
                strengths.extend(section.get("reasons", [])[:1])
        return list(set(strengths))[:5]

    def _extract_weaknesses(self, final_score: Dict[str, Any]) -> List[str]:
        """Utility to identify critical match gaps."""
        weaknesses = []
        for section in final_score.get("section_scores", []):
            if section.get("score", 0) < 60:
                weaknesses.extend(section.get("missing_requirements", [])[:1])
        return list(set(weaknesses))[:5]

    def _extract_next_steps(self, final_score: Dict[str, Any]) -> List[str]:
        """Provides actionable feedback based on lowest scores."""
        low_sections = [s for s in final_score.get("section_scores", []) if s.get("score", 0) < 70]
        steps = [f"Improve your {s.get('section_name')} section" for s in low_sections]
        return steps[:3] if steps else ["Continue refining with metrics-based achievements"]

    def _send_json(self, status: int, data: Dict[str, Any]):
        """Helper to send JSON response with standard headers."""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def _send_error(self, status: int, message: str):
        """Helper for standardized error signaling."""
        self._send_json(status, {"success": False, "error": message})

    def log_message(self, format, *args):
        """Intercepts internal server logging to use project standard logger."""
        logger.info(f"{self.address_string()} - {format % args}")


def run_server(port: int = None):
    """Orchestrates server startup and lifecycle."""
    if port is None:
        port = int(os.getenv("PORT", "8000"))
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, ResumeAnalysisHandler)
    logger.info(f"Edify-AI Python Server broadcasting on port {port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Server termination signal received. Exiting.")
        httpd.shutdown()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Edify-AI Inference Server')
    parser.add_argument('--port', type=int, default=None, help='Target port')
    args = parser.parse_args()
    run_server(args.port)
