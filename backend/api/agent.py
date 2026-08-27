from fastapi import APIRouter
from backend.schemas.agent import ChatHistory, AgentResponse
from backend.agent.graph import shade_agent
from backend.agent.demo_mode import is_flagship_demo_prompt, get_demo_trajectory_response

router = APIRouter(prefix="/api/agent", tags=["agent"])

@router.post("/chat", response_model=AgentResponse)
def agent_chat(request: ChatHistory, demo_mode: bool = True):
    """
    Runs the SHADE Agent with demo mode toggle, returning structured reasoning, 
    tool calls, and final municipal action plan.
    """
    latest_message = request.messages[-1].content if request.messages else ""
    
    if demo_mode and (is_flagship_demo_prompt(latest_message) or "50,000" in latest_message or "$50k" in latest_message.lower()):
        demo_resp = get_demo_trajectory_response()
        return AgentResponse(
            response=demo_resp["response"],
            artifacts=demo_resp.get("artifacts", {})
        )
    
    # Run full agent reasoning pipeline
    messages_payload = [{"role": msg.role, "content": msg.content} for msg in request.messages]
    result = shade_agent.run(messages=messages_payload, district="Maryvale", budget=50000.0, target="elderly")
    
    return AgentResponse(
        response=result["response"],
        artifacts={
            "work_order_id": "WO-PHX-2026-0829-01",
            "budget_spent": result["allocation"]["budget_spent"],
            "residents_covered": result["allocation"]["residents_covered"],
            "avg_cooling_c": result["allocation"]["avg_projected_cooling_c"],
            "sms_alerts": result["allocation"]["sms_alerts"]
        }
    )
