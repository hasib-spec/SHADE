"""
Agent Chat Schemas
"""
from pydantic import BaseModel
from typing import List, Optional

class AgentMessage(BaseModel):
    role: str
    content: str

class ChatHistory(BaseModel):
    messages: List[AgentMessage]

class AgentResponse(BaseModel):
    response: str
    artifacts: Optional[dict] = None
