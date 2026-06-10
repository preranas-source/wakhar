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
    pass

class QualityRecordResponse(QualityRecordBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
