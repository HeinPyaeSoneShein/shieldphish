# ~/phish-project/backend/app.py - CORRECTED VERSION
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from urllib.parse import urlparse # Import urlparse
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
    """Heuristics with corrected, more specific checks."""
    score = 0.0
    reasons = []
    url_lower = url.lower()
    
    try:
        # Safely parse the URL to get its components
        parsed_url = urlparse(url)
        hostname = parsed_url.netloc.lower()
    except Exception:
        hostname = ""

    # High-threat indicators (likely phishing)
    if any(k in url_lower for k in ["login", "password", "signin", "banking", "verify-account"]):
        score = max(score, 0.8)
        reasons.append("high_threat_keyword")
    
    # *** THE FIX IS HERE: We now check the exact hostname ***
    if hostname in ["bit.ly", "t.co", "tinyurl.com"]:
        score = max(score, 0.9)
        reasons.append("url_shortener")

    # Medium-threat indicators (suspicious)
    if any(k in url_lower for k in ["secure", "account", "update"]):
        score = max(score, 0.5)
        reasons.append("medium_threat_keyword")
    if re.search(r"\d{1,3}(\.\d{1,3}){3}", hostname):
        score = max(score, 0.6)
        reasons.append("ip_as_host")
    
    # Final label assignment
    label = "phishing" if score >= 0.8 else ("suspicious" if score >= 0.5 else "benign")
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
