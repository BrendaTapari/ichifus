import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.access import get_accessible_pet
from app.database import get_db
from app.deps import get_current_user
from app.models import CustodyInvite, Pet, PetMember, User
from app.schemas import CustodianOut, InviteAccept, InviteOut, InvitePreview, InviteSession, RegisterInvite
from app.security import create_access_token, hash_password

router = APIRouter(tags=["custody"])
INVITE_DAYS = 14


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def active_invite(db: Session, pet_id: int) -> CustodyInvite | None:
    now = _now()
    invites = db.scalars(
        select(CustodyInvite)
        .where(CustodyInvite.pet_id == pet_id, CustodyInvite.revoked.is_(False))
        .order_by(CustodyInvite.id.desc())
    ).all()
    for invite in invites:
        if _as_utc(invite.expires_at) > now:
            return invite
    return None


def revoke_active(db: Session, pet_id: int) -> None:
    now = _now()
    invites = db.scalars(select(CustodyInvite).where(CustodyInvite.pet_id == pet_id, CustodyInvite.revoked.is_(False))).all()
    for invite in invites:
        if _as_utc(invite.expires_at) > now:
            invite.revoked = True


def load_invite(db: Session, token: str) -> CustodyInvite:
    invite = db.scalar(select(CustodyInvite).where(CustodyInvite.token == token))
    if invite is None or invite.revoked or _as_utc(invite.expires_at) <= _now():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La invitación no está disponible")
    return invite


def grant_custody(db: Session, pet_id: int, user: User) -> None:
    existing = db.scalar(select(PetMember).where(PetMember.pet_id == pet_id, PetMember.user_id == user.id))
    if existing is None:
        db.add(PetMember(pet_id=pet_id, user_id=user.id, role="caregiver"))


@router.post("/api/pets/{pet_id}/invitations", response_model=InviteOut)
def create_invitation(
    pet_id: int,
    rotate: bool = Query(False),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InviteOut:
    pet, _role = get_accessible_pet(db, user, pet_id)
    if not rotate:
        current = active_invite(db, pet.id)
        if current is not None:
            return InviteOut(token=current.token, expires_at=current.expires_at)
    revoke_active(db, pet.id)
    invite = CustodyInvite(
        pet_id=pet.id,
        token=secrets.token_urlsafe(24),
        created_by=user.id,
        created_at=_now(),
        expires_at=_now() + timedelta(days=INVITE_DAYS),
        revoked=False,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return InviteOut(token=invite.token, expires_at=invite.expires_at)


@router.get("/api/pets/{pet_id}/custodians", response_model=list[CustodianOut])
def list_custodians(
    pet_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CustodianOut]:
    pet, _role = get_accessible_pet(db, user, pet_id)
    rows = db.execute(
        select(PetMember, User)
        .join(User, User.id == PetMember.user_id)
        .where(PetMember.pet_id == pet.id)
        .order_by(PetMember.role.desc(), User.email)
    ).all()
    return [CustodianOut(user_id=member.user_id, email=account.email, first_name=account.first_name, last_name=account.last_name, role=member.role) for member, account in rows]


@router.delete("/api/pets/{pet_id}/custodians/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_custodian(
    pet_id: int,
    member_user_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    pet, role = get_accessible_pet(db, user, pet_id)
    if role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo el titular puede quitar una tenencia")
    if member_user_id == pet.owner_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No se puede quitar al titular")
    member = db.scalar(select(PetMember).where(PetMember.pet_id == pet.id, PetMember.user_id == member_user_id))
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Esa persona no comparte la tenencia")
    db.delete(member)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/api/invitations/{token}", response_model=InvitePreview)
def preview_invitation(token: str, db: Session = Depends(get_db)) -> InvitePreview:
    invite = load_invite(db, token)
    pet = db.get(Pet, invite.pet_id)
    creator = db.get(User, invite.created_by)
    if pet is None or creator is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="La invitación no está disponible")
    return InvitePreview(
        pet_name=pet.name,
        species=pet.species,
        breed=pet.breed,
        inviter_email=creator.email,
        inviter_name=creator.full_name(),
        expires_at=invite.expires_at,
    )


@router.post("/api/invitations/{token}/register", response_model=InviteSession, status_code=status.HTTP_201_CREATED)
def register_from_invitation(token: str, payload: RegisterInvite, db: Session = Depends(get_db)) -> InviteSession:
    invite = load_invite(db, token)
    exists = db.scalar(select(User).where(User.email == payload.email))
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ese correo ya tiene cuenta. Ingresá para aceptar la invitación.",
        )
    account = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        terms_accepted_at=datetime.now(timezone.utc),
        first_name=payload.first_name,
        last_name=payload.last_name,
    )
    db.add(account)
    db.flush()
    grant_custody(db, invite.pet_id, account)
    db.commit()
    return InviteSession(access_token=create_access_token(account.email), pet_id=invite.pet_id)


@router.post("/api/invitations/{token}/accept", response_model=InviteAccept)
def accept_invitation(
    token: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InviteAccept:
    invite = load_invite(db, token)
    grant_custody(db, invite.pet_id, user)
    db.commit()
    return InviteAccept(pet_id=invite.pet_id)
