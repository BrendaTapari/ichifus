import re
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

_EMAIL = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not _EMAIL.fullmatch(cleaned):
            raise ValueError("El correo no es válido")
        return cleaned


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleLogin(BaseModel):
    credential: str = Field(min_length=20, max_length=8192)
    accept_terms: bool = False


class GoogleConfig(BaseModel):
    enabled: bool
    client_id: str | None = None


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=72)
    accept_terms: bool
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        cleaned = value.strip().lower()
        if not _EMAIL.fullmatch(cleaned):
            raise ValueError("El correo no es válido")
        return cleaned

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        cleaned = " ".join(value.split())
        if not cleaned:
            raise ValueError("Este campo es obligatorio")
        return cleaned

    @field_validator("accept_terms")
    @classmethod
    def must_accept_terms(cls, value: bool) -> bool:
        if value is not True:
            raise ValueError("Tenés que aceptar los términos y condiciones")
        return value


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None


class PetBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    species: str = Field(min_length=1, max_length=80)
    breed: str | None = Field(default=None, max_length=120)
    birth_date: date | None = None
    emergency_contact: str | None = Field(default=None, max_length=40)
    vet_contact: str | None = Field(default=None, max_length=160)
    medical_notes: str | None = Field(default=None, max_length=2000)

    @field_validator("name", "species")
    @classmethod
    def strip_required(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Este campo es obligatorio")
        return cleaned

    @field_validator("breed", "emergency_contact", "vet_contact", "medical_notes")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return _clean(value)

    @field_validator("birth_date")
    @classmethod
    def birth_not_future(cls, value: date | None) -> date | None:
        if value and value > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura")
        return value


class PetCreate(PetBase):
    pass


class PetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    species: str | None = Field(default=None, min_length=1, max_length=80)
    breed: str | None = Field(default=None, max_length=120)
    birth_date: date | None = None
    emergency_contact: str | None = Field(default=None, max_length=40)
    vet_contact: str | None = Field(default=None, max_length=160)
    medical_notes: str | None = Field(default=None, max_length=2000)

    @field_validator("name", "species")
    @classmethod
    def strip_required(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Este campo es obligatorio")
        return cleaned

    @field_validator("breed", "emergency_contact", "vet_contact", "medical_notes")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return _clean(value)

    @field_validator("birth_date")
    @classmethod
    def birth_not_future(cls, value: date | None) -> date | None:
        if value and value > date.today():
            raise ValueError("La fecha de nacimiento no puede ser futura")
        return value


class PhotoOut(BaseModel):
    id: int
    url: str


class PetOut(BaseModel):
    id: int
    name: str
    species: str
    breed: str | None
    birth_date: date | None
    public_slug: str
    emergency_contact: str | None
    vet_contact: str | None
    medical_notes: str | None
    avatar_url: str | None
    photos: list[PhotoOut] = []
    role: str


class CustodianOut(BaseModel):
    user_id: int
    email: str
    first_name: str | None = None
    last_name: str | None = None
    role: str


class InviteOut(BaseModel):
    token: str
    expires_at: datetime


class InvitePreview(BaseModel):
    pet_name: str
    species: str
    breed: str | None
    inviter_email: str
    inviter_name: str
    expires_at: datetime


class InviteAccept(BaseModel):
    pet_id: int


class InviteSession(BaseModel):
    access_token: str
    token_type: str = "bearer"
    pet_id: int


class RegisterInvite(RegisterRequest):
    pass


class PetPublic(BaseModel):
    name: str
    species: str
    breed: str | None
    birth_date: date | None
    emergency_contact: str | None
    vet_contact: str | None
    medical_notes: str | None
    avatar_url: str | None
    photo_urls: list[str] = []


class EventOut(BaseModel):
    id: int
    pet_id: int
    event_type: str
    date: date
    weight: float | None
    notes: str | None
    attachment_url: str | None
    attachment_urls: list[str] = []
