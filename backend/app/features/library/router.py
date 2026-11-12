from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.core.container import ApplicationContainer, get_container

router = APIRouter(prefix="/library", tags=["library"])


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
def clear_library(
    container: Annotated[ApplicationContainer, Depends(get_container)],
) -> None:
    container.indexing.clear_library()
