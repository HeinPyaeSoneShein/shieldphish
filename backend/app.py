# app.py - ShieldPhish Backend (Improved)
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import re

app = FastAPI(title="ShieldPhish")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckRequest(BaseModel):
    url: str

def quick_score(url: str):
    """More sensitive heuristics to check a URL."""
    score = 0.0
    reasons = []
    
    # Give a higher score for keywords
    if any(k in url.lower() for k in ["login", "verify", "secure", "account", "bank", "update", "password"]):
        score = max(score, 0.7)
        reasons.append("suspicious_keyword")

    if any(s in url for s in ["bit.ly", "t.co", "tinyurl"]):
        score = max(score, 0.8) # Higher score for shorteners
        reasons.append("shortener")

    if re.search(r"\d{1,3}(\.\d{1,3}){3}", url):
        score = max(score, 0.6)
        reasons.append("ip_as_host")
    
    # Adjusted thresholds
    label = "phishing" if score >= 0.7 else ("suspicious" if score >= 0.5 else "benign")
    return round(score, 3), label, reasons

@app.get("/health")
def health():
    return {"status": "ok", "product": "ShieldPhish"}

@app.post("/api/v1/check")
async def check_url(req: CheckRequest):
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL is empty")
    
    score, label, reasons = quick_score(req.url.strip())
    return {"url": req.url, "score": score, "label": label, "reasons": reasons}
