import jwt
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from jwt import PyJWKClient
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import GoogleConfig, GoogleLogin, LoginRequest, RegisterRequest, Token, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])
_google_certs = PyJWKClient("https://www.googleapis.com/oauth2/v3/certs")


def _google_client_id() -> str:
    return settings.GOOGLE_CLIENT_ID.strip()


def _google_names(info: dict) -> tuple[str | None, str | None]:
    def clean(value: object) -> str | None:
        text = " ".join(str(value or "").split())
        return text[:80] or None

    given = clean(info.get("given_name"))
    family = clean(info.get("family_name"))
    if given or family:
        return given, family
    full = clean(info.get("name"))
    if not full:
        return None, None
    if " " not in full:
        return full, None
    first, last = full.split(" ", 1)
    return first, last


@router.get("/google/config", response_model=GoogleConfig)
def google_config() -> GoogleConfig:
    client_id = _google_client_id()
    return GoogleConfig(enabled=bool(client_id), client_id=client_id or None)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is not None and user.google_sub and not user.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Esta cuenta entra con Google")
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales incorrectas")
    return Token(access_token=create_access_token(user.email))


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> Token:
    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None and existing.google_sub and not existing.hashed_password:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo entra con Google")
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo ya tiene cuenta")
    user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        terms_accepted_at=datetime.now(timezone.utc),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo ya tiene cuenta") from exc
    db.refresh(user)
    return Token(access_token=create_access_token(user.email))


@router.post("/google", response_model=Token)
def google_login(payload: GoogleLogin, db: Session = Depends(get_db)) -> Token:
    client_id = _google_client_id()
    if not client_id:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="El acceso con Google no está configurado")
    try:
        signing_key = _google_certs.get_signing_key_from_jwt(payload.credential)
        info = jwt.decode(
            payload.credential,
            signing_key.key,
            algorithms=["RS256"],
            audience=client_id,
            issuer=["accounts.google.com", "https://accounts.google.com"],
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudo validar la cuenta de Google") from exc
    if info.get("email_verified") is not True:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google no confirmó el correo")
    email = str(info.get("email") or "").strip().lower()
    sub = str(info.get("sub") or "")
    if not email or not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google no envió el correo")
    given_name, family_name = _google_names(info)

    user = db.scalar(select(User).where(User.google_sub == sub))
    if user is None:
        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            if not payload.accept_terms:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Tenés que aceptar los términos y condiciones para crear la cuenta",
                )
            user = User(
                email=email,
                hashed_password=None,
                google_sub=sub,
                terms_accepted_at=datetime.now(timezone.utc),
                first_name=given_name,
                last_name=family_name,
            )
            db.add(user)
        elif user.google_sub and user.google_sub != sub:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ese correo ya está vinculado a otra cuenta de Google")
        else:
            user.google_sub = sub
            if not user.first_name and given_name:
                user.first_name = given_name
            if not user.last_name and family_name:
                user.last_name = family_name
    else:
        if not user.first_name and given_name:
            user.first_name = given_name
        if not user.last_name and family_name:
            user.last_name = family_name
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Esa cuenta de Google ya está en uso") from exc
    db.refresh(user)
    return Token(access_token=create_access_token(user.email))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(id=user.id, email=user.email, first_name=user.first_name, last_name=user.last_name)
