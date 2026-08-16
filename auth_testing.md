# Auth + Payments Testing Playbook

## Auth endpoints (all under /api)
- POST /api/auth/register {name, email, password} — bcrypt hash, sets access_token + refresh_token httpOnly cookies
- POST /api/auth/login {email, password} — 5 failed attempts / 15 min lockout via login_attempts collection
- POST /api/auth/logout — clears cookies + deletes Google session
- GET /api/auth/me — unified: Google session_token cookie OR JWT access_token cookie/Bearer
- POST /api/auth/refresh — refresh_token cookie → new access_token
- POST /api/auth/google/session — header X-Session-ID → exchanges with Emergent OAuth session-data, sets session_token cookie

## Payments (auth required)
- POST /api/payments/create-order {amount_rupees} → Razorpay order (paise), stored in db.payments
- POST /api/payments/verify {razorpay_order_id, razorpay_payment_id, razorpay_signature} → HMAC verify, marks paid
- GET /api/payments → paid payments, emails masked (public, for /dashboard)

## Quick tests
```
# register + session check
curl -c /tmp/cj -X POST $API/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"t@t.co","password":"Test@12345"}'
curl -b /tmp/cj $API/api/auth/me
# order (needs auth cookie)
curl -b /tmp/cj -X POST $API/api/payments/create-order -H "Content-Type: application/json" -d '{"amount_rupees": 499}'
```

## Mongo checks
- db.users: custom user_id field, bcrypt password_hash ($2b$...), unique index on email
- db.user_sessions: session_token + expires_at (7 days)
- db.payments: order_id, status created|paid
