from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserResponse

router = APIRouter()


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register New User Account",
    tags=["Authentication"],
)
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
):
    """
    Registers a new user with email, password, and optional full name.
    Returns JWT access token and user profile.
    """
    normalized_email = user_in.email.strip().lower()
    
    # Check if user with given email already exists
    existing_user = db.scalar(select(User).where(User.email == normalized_email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Hash password and store new user record
    hashed_pwd = get_password_hash(user_in.password)
    new_user = User(
        email=normalized_email,
        hashed_password=hashed_pwd,
        full_name=user_in.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate JWT token
    access_token = create_access_token(subject=new_user.id)
    user_response = UserResponse.model_validate(new_user)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.post(
    "/login",
    response_model=Token,
    status_code=status.HTTP_200_OK,
    summary="User Login",
    tags=["Authentication"],
)
def login(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    """
    Authenticates user credentials and returns a JWT access token.
    """
    normalized_email = credentials.email.strip().lower()
    user = db.scalar(select(User).where(User.email == normalized_email))

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=user.id)
    user_response = UserResponse.model_validate(user)

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response,
    )


@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Authenticated User Profile",
    tags=["Authentication"],
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Returns profile information for the currently authenticated user.
    """
    return UserResponse.model_validate(current_user)
