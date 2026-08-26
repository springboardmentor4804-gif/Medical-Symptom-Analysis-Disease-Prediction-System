from fastapi import APIRouter, HTTPException, Depends
from passlib.context import CryptContext

from app.database import get_database_connection
from app.schemas import UserRegister

from datetime import datetime, timedelta, timezone

from jose import jwt,JWTError
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer

oauth2_scheme=OAuth2PasswordBearer(
    tokenUrl="/auth/login"
)

## read current user
def get_current_user(
    token: str = Depends(oauth2_scheme)
):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication token"
            )

        return {
            "user_id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role")
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token"
        )

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


#patient authentication
def require_patient(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "patient":
        raise HTTPException(
            status_code=403,
            detail="Patient access required"
        )

    return current_user

# Caretaker authentication
def require_caretaker(
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "caretaker":
        raise HTTPException(
            status_code=403,
            detail="Caretaker access required"
        )

    return current_user


SECRET_KEY="medassist-ai-secret-key-change-later"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30


@router.post("/register")
def register_user(user: UserRegister):

    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id FROM users WHERE email = %s",
        (user.email,)
    )

    existing_user = cursor.fetchone()

    if existing_user:
        cursor.close()
        connection.close()

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    password_hash = pwd_context.hash(user.password)

    cursor.execute(
        """
        INSERT INTO users
        (full_name, email, password_hash, role)
        VALUES (%s, %s, %s, %s)
        RETURNING id, full_name, email, role
        """,
        (
            user.full_name,
            user.email,
            password_hash,
            user.role
        )
    )

    new_user = cursor.fetchone()

    connection.commit()

    cursor.close()
    connection.close()

    return {
        "message": "User registered successfully",
        "user": {
            "id": new_user[0],
            "full_name": new_user[1],
            "email": new_user[2],
            "role": new_user[3]
        }
    }



@router.post("/login")
def login_user(
    form_data: OAuth2PasswordRequestForm = Depends()
):
    connection = get_database_connection()
    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT id, full_name, email, password_hash, role
        FROM users
        WHERE email = %s
        """,
        (form_data.username,)
    )

    user = cursor.fetchone()

    cursor.close()
    connection.close()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_is_valid = pwd_context.verify(
        form_data.password,
        user[3]
    )

    if not password_is_valid:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token_data = {
        "sub": str(user[0]),
        "email": user[2],
        "role": user[4],
        "exp": datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }

    access_token = jwt.encode(
        access_token_data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user[0],
            "full_name": user[1],
            "email": user[2],
            "role": user[4]
        }
    }


@router.get("/me")
def get_my_profile(
    current_user: dict = Depends(get_current_user)
):
    return {
        "message": "Authentication successful",
        "user": current_user
    }


@router.get("/patient-only")
def patient_only_endpoint(
    current_user: dict = Depends(require_patient)
):
    return {
        "message": "You have access to the patient area",
        "user": current_user
    }

@router.get("/caretaker-only")
def caretaker_only_endpoint(
    current_user: dict = Depends(require_caretaker)
):
    return {
        "message": "You have access to the caretaker area",
        "user": current_user
    }