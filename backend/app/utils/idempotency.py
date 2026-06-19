from fastapi import Request, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.idempotency import IdempotencyRecord
from fastapi.responses import JSONResponse
import json
from typing import Optional

def get_idempotency_key(request: Request) -> Optional[str]:
    """Extract the Idempotency-Key header from the request."""
    return request.headers.get("Idempotency-Key") or request.headers.get("idempotency-key")

def check_idempotency(key: Optional[str], db: Session) -> Optional[JSONResponse]:
    """Check if an idempotency key has already been processed.
    Returns the stored response if found, None otherwise."""
    if not key:
        return None
    record = db.query(IdempotencyRecord).filter(IdempotencyRecord.key == key).first()
    if record:
        return JSONResponse(
            status_code=record.response_status,
            content=json.loads(record.response_body)
        )
    return None

def store_idempotency(key: Optional[str], status_code: int, response_body: dict, db: Session) -> None:
    """Store a response for an idempotency key."""
    if not key:
        return
    record = IdempotencyRecord(
        key=key,
        response_status=status_code,
        response_body=json.dumps(response_body, default=str)
    )
    db.add(record)
    db.commit()
