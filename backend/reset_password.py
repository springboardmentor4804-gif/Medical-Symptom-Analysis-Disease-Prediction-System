#!/usr/bin/env python
"""
Reset a user's password directly against the database.

MedAssist has no self-service password reset (no mail transport is configured),
so a forgotten password otherwise means the account is unreachable. This is the
operator's way back in.

    python backend/reset_password.py --list
    python backend/reset_password.py user@example.com
    python backend/reset_password.py user@example.com --password 'NewPassw0rd'

With no --password, one is generated and printed. Passwords are hashed with the
same passlib context the API uses, so nothing here can produce a hash the login
endpoint will not accept.

Run it from the machine hosting the database. It deliberately has no HTTP
surface - a reachable endpoint that rewrites any password is a far bigger
liability than an inconvenient CLI.
"""

from __future__ import annotations

import argparse
import secrets
import sys
import warnings
from pathlib import Path

# passlib 1.7.4 probes bcrypt.__about__, which bcrypt 4.x removed. The probe is
# caught internally and hashing works, but it prints an alarming traceback.
warnings.filterwarnings("ignore")

sys.path.insert(0, str(Path(__file__).resolve().parent))

from auth import MIN_PASSWORD_LENGTH, hash_password   # noqa: E402
from database import SessionLocal, User               # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("email", nargs="?", help="account to reset")
    ap.add_argument("--password", help="new password (generated if omitted)")
    ap.add_argument("--list", action="store_true", help="list accounts and exit")
    args = ap.parse_args()

    db = SessionLocal()
    try:
        if args.list or not args.email:
            users = db.query(User).order_by(User.id).all()
            if not users:
                print("No accounts in this database.")
                return 0
            print(f"{'id':<4} {'email':<40} {'role':<12} active")
            for u in users:
                print(f"{u.id:<4} {u.email:<40} {u.role:<12} {bool(u.is_active)}")
            if not args.email:
                print("\nPass an email to reset that account's password.")
            return 0

        user = db.query(User).filter(User.email == args.email).first()
        if user is None:
            print(f"No account with email {args.email!r}. "
                  f"Run with --list to see what exists.")
            return 1

        password = args.password or secrets.token_urlsafe(12)
        if len(password) < MIN_PASSWORD_LENGTH:
            print(f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
            return 1

        user.password_hash = hash_password(password)
        # A deactivated account still cannot log in after a reset, which looks
        # identical to a failed reset from the login screen. Say so.
        db.commit()

        print(f"Password reset for {user.email} (role={user.role}).")
        print(f"  new password: {password}")
        if not user.is_active:
            print("  WARNING: this account is deactivated and still cannot log "
                  "in. An admin must reactivate it via /admin/users.")
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    sys.exit(main())
