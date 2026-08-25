"""Backend tests: forgot-password / reset-password flow (owner bootstrap + normal user)."""
import os
import uuid

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = base_url.rstrip("/")
API = f"{BASE_URL}/api"

OWNER_EMAIL = "sun@sohighon.ai"
OWNER_PASS = "OwnerPass123!"
NEW_USER_EMAIL = f"qapw_{uuid.uuid4().hex[:8]}@example.test"
NEW_USER_PASS = "UserPass123!"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# --- forgot-password: unknown / normal user -------------------------------
class TestForgotPasswordGeneric:
    def test_unknown_email_returns_generic_no_link(self, client):
        r = client.post(f"{API}/auth/forgot-password", json={"email": f"nobody_{uuid.uuid4().hex[:6]}@example.test"}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "ok"
        assert "reset_url" not in d
        assert "reset link" in d.get("message", "").lower()

    def test_invalid_email_format_handled(self, client):
        # ForgotInput.email is a plain str (no EmailStr), so malformed input falls through
        # to the generic response. Acceptable (no enumeration), documented as minor.
        r = client.post(f"{API}/auth/forgot-password", json={"email": "not-an-email"}, timeout=30)
        assert r.status_code in (200, 422), r.text
        if r.status_code == 200:
            assert "reset_url" not in r.json()

    def test_registered_normal_user_gets_no_reset_url(self, client):
        reg = client.post(f"{API}/auth/register", json={"email": NEW_USER_EMAIL, "password": NEW_USER_PASS, "name": "TEST_PW User"}, timeout=30)
        assert reg.status_code == 200, reg.text
        client.post(f"{API}/auth/logout", timeout=30)
        r = client.post(f"{API}/auth/forgot-password", json={"email": NEW_USER_EMAIL}, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d.get("status") == "ok"
        assert "reset_url" not in d, "Reset link leaked for a non-owner account"


# --- reset-password validation --------------------------------------------
class TestResetValidation:
    def test_bogus_token_rejected(self, client):
        r = client.post(f"{API}/auth/reset-password", json={"token": "x" * 40, "password": "SomePass123"}, timeout=30)
        assert r.status_code == 400, r.text
        assert "invalid" in r.json().get("detail", "").lower()

    def test_short_password_rejected(self, client):
        r = client.post(f"{API}/auth/reset-password", json={"token": "x" * 40, "password": "short"}, timeout=30)
        assert r.status_code == 422, r.text

    def test_empty_token_rejected(self, client):
        r = client.post(f"{API}/auth/reset-password", json={"token": "", "password": "SomePass123"}, timeout=30)
        assert r.status_code == 422, r.text


# --- owner bootstrap end-to-end ------------------------------------------
class TestOwnerResetE2E:
    def test_owner_reset_end_to_end(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        # ensure owner account exists (register or login with either known password)
        reg = s.post(f"{API}/auth/register", json={"email": OWNER_EMAIL, "password": OWNER_PASS, "name": "Owner QA"}, timeout=30)
        assert reg.status_code in (200, 400, 409), reg.text
        s.post(f"{API}/auth/logout", timeout=30)

        r = s.post(f"{API}/auth/forgot-password", json={"email": OWNER_EMAIL}, timeout=30)
        assert r.status_code == 200, r.text
        reset_url = r.json().get("reset_url")
        assert reset_url, "Owner bootstrap did not return reset_url"
        assert "/reset-password?token=" in reset_url
        token = reset_url.split("token=")[1]
        assert len(token) > 20

        new_pass = "BrandNew123"
        rr = s.post(f"{API}/auth/reset-password", json={"token": token, "password": new_pass}, timeout=30)
        assert rr.status_code == 200, rr.text
        assert rr.json().get("status") == "ok"

        # token single-use
        again = s.post(f"{API}/auth/reset-password", json={"token": token, "password": "AnotherPass123"}, timeout=30)
        assert again.status_code == 400, again.text

        # login with new password + admin flag
        li = s.post(f"{API}/auth/login", json={"email": OWNER_EMAIL, "password": new_pass}, timeout=30)
        assert li.status_code == 200, li.text
        me = s.get(f"{API}/auth/me", timeout=30)
        assert me.status_code == 200, me.text
        data = me.json()
        assert data.get("is_admin") is True, f"Owner not admin: {data}"
        assert "_id" not in data
        s.post(f"{API}/auth/logout", timeout=30)
