# app.py - ShieldPhish Backend
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse
import re

app = FastAPI(title="ShieldPhish")

# This allows any browser extension or web page to talk to your API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckRequest(BaseModel):
    url: str

def quick_score(url: str):
    """Simple heuristics to check a URL."""
    score = 0.0
    reasons = []
    
    # Simple checks for demonstration
    if re.search(r"\d{1,3}(\.\d{1,3}){3}", url):
        score = max(score, 0.6); reasons.append("ip_as_host")
    if any(s in url for s in ["bit.ly", "t.co", "tinyurl"]):
        score = max(score, 0.7); reasons.append("shortener")
    if any(k in url.lower() for k in ["login", "verify", "secure", "account", "bank"]):
        score = max(score, 0.6); reasons.append("suspicious_keyword")
    
    label = "phishing" if score >= 0.7 else ("suspicious" if score >= 0.5 else "benign")
    return round(score, 3), label, reasons

@app.get("/health", summary="Check if the API is running")
def health():
    return {"status": "ok", "product": "ShieldPhish"}

@app.post("/api/v1/check", summary="Check a single URL for phishing")
async def check_url(req: CheckRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL is empty")
    
    score, label, reasons = quick_score(req.url.strip())
    return {"url": req.url, "score": score, "label": label, "reasons": reasons}
