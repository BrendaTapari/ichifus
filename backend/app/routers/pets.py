import secrets

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.access import get_accessible_pet
from app.database import get_db
from app.deps import get_current_user
from app.models import EventPhoto, MedicalEvent, Pet, PetMember, PetPhoto, User
from app.schemas import PetCreate, PetOut, PetUpdate, PhotoOut
from app.storage import delete_file, save_uploads, upload_url

router = APIRouter(prefix="/api/pets", tags=["pets"])


def _unique_slug(db: Session) -> str:
    for _ in range(5):
        slug = secrets.token_urlsafe(6)
        if db.scalar(select(Pet.id).where(Pet.public_slug == slug)) is None:
            return slug
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="No se pudo generar el identificador público")


PHOTO_LIMIT = 12


def photos_for(db: Session, pet_id: int) -> list[PetPhoto]:
    return list(db.scalars(select(PetPhoto).where(PetPhoto.pet_id == pet_id).order_by(PetPhoto.id)).all())


def pet_out(db: Session, pet: Pet, role: str) -> PetOut:
    photos = photos_for(db, pet.id)
    return PetOut(
        id=pet.id,
        name=pet.name,
        species=pet.species,
        breed=pet.breed,
        birth_date=pet.birth_date,
        public_slug=pet.public_slug,
        emergency_contact=pet.emergency_contact,
        vet_contact=pet.vet_contact,
        medical_notes=pet.medical_notes,
        avatar_url=upload_url(pet.avatar_filename),
        photos=[PhotoOut(id=photo.id, url=upload_url(photo.filename) or "") for photo in photos],
        role=role,
    )


def add_pet_photos(db: Session, pet: Pet, uploads: list[UploadFile]) -> list[str]:
    saved = save_uploads(uploads, 8)
    if not saved:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Elegí al menos una imagen")
    if len(photos_for(db, pet.id)) + len(saved) > PHOTO_LIMIT:
        for name in saved:
            delete_file(name)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La ficha admite hasta 12 fotos")
    for name in saved:
        db.add(PetPhoto(pet_id=pet.id, filename=name))
    if pet.avatar_filename is None:
        pet.avatar_filename = saved[0]
    return saved


@router.get("", response_model=list[PetOut])
def list_pets(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[PetOut]:
    rows = db.execute(
        select(Pet, PetMember.role)
        .join(PetMember, PetMember.pet_id == Pet.id)
        .where(PetMember.user_id == user.id)
        .order_by(Pet.name)
    ).all()
    return [pet_out(db, pet, role) for pet, role in rows]


@router.post("", response_model=PetOut, status_code=status.HTTP_201_CREATED)
def create_pet(payload: PetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PetOut:
    pet = Pet(owner_id=user.id, public_slug=_unique_slug(db), **payload.model_dump())
    db.add(pet)
    db.flush()
    db.add(PetMember(pet_id=pet.id, user_id=user.id, role="owner"))
    db.commit()
    db.refresh(pet)
    return pet_out(db, pet, "owner")


@router.get("/{pet_id}", response_model=PetOut)
def get_pet(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    return pet_out(db, pet, role)


@router.patch("/{pet_id}", response_model=PetOut)
def update_pet(
    pet_id: int,
    payload: PetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(pet, key, value)
    db.commit()
    db.refresh(pet)
    return pet_out(db, pet, role)


@router.post("/{pet_id}/avatar", response_model=PetOut)
def upload_avatar(
    pet_id: int,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    saved = add_pet_photos(db, pet, [file])
    pet.avatar_filename = saved[-1]
    db.commit()
    db.refresh(pet)
    return pet_out(db, pet, role)


@router.post("/{pet_id}/photos", response_model=PetOut)
def add_photos(
    pet_id: int,
    files: list[UploadFile] = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    add_pet_photos(db, pet, files)
    db.commit()
    db.refresh(pet)
    return pet_out(db, pet, role)


@router.post("/{pet_id}/photos/{photo_id}/cover", response_model=PetOut)
def set_cover(
    pet_id: int,
    photo_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    photo = db.scalar(select(PetPhoto).where(PetPhoto.id == photo_id, PetPhoto.pet_id == pet.id))
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")
    pet.avatar_filename = photo.filename
    db.commit()
    db.refresh(pet)
    return pet_out(db, pet, role)


@router.delete("/{pet_id}/photos/{photo_id}", response_model=PetOut)
def delete_photo(
    pet_id: int,
    photo_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PetOut:
    pet, role = get_accessible_pet(db, user, pet_id)
    photo = db.scalar(select(PetPhoto).where(PetPhoto.id == photo_id, PetPhoto.pet_id == pet.id))
    if photo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foto no encontrada")
    filename = photo.filename
    db.delete(photo)
    db.flush()
    if pet.avatar_filename == filename:
        remaining = photos_for(db, pet.id)
        pet.avatar_filename = remaining[0].filename if remaining else None
    db.commit()
    db.refresh(pet)
    delete_file(filename)
    return pet_out(db, pet, role)


@router.delete("/{pet_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pet(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    pet, role = get_accessible_pet(db, user, pet_id)
    if role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo quien creó la ficha puede eliminarla")
    events = db.scalars(select(MedicalEvent).where(MedicalEvent.pet_id == pet.id)).all()
    event_ids = [event.id for event in events]
    event_photos = (
        db.scalars(select(EventPhoto).where(EventPhoto.event_id.in_(event_ids))).all() if event_ids else []
    )
    filenames = [
        pet.avatar_filename,
        *[photo.filename for photo in photos_for(db, pet.id)],
        *[event.attachment_filename for event in events],
        *[photo.filename for photo in event_photos],
    ]
    db.delete(pet)
    db.commit()
    for filename in filenames:
        delete_file(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
