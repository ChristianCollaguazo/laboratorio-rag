from dataclasses import dataclass
import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


@dataclass
class ApplicationError(Exception):
    message: str
    code: str = "application_error"
    status_code: int = 500

    def __str__(self) -> str:
        return self.message


class ResourceNotFoundError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, "resource_not_found", 404)


class IndexCompatibilityError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, "index_incompatible", 409)


class ValidationError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, "validation_error", 422)


class ProviderUnavailableError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, "provider_unavailable", 503)


class IndexingError(ApplicationError):
    def __init__(self, message: str):
        super().__init__(message, "indexing_failed", 500)


def register_error_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApplicationError)
    async def handle_application_error(
        _request: Request, error: ApplicationError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=error.status_code,
            content={"detail": error.message, "code": error.code},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(
        _request: Request, error: Exception
    ) -> JSONResponse:
        logger.exception("Unhandled application error", exc_info=error)
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Ocurrió un error inesperado al procesar la operación. "
                "Revisa los datos e inténtalo de nuevo.",
                "code": "internal_error",
            },
        )
