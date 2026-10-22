from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Pet, PetMember, User


def member_role(db: Session, user: User, pet: Pet) -> str | None:
    member = db.scalar(select(PetMember).where(PetMember.pet_id == pet.id, PetMember.user_id == user.id))
    if member is not None:
        return member.role
    if pet.owner_id == user.id:
        return "owner"
    return None


def get_accessible_pet(db: Session, user: User, pet_id: int) -> tuple[Pet, str]:
    pet = db.get(Pet, pet_id)
    role = member_role(db, user, pet) if pet is not None else None
    if pet is None or role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mascota no encontrada")
    return pet, role


def get_owned_pet(db: Session, user: User, pet_id: int) -> Pet:
    pet, _role = get_accessible_pet(db, user, pet_id)
    return pet
