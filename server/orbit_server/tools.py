"""The assistant's tools. They run in the browser (see src/modules/assistant/hooks/useToolRegistry.ts).

The server only advertises them to the LLM and relays results:

  LLM calls tool -> RTVI observer sends `llm-function-call-in-progress` to the browser
  -> the browser runs the handler (asking a person to confirm writes/shares)
  -> the browser sends `llm-function-call-result` -> RTVI pushes a FunctionCallResultFrame
  -> ClientToolBridge hands it to the waiting server handler -> handler reports the result.

Keeping the server handler alive until the browser answers lets Pipecat's own timeout,
interruption and context bookkeeping work as for any server-side tool.
"""

import asyncio
from typing import Any

from loguru import logger
from pipecat.adapters.llm.schemas.function_schema import FunctionSchema
from pipecat.adapters.llm.schemas.tools_schema import ToolsSchema
from pipecat.frames.frames import Frame, FunctionCallResultFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor
from pipecat.services.llm_service import FunctionCallParams, LLMService

from .store import VITAL_META

CALLSIGN = {"type": "string", "description": "Crew callsign, e.g. VEGA, HALO, TALON or IRIS."}

SCHEMAS = [
    FunctionSchema(
        name="get_current_context",
        description="Get the screen the person is on, who is using this console, and any selected crew member or anatomy region.",
        properties={},
        required=[],
    ),
    FunctionSchema(
        name="get_crew_summary",
        description="Get a crew member's latest readings and wellbeing check-in. Defaults to the person using the console.",
        properties={"callsign": CALLSIGN},
        required=[],
    ),
    FunctionSchema(
        name="log_vital",
        description=(
            "Draft a vital-sign reading for a crew member. The person presses Save on screen, or says \"confirm save\", before it is stored; "
            "this tool returns only after they decide, and the result says whether it was saved. "
            "Saved readings also appear in the website's Health log."
        ),
        properties={
            "callsign": CALLSIGN,
            "kind": {"type": "string", "enum": list(VITAL_META), "description": "Which reading."},
            "value": {"type": "number", "description": "The number only, in the standard unit."},
            "unit": {"type": "string", "description": "Optional: bpm, %, mmHg, °C or /min."},
        },
        required=["callsign", "kind", "value"],
    ),
    FunctionSchema(
        name="navigate",
        description=(
            "Open a screen in this console. Paths: /crew, /crew?crew=c01, /anatomy, /anatomy?region=left_knee, "
            "/evidence, /assistant. Crew ids: VEGA=c01, HALO=c02, TALON=c03, IRIS=c04. "
            "Website pages: /status (crew status), /log (health log), /trends (health trends), "
            "/care (health assessment), /wellbeing (sleep and wellbeing), /exercise, /skin (skin and wounds), "
            "/routine (daily routine), /risks (health risk readings). "
            "The result names the screen that opened."
        ),
        properties={"path": {"type": "string", "description": "A path starting with /."}},
        required=["path"],
    ),
    FunctionSchema(
        name="control_anatomy",
        description="Control the 3D view in the Anatomy lab.",
        properties={
            "action": {
                "type": "string",
                "enum": ["select_region", "focus_region", "reset_view", "rotate", "toggle_layer"],
            },
            "region": {"type": "string", "description": "Body region, e.g. left_knee, lumbar_spine, heart."},
        },
        required=["action"],
    ),
    FunctionSchema(
        name="search_evidence",
        description=(
            "Search the local Evidence library of spaceflight medicine papers. Use it for any medical or research "
            "question, then answer from the passages and cite them by number, like [1]."
        ),
        properties={
            "query": {"type": "string", "description": "What to look for."},
            "k": {"type": "integer", "description": "How many passages, 1 to 5.", "minimum": 1, "maximum": 5},
        },
        required=["query"],
    ),
    FunctionSchema(
        name="share_record_with_assistant",
        description=(
            "Ask to see parts of a crew member's record. A person reviews exactly what will be shared and must "
            "approve it on screen or by saying \"confirm share\". Never claim it was shared before the result says so."
        ),
        properties={
            "callsign": CALLSIGN,
            "sections": {
                "type": "array",
                "items": {"type": "string", "enum": ["latest_vitals", "wellbeing"]},
            },
        },
        required=["sections"],
    ),
]

TOOL_NAMES = [s.name for s in SCHEMAS]

# Tools that wait for a person: keep them alive through interruptions (saying
# "confirm share" is itself speech) and give people time to decide.
HUMAN_CONFIRMED = {"log_vital", "share_record_with_assistant"}
# The browser gives up at 285 s (CONFIRM_TIMEOUT_MS in src/modules/assistant/tools/definitions.ts)
# and reports "declined", so this server timeout is only a backstop. Keep it the larger of the two.
CONFIRM_TIMEOUT_SECS = 300
DEFAULT_TIMEOUT_SECS = 30


def tools_schema() -> ToolsSchema:
    return ToolsSchema(standard_tools=SCHEMAS)


def openai_tools() -> list[dict]:
    """The same tools in OpenAI request format (used to pre-warm Ollama's prompt cache)."""
    return [{"type": "function", "function": s.to_default_dict()} for s in SCHEMAS]


class ClientToolBridge(FrameProcessor):
    """Catches tool results sent by the browser and hands them to the waiting handler."""

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._waiting: dict[str, asyncio.Future] = {}

    def expect(self, tool_call_id: str) -> asyncio.Future:
        fut = asyncio.get_running_loop().create_future()
        self._waiting[tool_call_id] = fut
        return fut

    def forget(self, tool_call_id: str) -> None:
        self._waiting.pop(tool_call_id, None)

    async def process_frame(self, frame: Frame, direction: FrameDirection):
        await super().process_frame(frame, direction)
        if (
            isinstance(frame, FunctionCallResultFrame)
            and direction == FrameDirection.DOWNSTREAM
            and frame.tool_call_id in self._waiting
        ):
            fut = self._waiting.pop(frame.tool_call_id)
            if not fut.done():
                fut.set_result(frame.result)
            return  # the LLM service re-broadcasts the result properly
        await self.push_frame(frame, direction)


def register_client_tools(llm: LLMService, bridge: ClientToolBridge) -> None:
    async def relay(params: FunctionCallParams):
        fut = bridge.expect(params.tool_call_id)
        try:
            result: Any = await fut
        finally:
            bridge.forget(params.tool_call_id)
        logger.debug(f"Tool {params.function_name} returned from browser")
        await params.result_callback(result)

    for name in TOOL_NAMES:
        confirmed = name in HUMAN_CONFIRMED
        llm.register_function(
            name,
            relay,
            cancel_on_interruption=not confirmed,
            timeout_secs=CONFIRM_TIMEOUT_SECS if confirmed else DEFAULT_TIMEOUT_SECS,
        )
