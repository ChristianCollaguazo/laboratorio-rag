from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.container import ApplicationContainer, get_container

from .schemas import StatusView

router = APIRouter(prefix="/status", tags=["status"])


@router.get("", response_model=StatusView)
def get_status(container: Annotated[ApplicationContainer, Depends(get_container)]) -> dict:
    return container.status.get_status()
