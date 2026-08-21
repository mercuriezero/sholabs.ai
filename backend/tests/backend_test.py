"""Backend tests: coupons, admin coupon CRUD, role management (owner-only), account summary flags."""
import os
import uuid
from datetime import date, timedelta

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
USER_EMAIL = f"qa_user_{uuid.uuid4().hex[:8]}@example.test"
USER_PASS = "UserPass123!"


def _session_for(email, password, name="TEST_User"):
    s = requests.Session()
    r = s.post(f"{API}/auth/register", json={"email": email, "password": password, "name": name}, timeout=30)
    if r.status_code != 200:
        r = s.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
        if r.status_code != 200:
            pytest.fail(f"Auth failed for {email}: {r.status_code} {r.text[:300]}")
    return s


@pytest.fixture(scope="session")
def owner():
    return _session_for(OWNER_EMAIL, OWNER_PASS, "QA Owner")


@pytest.fixture(scope="session")
def normal_user():
    return _session_for(USER_EMAIL, USER_PASS)


# ---------- health / auth ----------
class TestHealth:
    def test_health(self):
        r = requests.get(f"{API}/health", timeout=30)
        assert r.status_code == 200

    def test_owner_summary_flags(self, owner):
        r = owner.get(f"{API}/account/summary", timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["is_owner"] is True
        assert d["is_admin"] is True
        assert d["user"]["email"] == OWNER_EMAIL

    def test_normal_user_summary_flags(self, normal_user):
        r = normal_user.get(f"{API}/account/summary", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["is_owner"] is False
        assert d["is_admin"] is False


# ---------- coupons: validate ----------
class TestCouponValidate:
    def test_launch_9_pct(self, normal_user):
        r = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 1290, "launch": True}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        assert d["valid"] is True
        assert d["discount_pct"] == 9
        assert d["discount_amount"] == 116.1
        assert d["final_amount"] == 1173.9
        assert d["code"].startswith("HIA9-")

    def test_invalid_code(self, normal_user):
        r = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 1290, "coupon_code": "NOPE" + uuid.uuid4().hex[:6]}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["valid"] is False
        assert "isn't valid" in d["error"]

    def test_requires_auth(self):
        r = requests.post(f"{API}/coupons/validate", json={"amount_usd": 100, "launch": True}, timeout=30)
        assert r.status_code in (401, 403), r.status_code

    def test_bad_amount_rejected(self, normal_user):
        r = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 0, "launch": True}, timeout=30)
        assert r.status_code == 422


# ---------- admin coupon CRUD ----------
class TestAdminCoupons:
    def test_non_admin_forbidden(self, normal_user):
        r = normal_user.post(f"{API}/admin/coupons", json={"code": "TEST_X1", "discount_pct": 10}, timeout=30)
        assert r.status_code == 403
        assert normal_user.get(f"{API}/admin/coupons", timeout=30).status_code == 403

    def test_create_validate_delete(self, owner, normal_user):
        code = f"TESTQA{uuid.uuid4().hex[:5].upper()}"
        expiry = (date.today() + timedelta(days=30)).isoformat()
        r = owner.post(f"{API}/admin/coupons", json={
            "code": code.lower(), "discount_pct": 15, "label": "TEST_ coupon", "expiry": expiry, "max_uses": 5,
        }, timeout=30)
        assert r.status_code == 200, r.text[:300]
        d = r.json()
        cid = d["id"]
        assert d["code"] == code
        assert d["discount_pct"] == 15
        assert d["max_uses"] == 5
        assert d["used_count"] == 0
        assert "_id" not in d

        # GET verifies persistence
        lst = owner.get(f"{API}/admin/coupons", timeout=30).json()
        assert any(c["id"] == cid and c["code"] == code for c in lst)

        # validate math for a normal user
        v = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 690, "coupon_code": code}, timeout=30).json()
        assert v["valid"] is True and v["discount_pct"] == 15
        assert v["discount_amount"] == 103.5 and v["final_amount"] == 586.5

        # duplicate rejected
        dup = owner.post(f"{API}/admin/coupons", json={"code": code, "discount_pct": 5}, timeout=30)
        assert dup.status_code == 400

        # delete + verify removal
        assert owner.delete(f"{API}/admin/coupons/{cid}", timeout=30).status_code == 200
        lst2 = owner.get(f"{API}/admin/coupons", timeout=30).json()
        assert not any(c["id"] == cid for c in lst2)
        v2 = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 690, "coupon_code": code}, timeout=30).json()
        assert v2["valid"] is False

    def test_expired_coupon_rejected(self, owner, normal_user):
        code = f"TESTEXP{uuid.uuid4().hex[:4].upper()}"
        expiry = (date.today() - timedelta(days=2)).isoformat()
        r = owner.post(f"{API}/admin/coupons", json={"code": code, "discount_pct": 10, "expiry": expiry}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        cid = r.json()["id"]
        try:
            v = normal_user.post(f"{API}/coupons/validate", json={"amount_usd": 100, "coupon_code": code}, timeout=30).json()
            assert v["valid"] is False and "expired" in v["error"].lower()
        finally:
            owner.delete(f"{API}/admin/coupons/{cid}", timeout=30)

    def test_reserved_prefix_and_bad_pct(self, owner):
        assert owner.post(f"{API}/admin/coupons", json={"code": "HIA9TEST", "discount_pct": 10}, timeout=30).status_code == 400
        assert owner.post(f"{API}/admin/coupons", json={"code": "TEST BAD!", "discount_pct": 10}, timeout=30).status_code == 400
        assert owner.post(f"{API}/admin/coupons", json={"code": "TESTPCT1", "discount_pct": 99}, timeout=30).status_code == 422


# ---------- role management ----------
class TestRoles:
    def test_non_owner_forbidden(self, normal_user):
        assert normal_user.get(f"{API}/admin/users", timeout=30).status_code == 403
        assert normal_user.post(f"{API}/admin/set-role", json={"email": USER_EMAIL, "role": "admin"}, timeout=30).status_code == 403

    def test_owner_cannot_demote_self(self, owner):
        r = owner.post(f"{API}/admin/set-role", json={"email": OWNER_EMAIL, "role": "user"}, timeout=30)
        assert r.status_code == 400
        assert "super-owner" in r.json()["detail"].lower()

    def test_unknown_email_404(self, owner):
        r = owner.post(f"{API}/admin/set-role", json={"email": f"nobody_{uuid.uuid4().hex[:6]}@x.test", "role": "admin"}, timeout=30)
        assert r.status_code == 404

    def test_promote_and_demote(self, owner, normal_user):
        r = owner.post(f"{API}/admin/set-role", json={"email": USER_EMAIL, "role": "admin"}, timeout=30)
        assert r.status_code == 200, r.text[:300]
        assert r.json()["role"] == "admin"
        users = owner.get(f"{API}/admin/users", timeout=30).json()
        me = next((u for u in users if u["email"] == USER_EMAIL), None)
        assert me and me["role"] == "admin"
        # promoted user can now use admin endpoints
        assert normal_user.get(f"{API}/admin/coupons", timeout=30).status_code == 200
        # demote
        assert owner.post(f"{API}/admin/set-role", json={"email": USER_EMAIL, "role": "user"}, timeout=30).status_code == 200
        assert normal_user.get(f"{API}/admin/coupons", timeout=30).status_code == 403


# ---------- payments order (server-authoritative discount) ----------
class TestCreateOrderValidation:
    def test_invalid_coupon_rejected_at_order(self, normal_user):
        r = normal_user.post(f"{API}/payments/create-order", json={
            "amount_usd": 120, "package_name": "TEST_ Trial", "coupon_code": "BADCODE" + uuid.uuid4().hex[:5],
        }, timeout=45)
        assert r.status_code == 400, f"{r.status_code} {r.text[:300]}"

    def test_order_requires_auth(self):
        r = requests.post(f"{API}/payments/create-order", json={"amount_usd": 120, "package_name": "TEST_"}, timeout=30)
        assert r.status_code in (401, 403)
