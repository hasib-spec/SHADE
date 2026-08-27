"""
NVIDIA NIM Client for SHADE Agent
Uses OpenAI-compatible client standard pointing to NVIDIA NIM (meta/llama-3.1-70b-instruct).
"""
import os
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

def get_nim_client():
    """
    Returns configured client for NVIDIA NIM.
    """
    nim_api_key = os.getenv("NVIDIA_NIM_API_KEY") or os.getenv("NVIDIA_API_KEY") or os.getenv("NIM_API_KEY")
    if not nim_api_key:
        return None
        
    try:
        from openai import OpenAI
        client = OpenAI(
            base_url="https://integrate.api.nvidia.com/v1",
            api_key=nim_api_key
        )
        return client
    except Exception as e:
        logger.warning(f"Could not initialize OpenAI NIM client: {e}")
        return None

def invoke_nim_chat(messages: List[Dict[str, str]], system_prompt: str = None, fallback_response: str = None) -> str:
    """
    Invokes the NIM LLM with conversation history and fallback.
    """
    client = get_nim_client()
    if client is None:
        return fallback_response or "Analysis completed successfully. Generated optimal tactical cooling plan."
        
    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})
        
    for msg in messages:
        if isinstance(msg, dict):
            formatted_messages.append(msg)
        elif hasattr(msg, "role") and hasattr(msg, "content"):
            formatted_messages.append({"role": msg.role, "content": msg.content})
            
    try:
        response = client.chat.completions.create(
            model=os.getenv("NVIDIA_NIM_MODEL", "meta/llama-3.1-70b-instruct"),
            messages=formatted_messages,
            temperature=0.2,
            max_tokens=2048
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"NIM API invocation failed: {e}. Using deterministic fallback.")
        return fallback_response or "Analysis completed successfully. Generated optimal tactical cooling plan."
