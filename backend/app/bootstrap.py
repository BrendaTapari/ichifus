import logging
import time

from sqlalchemy import select, text

from app.config import settings
from app.database import Base, SessionLocal, engine
from app.models import EventPhoto, MedicalEvent, Pet, PetMember, PetPhoto, User
from app.security import hash_password
from app.storage import upload_dir

logger = logging.getLogger("vethistoria")


def seed_admin() -> None:
    email = settings.ADMIN_EMAIL.strip().lower()
    if not email or not settings.ADMIN_PASSWORD:
        logger.warning("ADMIN_EMAIL o ADMIN_PASSWORD vacíos: no se creó un usuario inicial")
        return
    db = SessionLocal()
    try:
        exists = db.scalar(select(User).where(User.email == email))
        if exists:
            return
        db.add(User(email=email, hashed_password=hash_password(settings.ADMIN_PASSWORD)))
        db.commit()
        logger.info("Usuario inicial creado: %s", email)
    finally:
        db.close()


def backfill_members() -> None:
    db = SessionLocal()
    try:
        pets = db.scalars(select(Pet)).all()
        for pet in pets:
            exists = db.scalar(select(PetMember.id).where(PetMember.pet_id == pet.id, PetMember.user_id == pet.owner_id))
            if exists is None:
                db.add(PetMember(pet_id=pet.id, user_id=pet.owner_id, role="owner"))
        db.commit()
    finally:
        db.close()


def backfill_photos() -> None:
    db = SessionLocal()
    try:
        pets = db.scalars(select(Pet)).all()
        for pet in pets:
            if not pet.avatar_filename:
                continue
            exists = db.scalar(
                select(PetPhoto.id).where(PetPhoto.pet_id == pet.id, PetPhoto.filename == pet.avatar_filename)
            )
            if exists is None:
                db.add(PetPhoto(pet_id=pet.id, filename=pet.avatar_filename))
        events = db.scalars(select(MedicalEvent).where(MedicalEvent.attachment_filename.is_not(None))).all()
        for event in events:
            if not event.attachment_filename:
                continue
            exists = db.scalar(
                select(EventPhoto.id).where(
                    EventPhoto.event_id == event.id,
                    EventPhoto.filename == event.attachment_filename,
                )
            )
            if exists is None:
                db.add(EventPhoto(event_id=event.id, filename=event.attachment_filename))
        db.commit()
    finally:
        db.close()


def ensure_user_columns() -> None:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_sub VARCHAR(64)"))
        conn.execute(text("ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL"))
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL")
        )
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(80)"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(80)"))


def init_db() -> None:
    upload_dir()
    last_error: Exception | None = None
    for _ in range(15):
        try:
            Base.metadata.create_all(bind=engine)
            ensure_user_columns()
            seed_admin()
            backfill_members()
            backfill_photos()
            return
        except Exception as exc:
            last_error = exc
            logger.warning("Base de datos no disponible, reintentando: %s", exc)
            time.sleep(2)
    raise RuntimeError("No se pudo inicializar la base de datos") from last_error
