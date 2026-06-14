"""Seed script — populates the database with sample data matching the frontend UI."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from datetime import datetime, date, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.routes.auth import get_password_hash
from app.models import (
    Base, User, UserRole, FPO, Warehouse, WarehouseType,
    Farmer, Commodity, CommodityLot, GradeEnum, LotStatus,
    IntakeType, QualityRecord, QCGrade, WarehouseReceipt,
    CollateralStatus, WRStatus, StockMovement, MovementType,
    DispatchNote, DispatchStatus, DispatchTimelineEvent,
    PurchaseOrder, POStatus, PaymentStatus, ActivityLog, ActivityType,
)

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://wakhar:wakhar123@localhost/wakharwms")

engine = create_engine(DATABASE_URL, echo=False)


def seed():
    with Session(engine) as session:
        # ──────────────────────────────────────────
        # 0. Clear Existing Data
        # ──────────────────────────────────────────
        print("🧹 Clearing existing database data...")
        session.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        for table in reversed(Base.metadata.sorted_tables):
            session.execute(table.delete())
        session.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        session.commit()

        # ──────────────────────────────────────────
        # 1. FPOs
        # ──────────────────────────────────────────
        fpo_wai = FPO(name="Wai FPO", code="WAI-FPO", region="Satara", district="Satara", contact_phone="+91-2167-200100")
        fpo_phaltan = FPO(name="Phaltan FPO", code="PHALTAN-FPO", region="Satara", district="Satara", contact_phone="+91-2166-220200")
        fpo_baramati = FPO(name="Baramati FPO", code="BARAMATI-FPO", region="Pune", district="Pune", contact_phone="+91-2112-230300")
        fpo_aggregator = FPO(name="Satara Aggregator", code="SATARA-AGG", region="Satara", district="Satara", contact_phone="+91-2162-240400")
        session.add_all([fpo_wai, fpo_phaltan, fpo_baramati, fpo_aggregator])
        session.flush()

        # Link child FPOs to the aggregator
        fpo_wai.aggregator_id = fpo_aggregator.id
        fpo_phaltan.aggregator_id = fpo_aggregator.id
        fpo_baramati.aggregator_id = fpo_aggregator.id

        # ──────────────────────────────────────────
        # 2. Warehouses
        # ──────────────────────────────────────────
        wh_wai = Warehouse(name="Wai FPO Warehouse", code="WH-WAI-01", type=WarehouseType.fpo, fpo_id=fpo_wai.id, capacity_mt=500, geo_lat=17.9525, geo_lng=73.8869)
        wh_phaltan = Warehouse(name="Phaltan FPO Warehouse", code="WH-PHAL-01", type=WarehouseType.fpo, fpo_id=fpo_phaltan.id, capacity_mt=400, geo_lat=17.9872, geo_lng=74.4310)
        wh_baramati = Warehouse(name="Baramati FPO Warehouse", code="WH-BRMTI-01", type=WarehouseType.fpo, fpo_id=fpo_baramati.id, capacity_mt=350, geo_lat=18.1525, geo_lng=74.5777)
        wh_agg = Warehouse(name="Satara Aggregator Hub", code="WH-SAT-AGG", type=WarehouseType.aggregator, fpo_id=fpo_aggregator.id, capacity_mt=2000, geo_lat=17.6805, geo_lng=73.9947)
        session.add_all([wh_wai, wh_phaltan, wh_baramati, wh_agg])
        session.flush()

        # ──────────────────────────────────────────
        # 3. Users
        # ──────────────────────────────────────────
        # Hash "123456" for secure login
        pwd_hash = get_password_hash("123456")
        
        user_manager = User(
            email="rajesh@wakhar.in", phone="+919876500001",
            password_hash=pwd_hash, full_name="Rajesh Bhosale",
            role=UserRole.fpo_manager, initials="RB", fpo_id=fpo_wai.id,
        )
        user_admin = User(
            email="admin@wakhar.in", phone="+919876500000",
            password_hash=pwd_hash, full_name="System Admin",
            role=UserRole.admin, initials="SA",
        )
        user_staff = User(
            email="staff@wakhar.in", phone="+919876500002",
            password_hash=pwd_hash, full_name="Anil Gaikwad",
            role=UserRole.fpo_staff, initials="AG", fpo_id=fpo_wai.id,
        )
        user_agg = User(
            email="agg@wakhar.in", phone="+919876500003",
            password_hash=pwd_hash, full_name="Mahesh Kulkarni",
            role=UserRole.aggregator, initials="MK", fpo_id=fpo_aggregator.id,
        )
        user_market = User(
            email="buyer@raigadmart.in", phone="+919876500004",
            password_hash=pwd_hash, full_name="Raigad Mart Buyer",
            role=UserRole.market_partner, initials="RM",
        )
        user_farmer = User(
            email="suresh@wakhar.in", phone="+919876543210",
            password_hash=pwd_hash, full_name="Suresh Patil",
            role=UserRole.farmer, initials="SP",
        )
        session.add_all([user_manager, user_admin, user_staff, user_agg, user_market, user_farmer])
        session.flush()

        # ──────────────────────────────────────────
        # 4. Commodities (with base rates from UI cropRates)
        # ──────────────────────────────────────────
        rice = Commodity(name="Rice", name_mr="तांदूळ", name_hi="चावल", base_rate=62.5, category="cereal")
        wheat = Commodity(name="Wheat", name_mr="गहू", name_hi="गेहूं", base_rate=22.8, category="cereal")
        soybean = Commodity(name="Soybean", name_mr="सोयाबीन", name_hi="सोयाबीन", base_rate=47.2, category="oilseed")
        onion = Commodity(name="Onion", name_mr="कांदा", name_hi="प्याज़", base_rate=18.5, category="vegetable")
        groundnut = Commodity(name="Groundnut", name_mr="भुईमूग", name_hi="मूंगफली", base_rate=68.0, category="oilseed")
        session.add_all([rice, wheat, soybean, onion, groundnut])
        session.flush()

        # ──────────────────────────────────────────
        # 5. Farmers (matching initialFarmers from App.jsx)
        # ──────────────────────────────────────────
        fm1 = Farmer(farmer_code="FM-00412", name="Suresh Patil", phone="+919876543210", aadhaar="4532-8901-4821", village="Wai", fpo_id=fpo_wai.id, user_id=user_farmer.id)
        fm2 = Farmer(farmer_code="FM-00389", name="Anita Shinde", phone="+91-99230-44556", aadhaar="7891-2345-6789", village="Phaltan", fpo_id=fpo_phaltan.id)
        fm3 = Farmer(farmer_code="FM-00301", name="Ramesh Jadhav", phone="+91-94210-77889", aadhaar="3210-6789-0123", village="Wai", fpo_id=fpo_wai.id)
        fm4 = Farmer(farmer_code="FM-00451", name="Priya More", phone="+91-91300-22334", aadhaar="6789-0123-4567", village="Baramati", fpo_id=fpo_baramati.id)
        fm5 = Farmer(farmer_code="FM-00218", name="Vijay Kale", phone="+91-95610-88990", aadhaar="9012-3456-7890", village="Phaltan", fpo_id=fpo_phaltan.id)
        session.add_all([fm1, fm2, fm3, fm4, fm5])
        session.flush()

        # ──────────────────────────────────────────
        # 6. Commodity Lots (matching initialIntakes from App.jsx)
        # ──────────────────────────────────────────
        lot1 = CommodityLot(
            lot_code="LOT-2026-091", farmer_id=fm1.id, commodity_id=rice.id,
            variety="Basmati", quantity_kg=900, bag_count=18, moisture_pct=12.4,
            grade=GradeEnum.grade_a, warehouse_id=wh_wai.id, zone="Zone A — Rack 3",
            status=LotStatus.available, intake_date=date(2026, 5, 30),
        )
        lot2 = CommodityLot(
            lot_code="LOT-2026-090", farmer_id=fm2.id, commodity_id=wheat.id,
            variety="Lokwan", quantity_kg=1200, bag_count=24, moisture_pct=13.1,
            grade=GradeEnum.grade_a, warehouse_id=wh_phaltan.id, zone="Zone B — Rack 1",
            status=LotStatus.reserved, intake_date=date(2026, 5, 30),
        )
        lot3 = CommodityLot(
            lot_code="LOT-2026-089", farmer_id=fm3.id, commodity_id=soybean.id,
            variety="JS-335", quantity_kg=600, bag_count=12, moisture_pct=18.2,
            grade=GradeEnum.grade_b, warehouse_id=wh_wai.id, zone="Zone A — Rack 4",
            status=LotStatus.qc_pending, intake_date=date(2026, 5, 29),
            remarks="Aeration required",
        )
        lot4 = CommodityLot(
            lot_code="LOT-2026-088", farmer_id=fm4.id, commodity_id=onion.id,
            variety="Nasik Red", quantity_kg=800, bag_count=40, moisture_pct=10.8,
            grade=GradeEnum.grade_a, warehouse_id=wh_baramati.id, zone="Zone C — Rack 2",
            status=LotStatus.available, intake_date=date(2026, 5, 29),
        )
        lot5 = CommodityLot(
            lot_code="LOT-2026-087", farmer_id=fm5.id, commodity_id=rice.id,
            variety="HMT", quantity_kg=450, bag_count=9, moisture_pct=21.5,
            grade=GradeEnum.rejected, warehouse_id=wh_wai.id, zone="Zone A — Rack 3",
            status=LotStatus.returned, intake_date=date(2026, 5, 28),
            remarks="Returned due to critical moisture",
        )
        # Extra lot for WR-2026-0332 (Groundnut)
        lot6 = CommodityLot(
            lot_code="LOT-2026-086", farmer_id=fm3.id, commodity_id=groundnut.id,
            variety="TG-37", quantity_kg=1500, bag_count=30, moisture_pct=11.5,
            grade=GradeEnum.grade_a, warehouse_id=wh_wai.id, zone="Zone B — Rack 2",
            status=LotStatus.available, intake_date=date(2026, 6, 5),
        )
        session.add_all([lot1, lot2, lot3, lot4, lot5, lot6])
        session.flush()

        # ──────────────────────────────────────────
        # 7. Warehouse Receipts (matching initialReceipts from App.jsx)
        # ──────────────────────────────────────────
        wr1 = WarehouseReceipt(
            wr_code="WR-2026-0347", lot_id=lot1.id, farmer_id=fm1.id,
            issue_date=date(2026, 5, 30), expiry_date=date(2026, 8, 30),
            quantity_kg=900, grade="Grade A", valuation=56250,
            collateral_status=CollateralStatus.none,
        )
        wr2 = WarehouseReceipt(
            wr_code="WR-2026-0346", lot_id=lot2.id, farmer_id=fm2.id,
            issue_date=date(2026, 5, 30), expiry_date=date(2026, 8, 30),
            quantity_kg=1200, grade="Grade A", valuation=27360,
            collateral_status=CollateralStatus.disbursed, pledge_bank="NABARD", loan_amount=19150,
        )
        wr3 = WarehouseReceipt(
            wr_code="WR-2026-0340", lot_id=lot4.id, farmer_id=fm4.id,
            issue_date=date(2026, 5, 29), expiry_date=date(2026, 8, 15),
            quantity_kg=800, grade="Grade A", valuation=14800,
            collateral_status=CollateralStatus.disbursed, pledge_bank="NABARD", loan_amount=10360,
        )
        wr4 = WarehouseReceipt(
            wr_code="WR-2026-0332", lot_id=lot6.id, farmer_id=fm3.id,
            issue_date=date(2026, 6, 5), expiry_date=date(2026, 9, 5),
            quantity_kg=1500, grade="Grade A", valuation=102000,
            collateral_status=CollateralStatus.none,
        )
        session.add_all([wr1, wr2, wr3, wr4])
        session.flush()

        # ──────────────────────────────────────────
        # 8. Dispatch Notes (removed demo dispatches)
        # ──────────────────────────────────────────
        pass

        # ──────────────────────────────────────────
        # 9. Activity Logs (matching initialActivities from App.jsx)
        # ──────────────────────────────────────────
        session.add_all([
            ActivityLog(
                type=ActivityType.intake,
                message='Intake completed — Farmer <strong>Suresh Patil</strong> deposited 18 bags (900 kg) Rice Grade A at Wai FPO',
                reference="WR-2026-0347", user_id=user_manager.id,
            ),
            ActivityLog(
                type=ActivityType.dispatch,
                message='Dispatch Note <strong>DN-0082</strong> created — 12 MT Soybean dispatched to Satara Aggregator via Vehicle MH-11-AB-4421',
                reference="DN-0082", user_id=user_manager.id,
            ),
            ActivityLog(
                type=ActivityType.qc,
                message='Quality alert — Lot <strong>LOT-2026-089</strong> moisture 18.2% exceeds threshold (14%). Flagged for re-drying.',
                reference="LOT-2026-089", user_id=user_staff.id,
            ),
            ActivityLog(
                type=ActivityType.market,
                message='Purchase Order <strong>PO-2026-112</strong> accepted from Raigad Mart — 50 MT Wheat Grade A, ₹22,000/MT',
                reference="PO-2026-112", user_id=user_market.id,
            ),
        ])

        # ──────────────────────────────────────────
        # 10. Sample Purchase Order
        # ──────────────────────────────────────────
        session.add(PurchaseOrder(
            po_code="PO-2026-112", buyer_id=user_market.id, commodity_id=wheat.id,
            grade="Grade A", quantity_kg=50000, price_per_mt=22000,
            warehouse_id=wh_phaltan.id, status=POStatus.accepted,
        ))

        # ──────────────────────────────────────────
        # COMMIT
        # ──────────────────────────────────────────
        session.commit()
        print("✅ Database seeded successfully!")
        print(f"   - {session.query(FPO).count()} FPOs")
        print(f"   - {session.query(Warehouse).count()} Warehouses")
        print(f"   - {session.query(User).count()} Users")
        print(f"   - {session.query(Commodity).count()} Commodities")
        print(f"   - {session.query(Farmer).count()} Farmers")
        print(f"   - {session.query(CommodityLot).count()} Commodity Lots")
        print(f"   - {session.query(WarehouseReceipt).count()} Warehouse Receipts")
        print(f"   - {session.query(DispatchNote).count()} Dispatch Notes")
        print(f"   - {session.query(DispatchTimelineEvent).count()} Timeline Events")
        print(f"   - {session.query(PurchaseOrder).count()} Purchase Orders")
        print(f"   - {session.query(ActivityLog).count()} Activity Logs")


if __name__ == "__main__":
    seed()
