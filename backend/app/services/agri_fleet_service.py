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

        # Resolve destination lat/lng: use stored values first, then try to match a warehouse by name
        dest_lat = float(dispatch_note.destination_lat) if dispatch_note.destination_lat else None
        dest_lng = float(dispatch_note.destination_lng) if dispatch_note.destination_lng else None

        if dest_lat is None or dest_lng is None:
            # Try to find a warehouse whose name appears in the destination string
            dest_str = (dispatch_note.destination or "").lower()
            dest_wh = None
            for wh in db.query(Warehouse).all():
                if wh.name and wh.name.lower() in dest_str:
                    dest_wh = wh
                    break
                if wh.address and wh.address.lower() in dest_str:
                    dest_wh = wh
                    break
                # Also check if the destination contains any significant part of the warehouse address
                if wh.address:
                    # Match by city/town name (first significant word in address)
                    addr_parts = [p.strip().lower() for p in wh.address.split(',')]
                    for part in addr_parts:
                        if len(part) > 3 and part in dest_str:
                            dest_wh = wh
                            break
                if dest_wh:
                    break
            if dest_wh:
                dest_lat = float(dest_wh.geo_lat) if dest_wh.geo_lat else None
                dest_lng = float(dest_wh.geo_lng) if dest_wh.geo_lng else None
                logger.info(f"Resolved destination coords from warehouse '{dest_wh.name}' for DispatchNote {dispatch_note_id}")

        url = f"{AGRI_FLEET_URL}/api/resource/WMS Transport Request"
        
        headers = {
            "Authorization": f"token {AGRI_FLEET_API_KEY}:{AGRI_FLEET_API_SECRET}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Host": "agrifleet.local"
        }
        
        payload = {
            "wms_dispatch_id": lot.lot_code if lot else str(dispatch_note.lot_id),
            "commodity": dispatch_note.commodity_desc,
            "quantity_mt": float(dispatch_note.dispatch_quantity_kg) / 1000.0,
            "source_name": warehouse.name,
            "source_lat": float(warehouse.geo_lat) if warehouse.geo_lat else None,
            "source_lng": float(warehouse.geo_lng) if warehouse.geo_lng else None,
            "destination_address": dispatch_note.destination,
            "destination_name": dispatch_note.destination.split(",")[0].strip() if dispatch_note.destination else "WMS Destination",
            "destination_lat": dest_lat,
            "destination_lng": dest_lng,
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
            "wms_dispatch_id": lot.lot_code if lot else f"TRF-{transfer.id}",
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
