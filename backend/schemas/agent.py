"""
Agent Chat Schemas
"""
from pydantic import BaseModel
from typing import List, Optional, Any

class AgentMessage(BaseModel):
    role: str = "user"
    content: str

class ChatRequest(BaseModel):
    messages: Optional[List[AgentMessage]] = None
    message: Optional[str] = None
    content: Optional[str] = None
    query: Optional[str] = None
    district: Optional[str] = "Maryvale"
    budget: Optional[float] = 50000.0
    target: Optional[str] = "elderly"

class AgentResponse(BaseModel):
    response: str
    artifacts: Optional[dict] = None
