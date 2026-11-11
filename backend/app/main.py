from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.api.openapi import OPENAPI_TAGS
from app.core.config import Settings, get_settings
from app.core.container import ApplicationContainer
from app.core.errors import register_error_handlers


def create_app(settings: Settings | None = None) -> FastAPI:
    application_settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(application: FastAPI):
        application.state.container = ApplicationContainer.build(application_settings)
        yield

    application = FastAPI(
        title="RAG educativa API",
        description="Pipeline RAG local, explícito e inspeccionable.",
        version="1.0.0",
        openapi_tags=OPENAPI_TAGS,
        lifespan=lifespan,
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=[application_settings.frontend_origin],
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE"],
        allow_headers=["Content-Type"],
    )
    register_error_handlers(application)
    application.include_router(api_router)
    return application


app = create_app()
