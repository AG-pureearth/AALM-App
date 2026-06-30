"""Request/response models for the AALM API (kept permissive so the front-end can
evolve the parameter set without breaking the contract)."""
from __future__ import annotations
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class RunConfig(BaseModel):
    """A complete AALM run configuration as sent by the front-end."""
    model_config = ConfigDict(extra="allow")

    simName: str
    sim: Dict[str, Any]
    growth: Dict[str, Any]
    physConst: Dict[str, Any]
    physAges: List[float]
    physTimeDep: Dict[str, List[float]]
    lung: Dict[str, List[float]]
    media: Dict[str, Any]
    iter: Optional[Dict[str, Any]] = None
