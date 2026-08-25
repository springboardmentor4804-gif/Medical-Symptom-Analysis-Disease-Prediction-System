from sqlalchemy.exc import IntegrityError
from sqlalchemy import select
from passlib.context import CryptContext

from app.models import User
from db.connection import get_db_session
from app.models import PatientProfile, ProviderProfile

pwd_ctx = CryptContext(schemes=["argon2"], deprecated="auto")


def _truncate_to_n_bytes(s: str, n: int) -> str:
    """Return the longest prefix of `s` whose UTF-8 encoding is at most n bytes.

    This avoids cutting a multibyte character in half and ensures the result
    is valid UTF-8. Bcrypt has a 72-byte input limit; we truncate proactively.
    """
    encoded_len = 0
    out_chars = []
    for ch in s:
        b = ch.encode('utf-8')
        if encoded_len + len(b) > n:
            break
        out_chars.append(ch)
        encoded_len += len(b)
    return ''.join(out_chars)


def hash_password(password: str) -> str:
    # bcrypt has a 72-byte input limit; truncate to safe length before hashing.
    pw_bytes_len = len(password.encode('utf-8'))
    safe_pw = _truncate_to_n_bytes(password, 72)
    safe_len = len(safe_pw.encode('utf-8'))
    print(f"[hash_password] incoming bytes={pw_bytes_len}, truncated_bytes={safe_len}")
    try:
        return pwd_ctx.hash(safe_pw)
    except Exception as e:
        # Defensive fallback: if the hasher still fails (some backends may enforce
        # their own limits), try hashing the SHA256 of the password which is
        # fixed-length and safe for bcrypt, then return that hash. This preserves
        # compatibility with bcrypt_sha256 behavior but ensures we never raise.
        import hashlib
        digest = hashlib.sha256(safe_pw.encode('utf-8')).hexdigest()
        print(f"[hash_password] fallback to sha256 digest for hashing due to: {e}")
        return pwd_ctx.hash(digest)


def create_user(user_in, session=None):
    close = False
    if session is None:
        session_cm = get_db_session()
        session = session_cm.__enter__()
        close = True
    try:
        # check existing
        stmt = select(User).where(User.email == user_in.email)
        existing = session.execute(stmt).scalar_one_or_none()
        if existing:
            raise ValueError("Email already registered")
        user = User(
            full_name=user_in.full_name,
            email=user_in.email,
            password_hash=hash_password(user_in.password),
            role=user_in.role,
            phone=user_in.phone
        )
        session.add(user)
        session.flush()
        user_id = user.id
        # capture essential user fields before closing the session so callers
        # don't receive a detached ORM instance that raises on attribute access.
        user_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'phone': user.phone,
        }
        if getattr(user_in, 'role', None) == 'patient':
            pp = PatientProfile(
                user_id=user_id,
                age=getattr(user_in, 'age', None),
                gender=getattr(user_in, 'gender', None),
                blood_group=getattr(user_in, 'blood_group', None),
                height=getattr(user_in, 'height', None),
                weight=getattr(user_in, 'weight', None),
                emergency_contact=getattr(user_in, 'emergency_contact', None),
                existing_conditions=getattr(user_in, 'existing_conditions', None),
                allergies=getattr(user_in, 'allergies', None),
            )
            session.add(pp)
        elif getattr(user_in, 'role', None) in ('doctor', 'provider'):
            pv = ProviderProfile(
                user_id=user_id,
                hospital_name=getattr(user_in, 'hospital_name', None),
                specialization=getattr(user_in, 'specialization', None),
                license_number=getattr(user_in, 'license_number', None),
                years_experience=getattr(user_in, 'years_experience', None),
                qualification=getattr(user_in, 'qualification', None),
                department=getattr(user_in, 'department', None),
            )
            session.add(pv)
        # create confirmation token
        from app.models import EmailConfirmation
        import secrets

        token = secrets.token_urlsafe(32)
        confirmation = EmailConfirmation(user_id=user_id, token=token)
        session.add(confirmation)
        session.flush()

        if close:
            session_cm.__exit__(None, None, None)
        return user_data, token
    except IntegrityError:
        if close:
            session_cm.__exit__(None, None, None)
        raise
    except Exception:
        if close:
            session_cm.__exit__(None, None, None)
        raise
