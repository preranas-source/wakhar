from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime

class DispatchTimelineEventBase(BaseModel):
    dispatch_note_id: int
    title: str
    subtitle: Optional[str] = None
    is_done: bool = False
    is_active: bool = False
    event_order: int
    event_date: Optional[datetime] = None

class DispatchTimelineEventCreate(DispatchTimelineEventBase):
    pass

class DispatchTimelineEventResponse(DispatchTimelineEventBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DispatchNoteBase(BaseModel):
    dn_code: str
    lot_id: int
    commodity_desc: str
    quantity_desc: str
    destination: str
    buyer_id: Optional[int] = None
    vehicle_reg: str
    traccar_device_id: Optional[str] = None
    fleetbase_order_id: Optional[str] = None
    status: str = "created"
    e_way_bill_no: Optional[str] = None
    delivery_pod_url: Optional[str] = None
    dispatch_date: datetime
    delivery_date: Optional[datetime] = None

class DispatchNoteCreate(DispatchNoteBase):
    pass

class DispatchNoteResponse(DispatchNoteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    timeline_events: List[DispatchTimelineEventResponse] = []
    model_config = ConfigDict(from_attributes=True)
