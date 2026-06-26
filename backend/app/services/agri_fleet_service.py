import os
import requests
import logging
from app.database import SessionLocal
from app.models import DispatchNote, CommodityLot, Warehouse, StockTransfer

logger = logging.getLogger(__name__)

AGRI_FLEET_URL = os.getenv("AGRI_FLEET_URL", "http://127.0.0.1:8080").rstrip("/")
AGRI_FLEET_API_KEY = os.getenv("AGRI_FLEET_API_KEY")
AGRI_FLEET_API_SECRET = os.getenv("AGRI_FLEET_API_SECRET")

def create_dispatch_order(dispatch_note_id: int):
    """
    Creates a WMS Transport Request in Agri Fleet via REST API (Workflow A).
    """
    if not AGRI_FLEET_API_KEY or not AGRI_FLEET_API_SECRET:
        logger.warning("Agri Fleet API credentials not configured. Skipping dispatch creation.")
        return False

    with SessionLocal() as db:
        dispatch_note = db.query(DispatchNote).filter(DispatchNote.id == dispatch_note_id).first()
        if not dispatch_note:
            logger.error(f"DispatchNote {dispatch_note_id} not found.")
            return False
        
        lot = db.query(CommodityLot).filter(CommodityLot.id == dispatch_note.lot_id).first()
        warehouse = db.query(Warehouse).filter(Warehouse.id == lot.warehouse_id).first() if lot else None

        if not warehouse:
            logger.error(f"Warehouse not found for DispatchNote {dispatch_note_id}.")
            return False

        url = f"{AGRI_FLEET_URL}/api/resource/WMS Transport Request"
        
        headers = {
            "Authorization": f"token {AGRI_FLEET_API_KEY}:{AGRI_FLEET_API_SECRET}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Host": "agrifleet.local"
        }
        
        payload = {
            "wms_dispatch_id": str(dispatch_note.id),
            "commodity": dispatch_note.commodity_desc,
            "quantity_mt": float(dispatch_note.dispatch_quantity_kg) / 1000.0,
            "source_name": warehouse.name,
            "source_lat": float(warehouse.geo_lat) if warehouse.geo_lat else None,
            "source_lng": float(warehouse.geo_lng) if warehouse.geo_lng else None,
            "destination_address": dispatch_note.destination,
            "destination_name": dispatch_note.destination.split(",")[0].strip() if dispatch_note.destination else "WMS Destination",
            "destination_lat": float(dispatch_note.destination_lat) if dispatch_note.destination_lat else None,
            "destination_lng": float(dispatch_note.destination_lng) if dispatch_note.destination_lng else None,
            "requested_date": dispatch_note.dispatch_date.isoformat() if dispatch_note.dispatch_date else None,
            "status": "Pending Assignment"
        }
        
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code in [200, 201]:
            data = response.json().get("data", {})
            logger.info(f"Successfully created WMS Transport Request: {data.get('name')}")
            return True
        else:
            logger.error(f"Failed to create WMS Transport Request. Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        logger.exception("Error connecting to Agri Fleet API")
        return False


def create_transfer_order(transfer_id: int):
    """
    Creates a WMS Transport Request in Agri Fleet for an internal stock transfer (Workflow A).
    """
    if not AGRI_FLEET_API_KEY or not AGRI_FLEET_API_SECRET:
        logger.warning("Agri Fleet API credentials not configured. Skipping transfer creation.")
        return False

    with SessionLocal() as db:
        transfer = db.query(StockTransfer).filter(StockTransfer.id == transfer_id).first()
        if not transfer:
            logger.error(f"StockTransfer {transfer_id} not found.")
            return False
        
        lot = db.query(CommodityLot).filter(CommodityLot.id == transfer.lot_id).first()
        src_warehouse = db.query(Warehouse).filter(Warehouse.id == transfer.source_warehouse_id).first()
        dest_warehouse = db.query(Warehouse).filter(Warehouse.id == transfer.destination_warehouse_id).first()

        if not src_warehouse or not dest_warehouse:
            logger.error(f"Source or Destination Warehouse not found for StockTransfer {transfer_id}.")
            return False

        url = f"{AGRI_FLEET_URL}/api/resource/WMS Transport Request"
        
        headers = {
            "Authorization": f"token {AGRI_FLEET_API_KEY}:{AGRI_FLEET_API_SECRET}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Host": "agrifleet.local"
        }
        
        commodity_desc = f"{lot.commodity.name} ({lot.variety})" if lot and lot.commodity else "Unknown Commodity"
        dest_address = dest_warehouse.address or dest_warehouse.name

        payload = {
            "wms_dispatch_id": f"TRF-{transfer.id}",
            "commodity": commodity_desc,
            "quantity_mt": float(transfer.quantity_kg) / 1000.0,
            "source_name": src_warehouse.name,
            "source_lat": float(src_warehouse.geo_lat) if src_warehouse.geo_lat else None,
            "source_lng": float(src_warehouse.geo_lng) if src_warehouse.geo_lng else None,
            "destination_name": dest_warehouse.name,
            "destination_address": dest_address,
            "destination_lat": float(dest_warehouse.geo_lat) if dest_warehouse.geo_lat else None,
            "destination_lng": float(dest_warehouse.geo_lng) if dest_warehouse.geo_lng else None,
            "requested_date": transfer.dispatch_date.isoformat() if transfer.dispatch_date else None,
            "status": "Pending Assignment"
        }
        
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code in [200, 201]:
            data = response.json().get("data", {})
            logger.info(f"Successfully created WMS Transport Request for Transfer: {data.get('name')}")
            return True
        else:
            logger.error(f"Failed to create WMS Transport Request for Transfer. Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        logger.exception("Error connecting to Agri Fleet API")
        return False
