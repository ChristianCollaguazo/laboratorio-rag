from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.container import ApplicationContainer, get_container

from .schemas import ChatRequest, ChatView, RetrievalView, RetrieveRequest

router = APIRouter(tags=["query"])


@router.post("/retrieve", response_model=RetrievalView)
def retrieve(request: RetrieveRequest, container: Annotated[ApplicationContainer, Depends(get_container)]) -> RetrievalView:
    return RetrievalView.from_domain(container.query.retrieve(request.index_id, request.question, request.top_k, request.embedding.to_domain()))


@router.post("/chat", response_model=ChatView)
def chat(request: ChatRequest, container: Annotated[ApplicationContainer, Depends(get_container)]) -> ChatView:
    return ChatView.from_domain(container.query.chat(request.index_id, request.question, request.top_k, request.embedding.to_domain(), request.generation.to_domain()))
