from __future__ import annotations

import logging
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from backend.logging import RequestIDFilter
from backend.api.dependencies import get_job_queue
from backend.main import create_app


@pytest.fixture
def app():
    return create_app()


@pytest.mark.asyncio
async def test_cors_rejects_unknown_origin(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health/live",
            headers={
                "Origin": "https://evil.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert "Access-Control-Allow-Origin" not in response.headers


@pytest.mark.asyncio
async def test_cors_allows_configured_origin(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health/live",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:3000"


@pytest.mark.asyncio
async def test_cors_allows_local_dev_port(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.options(
            "/api/v1/health/live",
            headers={
                "Origin": "http://localhost:57237",
                "Access-Control-Request-Method": "GET",
            },
        )

    assert response.headers.get("Access-Control-Allow-Origin") == "http://localhost:57237"


@pytest.mark.asyncio
async def test_error_response_has_stable_format(app):
    """Validation errors (no DB needed) return {code, message, retryable} format."""
    app.dependency_overrides[get_job_queue] = lambda: AsyncMock()
    transport = ASGITransport(app=app)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            response = await client.post(
                "/api/v1/jobs/hypothesis",
                json={"url": "not-a-valid-url"},
            )
    finally:
        app.dependency_overrides.pop(get_job_queue, None)

    assert response.status_code == 422
    body = response.json()
    detail = body["detail"]
    assert isinstance(detail, dict)
    assert "code" in detail
    assert "message" in detail
    assert "retryable" in detail
    assert "Traceback" not in response.text


@pytest.mark.asyncio
async def test_unhandled_exception_omits_sensitive_data(app):
    @app.get("/crash")
    async def crash() -> None:
        raise RuntimeError("API_KEY=sk-abc123 and /home/user/.env")

    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/crash")

    assert response.status_code == 500
    body = response.json()
    detail = body["detail"]
    assert detail["code"] == "INTERNAL_ERROR"
    assert detail["message"] == "An unexpected error occurred"
    assert detail["retryable"] is True
    assert "sk-abc123" not in response.text
    assert "Traceback" not in response.text
    assert "/home/user/" not in response.text


@pytest.mark.asyncio
async def test_response_includes_request_id(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/health/live")

    assert "X-Request-ID" in response.headers
    assert len(response.headers["X-Request-ID"]) > 0


def test_request_id_filter_supplies_default_for_background_logs():
    record = logging.LogRecord(
        name="worker", level=logging.ERROR, pathname=__file__, lineno=1,
        msg="background failure", args=(), exc_info=None,
    )

    assert RequestIDFilter().filter(record) is True
    assert record.request_id == "-"
