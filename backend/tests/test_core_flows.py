import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


@pytest.mark.asyncio
async def test_login_officer():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post(
            "/api/v1/auth/login",
            json={"email": "scrutiny@aicte-india.org", "password": "Zetsu@2026Pass"}
        )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["role"] == "SCRUTINY_OFFICER"


@pytest.mark.asyncio
async def test_audit_verify_chain():
    # 1. Login as Auditor
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        auth_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "auditor@aicte-india.org", "password": "Zetsu@2026Pass"}
        )
        token = auth_resp.json()["access_token"]

        # 2. Check audit chain integrity
        chain_resp = await ac.get(
            "/api/v1/audit/verify-chain",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert chain_resp.status_code == 200
    chain_data = chain_resp.json()
    assert chain_data["is_valid"] is True
    assert chain_data["broken_at_audit_id"] is None


@pytest.mark.asyncio
async def test_dashboard_summary():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        auth_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@aicte-india.org", "password": "Zetsu@2026Pass"}
        )
        token = auth_resp.json()["access_token"]

        dash_resp = await ac.get(
            "/api/v1/dashboard/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    assert dash_data["total_instruments"] >= 5
    assert dash_data["total_value_inr"] > 0


@pytest.mark.asyncio
async def test_time_travel_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        auth_resp = await ac.post(
            "/api/v1/auth/login",
            json={"email": "admin@aicte-india.org", "password": "Zetsu@2026Pass"}
        )
        token = auth_resp.json()["access_token"]

        # Advance 45 days
        travel_resp = await ac.post(
            "/api/v1/admin/time-travel",
            json={"days": 45},
            headers={"Authorization": f"Bearer {token}"}
        )
    assert travel_resp.status_code == 200
    travel_data = travel_resp.json()
    assert travel_data["success"] is True
    assert "simulated_system_date" in travel_data
