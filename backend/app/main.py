from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import traceback

from app.routes.auth import router as auth_router
from app.routes.fpo_routes import router as fpo_router
from app.routes.warehouse_routes import router as warehouse_router
from app.routes.user_routes import router as user_router
from app.routes.farmer_routes import router as farmer_router
from app.routes.commodity_routes import router as commodity_router
from app.routes.commodity_lot_routes import router as commodity_lot_router
from app.routes.quality_record_routes import router as quality_record_router
from app.routes.warehouse_receipt_routes import router as warehouse_receipt_router
from app.routes.stock_movement_routes import router as stock_movement_router
from app.routes.dispatch_note_routes import router as dispatch_note_router
from app.routes.purchase_order_routes import router as purchase_order_router
from app.routes.activity_log_routes import router as activity_log_router
from app.routes.dashboard_routes import router as dashboard_router

app = FastAPI(title="Wakhar WMS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(fpo_router)
app.include_router(warehouse_router)
app.include_router(user_router)
app.include_router(farmer_router)
app.include_router(commodity_router)
app.include_router(commodity_lot_router)
app.include_router(quality_record_router)
app.include_router(warehouse_receipt_router)
app.include_router(stock_movement_router)
app.include_router(dispatch_note_router)
app.include_router(purchase_order_router)
app.include_router(activity_log_router)
app.include_router(dashboard_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    print("GLOBAL EXCEPTION:", tb)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": tb.split("\n")}
    )

@app.get("/")
def root():
    return {"message": "Wakhar WMS API is running"}
