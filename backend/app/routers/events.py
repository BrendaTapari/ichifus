from datetime import date as date_type, timedelta

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.access import get_owned_pet
from app.database import get_db
from app.deps import get_current_user
from app.models import EventPhoto, MedicalEvent, PetMember, User
from app.schemas import EventOut
from app.storage import delete_file, save_uploads, upload_url

router = APIRouter(tags=["events"])

EVENT_TYPES = {"vaccine", "deworming", "surgery", "consultation"}


EVENT_PHOTO_LIMIT = 6


def event_out(db: Session, event: MedicalEvent) -> EventOut:
    photos = db.scalars(select(EventPhoto).where(EventPhoto.event_id == event.id).order_by(EventPhoto.id)).all()
    urls = [url for url in (upload_url(photo.filename) for photo in photos) if url]
    legacy = upload_url(event.attachment_filename)
    if legacy and legacy not in urls:
        urls.insert(0, legacy)
    return EventOut(
        id=event.id,
        pet_id=event.pet_id,
        event_type=event.event_type,
        date=event.date,
        weight=event.weight,
        notes=event.notes,
        attachment_url=urls[0] if urls else None,
        attachment_urls=urls,
    )


@router.get("/api/pets/{pet_id}/events", response_model=list[EventOut])
def list_events(pet_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[EventOut]:
    pet = get_owned_pet(db, user, pet_id)
    events = db.scalars(
        select(MedicalEvent).where(MedicalEvent.pet_id == pet.id).order_by(MedicalEvent.date.desc(), MedicalEvent.id.desc())
    ).all()
    return [event_out(db, event) for event in events]


@router.post("/api/pets/{pet_id}/events", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create_event(
    pet_id: int,
    event_type: str = Form(...),
    date: date_type = Form(...),
    weight: float | None = Form(None),
    notes: str | None = Form(None),
    files: list[UploadFile] | None = File(None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EventOut:
    pet = get_owned_pet(db, user, pet_id)
    event_type = event_type.strip()
    if event_type not in EVENT_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tipo de evento inválido")
    if date.year < 1990 or date > date_type.today() + timedelta(days=1):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La fecha del evento no es válida")
    if weight is not None and (weight <= 0 or weight > 500):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El peso debe ser mayor a 0 y menor a 500 kg")
    cleaned_notes = notes.strip() if notes else None
    if cleaned_notes and len(cleaned_notes) > 4000:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Las notas son demasiado largas")

    saved = save_uploads(files or [], EVENT_PHOTO_LIMIT)
    event = MedicalEvent(
        pet_id=pet.id,
        event_type=event_type,
        date=date,
        weight=weight,
        notes=cleaned_notes or None,
        attachment_filename=saved[0] if saved else None,
    )
    db.add(event)
    db.flush()
    for name in saved:
        db.add(EventPhoto(event_id=event.id, filename=name))
    db.commit()
    db.refresh(event)
    return event_out(db, event)


@router.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(event_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Response:
    event = db.scalar(
        select(MedicalEvent)
        .join(PetMember, PetMember.pet_id == MedicalEvent.pet_id)
        .where(MedicalEvent.id == event_id, PetMember.user_id == user.id)
    )
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evento no encontrado")
    filenames = [event.attachment_filename, *[photo.filename for photo in event.photos]]
    db.delete(event)
    db.commit()
    for filename in filenames:
        delete_file(filename)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
