import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models import DispatchNote, DispatchStatus

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://wakhar:wakhar123@localhost/wakharwms")
engine = create_engine(DATABASE_URL)

try:
    with Session(engine) as session:
        # Simulate inserting a dispatch note
        dn = DispatchNote(
            dn_code="DN-2026-9999",
            lot_id=20,  # existing onion lot ID
            commodity_desc="Onion (Nasik Red)",
            quantity_desc="40 bags / 400.00 kg",
            destination="Pune Market",
            vehicle_reg="MH-12-PQ-9999",
            status=DispatchStatus.created,
            dispatch_date=datetime.now()
        )
        session.add(dn)
        session.commit()
        print("Insert succeeded!")
except Exception as e:
    import traceback
    traceback.print_exc()
