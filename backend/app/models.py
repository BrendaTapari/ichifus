from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255))
    google_sub: Mapped[str | None] = mapped_column(String(64))
    terms_accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    first_name: Mapped[str | None] = mapped_column(String(80))
    last_name: Mapped[str | None] = mapped_column(String(80))

    pets: Mapped[list["Pet"]] = relationship(back_populates="owner")

    def full_name(self) -> str:
        name = " ".join(part for part in ((self.first_name or "").strip(), (self.last_name or "").strip()) if part)
        return name or self.email


class Pet(Base):
    __tablename__ = "pets"

    id: Mapped[int] = mapped_column(primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    species: Mapped[str] = mapped_column(String(80))
    breed: Mapped[str | None] = mapped_column(String(120))
    birth_date: Mapped[date | None] = mapped_column(Date)
    public_slug: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    emergency_contact: Mapped[str | None] = mapped_column(String(40))
    vet_contact: Mapped[str | None] = mapped_column(String(160))
    medical_notes: Mapped[str | None] = mapped_column(Text)
    avatar_filename: Mapped[str | None] = mapped_column(String(255))

    owner: Mapped[User] = relationship(back_populates="pets")
    members: Mapped[list["PetMember"]] = relationship(back_populates="pet", cascade="all, delete-orphan")
    invites: Mapped[list["CustodyInvite"]] = relationship(back_populates="pet", cascade="all, delete-orphan")
    events: Mapped[list["MedicalEvent"]] = relationship(
        back_populates="pet",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    photos: Mapped[list["PetPhoto"]] = relationship(
        back_populates="pet",
        cascade="all, delete-orphan",
        order_by="PetPhoto.id",
    )


class MedicalEvent(Base):
    __tablename__ = "medical_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(32))
    date: Mapped[date] = mapped_column(Date, index=True)
    weight: Mapped[float | None] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text)
    attachment_filename: Mapped[str | None] = mapped_column(String(255))

    pet: Mapped[Pet] = relationship(back_populates="events")
    photos: Mapped[list["EventPhoto"]] = relationship(
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="EventPhoto.id",
    )


class PetMember(Base):
    __tablename__ = "pet_members"
    __table_args__ = (UniqueConstraint("pet_id", "user_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(32))

    pet: Mapped[Pet] = relationship(back_populates="members")
    user: Mapped[User] = relationship()


class CustodyInvite(Base):
    __tablename__ = "custody_invites"

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    token: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    pet: Mapped[Pet] = relationship(back_populates="invites")
    creator: Mapped[User] = relationship()


class PetPhoto(Base):
    __tablename__ = "pet_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    pet_id: Mapped[int] = mapped_column(ForeignKey("pets.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255))

    pet: Mapped[Pet] = relationship(back_populates="photos")


class EventPhoto(Base):
    __tablename__ = "event_photos"

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("medical_events.id", ondelete="CASCADE"), index=True)
    filename: Mapped[str] = mapped_column(String(255))

    event: Mapped[MedicalEvent] = relationship(back_populates="photos")
