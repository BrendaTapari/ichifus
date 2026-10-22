from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Pet, PetPhoto
from app.schemas import PetPublic
from app.storage import upload_url

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/pets/{public_slug}", response_model=PetPublic)
def public_pet(public_slug: str, db: Session = Depends(get_db)) -> PetPublic:
    pet = db.scalar(select(Pet).where(Pet.public_slug == public_slug))
    if pet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ficha no encontrada")
    return PetPublic(
        name=pet.name,
        species=pet.species,
        breed=pet.breed,
        birth_date=pet.birth_date,
        emergency_contact=pet.emergency_contact,
        vet_contact=pet.vet_contact,
        medical_notes=pet.medical_notes,
        avatar_url=upload_url(pet.avatar_filename),
        photo_urls=[
            url
            for url in (
                upload_url(photo.filename)
                for photo in db.scalars(select(PetPhoto).where(PetPhoto.pet_id == pet.id).order_by(PetPhoto.id)).all()
            )
            if url
        ],
    )
