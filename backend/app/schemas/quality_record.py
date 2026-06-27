from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class QualityRecordBase(BaseModel):
    qc_code: str
    lot_id: int
    moisture_pct: float
    foreign_matter_pct: Optional[float] = None
    broken_grain_pct: Optional[float] = None
    protein_pct: Optional[float] = None
    grade_awarded: str
    inspected_by: int
    inspection_date: datetime
    certificate_url: Optional[str] = None
    remarks: Optional[str] = None

class QualityRecordCreate(QualityRecordBase):
    client_timestamp: Optional[datetime] = None

class QualityRecordResponse(QualityRecordBase):
    id: int
    created_at: datetime
    inspector_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)
