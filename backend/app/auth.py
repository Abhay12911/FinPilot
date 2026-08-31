from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from starlette import status

from jose import jwt, JWTError
from pwdlib import PasswordHash

from app.database import get_db, settings
from app.models.user import User


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)



# JWT CONFIG


ALGORITHM = "HS256"

oauth2_bearer = OAuth2PasswordBearer(
    tokenUrl="auth/token"
)


# PASSWORD HASHING
password_hash = PasswordHash.recommended()


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    return password_hash.verify(password, hashed_password)

# REQUEST / RESPONSE MODELS

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str

db_dependency = Annotated[
    Session,
    Depends(get_db)
]

# AUTHENTICATE USER

def authenticate_user(
    email: str,
    password: str,
    db: Session
):
    user = db.query(User).filter(
        User.email == email
    ).first()

    if not user:
        return False

    if not verify_password(
        password,
        user.password_hash
    ):
        return False

    return user


# CREATE ACCESS TOKEN

def create_access_token(
    email: str,
    user_id: int,
    expires_delta: timedelta
):
    payload = {
        "sub": email,
        "id": user_id
    }

    expires = (
        datetime.now(timezone.utc)
        + expires_delta
    )

    payload.update({
        "exp": expires
    })

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=ALGORITHM
    )

# GET CURRENT USER

async def get_current_user(
    token: Annotated[
        str,
        Depends(oauth2_bearer)
    ]
):
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")
        user_id = payload.get("id")

        if email is None or user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate user."
            )

        return {
            "email": email,
            "id": user_id
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate user."
        )

# REGISTER


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED
)
async def create_user(
    create_user_request: CreateUserRequest,
    db: db_dependency
):

    # Check if email already exists
    existing_user = db.query(User).filter(
        User.email == create_user_request.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(
        create_user_request.password
    )

    # Create user
    create_user_model = User(
        email=create_user_request.email,
        password_hash=hashed_password
    )

    # Save user
    db.add(create_user_model)
    db.commit()
    db.refresh(create_user_model)

    return {
        "message": "User created successfully",
        "user": {
            "id": create_user_model.id,
            "email": create_user_model.email
        }
    }



# LOGIN


@router.post(
    "/token",
    response_model=Token
)
async def login_for_access_token(
    form_data: Annotated[
        OAuth2PasswordRequestForm,
        Depends()
    ],
    db: db_dependency
):

    user = authenticate_user(
        form_data.username,
        form_data.password,
        db
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    token = create_access_token(
        user.email,
        user.id,
        timedelta(minutes=30)
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }

# CURRENT USER


@router.get("/me")
async def get_me(
    current_user: Annotated[
        dict,
        Depends(get_current_user)
    ]
):
    return current_user
