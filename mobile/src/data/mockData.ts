/**
 * Wakhar WMS — Mock data mirroring the backend seed.py data.
 * Used for development until backend API endpoints are connected.
 */

import type {
  User, FPO, Warehouse, Farmer, Commodity, CommodityLot,
  QualityRecord, WarehouseReceipt, StockMovement, DispatchNote,
  DispatchTimelineEvent, PurchaseOrder, ActivityLog, DashboardStats,
} from '@/types';
import {
  UserRole, WarehouseType, GradeEnum, LotStatus, IntakeType,
  QCGrade, CollateralStatus, WRStatus, MovementType,
  DispatchStatus, POStatus, PaymentStatus, ActivityType,
} from '@/types';

// ─── FPOs ────────────────────────────────────────────────────────────

export const fpos: FPO[] = [
  { id: 1, name: 'Wai FPO', code: 'WAI-FPO', region: 'Satara', district: 'Satara', state: 'Maharashtra', contact_phone: '+91-2167-200100', contact_email: null, aggregator_id: 4, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'Phaltan FPO', code: 'PHALTAN-FPO', region: 'Satara', district: 'Satara', state: 'Maharashtra', contact_phone: '+91-2166-220200', contact_email: null, aggregator_id: 4, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 3, name: 'Baramati FPO', code: 'BARAMATI-FPO', region: 'Pune', district: 'Pune', state: 'Maharashtra', contact_phone: '+91-2112-230300', contact_email: null, aggregator_id: 4, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 4, name: 'Satara Aggregator', code: 'SATARA-AGG', region: 'Satara', district: 'Satara', state: 'Maharashtra', contact_phone: '+91-2162-240400', contact_email: null, aggregator_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

// ─── Warehouses ──────────────────────────────────────────────────────

export const warehouses: Warehouse[] = [
  { id: 1, name: 'Wai FPO Warehouse', code: 'WH-WAI-01', type: WarehouseType.FPO, fpo_id: 1, capacity_mt: 500, current_stock_mt: 128.5, geo_lat: 17.9525, geo_lng: 73.8869, address: 'Wai Industrial Area, Satara', contact_person: 'Rajesh Bhosale', contact_phone: '+91-9876500001', operating_hours: '8:00 AM - 6:00 PM', permitted_commodities: 'Rice,Wheat,Soybean,Groundnut', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 2, name: 'Phaltan FPO Warehouse', code: 'WH-PHAL-01', type: WarehouseType.FPO, fpo_id: 2, capacity_mt: 400, current_stock_mt: 85.2, geo_lat: 17.9872, geo_lng: 74.4310, address: 'Phaltan MIDC, Satara', contact_person: 'Shivaji More', contact_phone: '+91-9876500010', operating_hours: '7:30 AM - 5:30 PM', permitted_commodities: 'Wheat,Onion,Soybean', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 3, name: 'Baramati FPO Warehouse', code: 'WH-BRMTI-01', type: WarehouseType.FPO, fpo_id: 3, capacity_mt: 350, current_stock_mt: 62.0, geo_lat: 18.1525, geo_lng: 74.5777, address: 'Baramati Market Yard, Pune', contact_person: 'Anjali Deshmukh', contact_phone: '+91-9876500011', operating_hours: '8:00 AM - 5:00 PM', permitted_commodities: 'Rice,Onion,Groundnut', is_active: true, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 4, name: 'Satara Aggregator Hub', code: 'WH-SAT-AGG', type: WarehouseType.AGGREGATOR, fpo_id: 4, capacity_mt: 2000, current_stock_mt: 450.0, geo_lat: 17.6805, geo_lng: 73.9947, address: 'Satara Main Road, NH-4', contact_person: 'Mahesh Kulkarni', contact_phone: '+91-9876500003', operating_hours: '7:00 AM - 8:00 PM', permitted_commodities: 'All', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
];

// ─── Users ───────────────────────────────────────────────────────────

export const users: User[] = [
  { id: 1, email: 'rajesh@wakhar.in', phone: '+919876500001', password_hash: 'hashed', full_name: 'Rajesh Bhosale', role: UserRole.FPO_MANAGER, initials: 'RB', is_active: true, fpo_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 2, email: 'admin@wakhar.in', phone: '+919876500000', password_hash: 'hashed', full_name: 'System Admin', role: UserRole.ADMIN, initials: 'SA', is_active: true, fpo_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 3, email: 'staff@wakhar.in', phone: '+919876500002', password_hash: 'hashed', full_name: 'Anil Gaikwad', role: UserRole.FPO_STAFF, initials: 'AG', is_active: true, fpo_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 4, email: 'agg@wakhar.in', phone: '+919876500003', password_hash: 'hashed', full_name: 'Mahesh Kulkarni', role: UserRole.AGGREGATOR, initials: 'MK', is_active: true, fpo_id: 4, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 5, email: 'buyer@raigadmart.in', phone: '+919876500004', password_hash: 'hashed', full_name: 'Raigad Mart Buyer', role: UserRole.MARKET_PARTNER, initials: 'RM', is_active: true, fpo_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { id: 6, email: null, phone: '+919876543210', password_hash: 'hashed', full_name: 'Suresh Patil', role: UserRole.FARMER, initials: 'SP', is_active: true, fpo_id: 1, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z' },
];

// ─── Commodities ─────────────────────────────────────────────────────

export const commodities: Commodity[] = [
  { id: 1, name: 'Rice', name_mr: 'तांदूळ', name_hi: 'चावल', base_rate: 62.5, category: 'cereal', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'Wheat', name_mr: 'गहू', name_hi: 'गेहूं', base_rate: 22.8, category: 'cereal', created_at: '2026-01-01T00:00:00Z' },
  { id: 3, name: 'Soybean', name_mr: 'सोयाबीन', name_hi: 'सोयाबीन', base_rate: 47.2, category: 'oilseed', created_at: '2026-01-01T00:00:00Z' },
  { id: 4, name: 'Onion', name_mr: 'कांदा', name_hi: 'प्याज़', base_rate: 18.5, category: 'vegetable', created_at: '2026-01-01T00:00:00Z' },
  { id: 5, name: 'Groundnut', name_mr: 'भुईमूग', name_hi: 'मूंगफली', base_rate: 68.0, category: 'oilseed', created_at: '2026-01-01T00:00:00Z' },
];

// ─── Farmers ─────────────────────────────────────────────────────────

export const farmers: Farmer[] = [
  { id: 1, farmer_code: 'FM-00412', name: 'Suresh Patil', phone: '+91 98765 43210', aadhaar: '4532-8901-4821', village: 'Wai', bank_account: '12345678901234', bank_ifsc: 'SBIN0001234', fpo_id: 1, total_deposit_kg: 2400, user_id: 6, created_at: '2026-02-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 2, farmer_code: 'FM-00389', name: 'Anita Shinde', phone: '+91-99230-44556', aadhaar: '7891-2345-6789', village: 'Phaltan', bank_account: '98765432109876', bank_ifsc: 'HDFC0005678', fpo_id: 2, total_deposit_kg: 1200, user_id: null, created_at: '2026-02-15T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 3, farmer_code: 'FM-00301', name: 'Ramesh Jadhav', phone: '+91-94210-77889', aadhaar: '3210-6789-0123', village: 'Wai', bank_account: '55667788990011', bank_ifsc: 'BKID0009876', fpo_id: 1, total_deposit_kg: 2100, user_id: null, created_at: '2026-03-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 4, farmer_code: 'FM-00451', name: 'Priya More', phone: '+91-91300-22334', aadhaar: '6789-0123-4567', village: 'Baramati', bank_account: '11223344556677', bank_ifsc: 'ICIC0001111', fpo_id: 3, total_deposit_kg: 800, user_id: null, created_at: '2026-03-15T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
  { id: 5, farmer_code: 'FM-00218', name: 'Vijay Kale', phone: '+91-95610-88990', aadhaar: '9012-3456-7890', village: 'Phaltan', bank_account: '44556677889900', bank_ifsc: 'UTIB0002222', fpo_id: 2, total_deposit_kg: 450, user_id: null, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-06-01T00:00:00Z' },
];

// ─── Commodity Lots ──────────────────────────────────────────────────

export const commodityLots: CommodityLot[] = [
  { id: 1, lot_code: 'LOT-2026-091', farmer_id: 1, commodity_id: 1, variety: 'Basmati', quantity_kg: 900, bag_count: 18, moisture_pct: 12.4, grade: GradeEnum.GRADE_A, warehouse_id: 1, zone: 'Zone A — Rack 3', status: LotStatus.AVAILABLE, intake_type: IntakeType.WALK_IN, source_gps_lat: 17.952, source_gps_lng: 73.886, remarks: null, intake_date: '2026-05-30', created_at: '2026-05-30T09:00:00Z', updated_at: '2026-05-30T10:00:00Z' },
  { id: 2, lot_code: 'LOT-2026-090', farmer_id: 2, commodity_id: 2, variety: 'Lokwan', quantity_kg: 1200, bag_count: 24, moisture_pct: 13.1, grade: GradeEnum.GRADE_A, warehouse_id: 2, zone: 'Zone B — Rack 1', status: LotStatus.RESERVED, intake_type: IntakeType.PRE_REGISTERED, source_gps_lat: null, source_gps_lng: null, remarks: null, intake_date: '2026-05-30', created_at: '2026-05-30T08:00:00Z', updated_at: '2026-05-30T11:00:00Z' },
  { id: 3, lot_code: 'LOT-2026-089', farmer_id: 3, commodity_id: 3, variety: 'JS-335', quantity_kg: 600, bag_count: 12, moisture_pct: 18.2, grade: GradeEnum.GRADE_B, warehouse_id: 1, zone: 'Zone A — Rack 4', status: LotStatus.QC_PENDING, intake_type: IntakeType.WALK_IN, source_gps_lat: null, source_gps_lng: null, remarks: 'Aeration required', intake_date: '2026-05-29', created_at: '2026-05-29T14:00:00Z', updated_at: '2026-05-30T09:00:00Z' },
  { id: 4, lot_code: 'LOT-2026-088', farmer_id: 4, commodity_id: 4, variety: 'Nasik Red', quantity_kg: 800, bag_count: 40, moisture_pct: 10.8, grade: GradeEnum.GRADE_A, warehouse_id: 3, zone: 'Zone C — Rack 2', status: LotStatus.AVAILABLE, intake_type: IntakeType.WALK_IN, source_gps_lat: null, source_gps_lng: null, remarks: null, intake_date: '2026-05-29', created_at: '2026-05-29T10:00:00Z', updated_at: '2026-05-29T12:00:00Z' },
  { id: 5, lot_code: 'LOT-2026-087', farmer_id: 5, commodity_id: 1, variety: 'HMT', quantity_kg: 450, bag_count: 9, moisture_pct: 21.5, grade: GradeEnum.REJECTED, warehouse_id: 1, zone: 'Zone A — Rack 3', status: LotStatus.RETURNED, intake_type: IntakeType.WALK_IN, source_gps_lat: null, source_gps_lng: null, remarks: 'Returned due to critical moisture', intake_date: '2026-05-28', created_at: '2026-05-28T11:00:00Z', updated_at: '2026-05-28T15:00:00Z' },
  { id: 6, lot_code: 'LOT-2026-086', farmer_id: 3, commodity_id: 5, variety: 'TG-37', quantity_kg: 1500, bag_count: 30, moisture_pct: 11.5, grade: GradeEnum.GRADE_A, warehouse_id: 1, zone: 'Zone B — Rack 2', status: LotStatus.AVAILABLE, intake_type: IntakeType.PRE_REGISTERED, source_gps_lat: null, source_gps_lng: null, remarks: null, intake_date: '2026-06-05', created_at: '2026-06-05T09:00:00Z', updated_at: '2026-06-05T10:00:00Z' },
];

// ─── Quality Records ─────────────────────────────────────────────────

export const qualityRecords: QualityRecord[] = [
  { id: 1, qc_code: 'QC-2026-001', lot_id: 1, moisture_pct: 12.4, foreign_matter_pct: 0.5, broken_grain_pct: 1.2, protein_pct: 7.8, grade_awarded: QCGrade.GRADE_A, inspected_by: 3, inspection_date: '2026-05-30T09:30:00Z', certificate_url: null, remarks: 'Premium quality Basmati', created_at: '2026-05-30T09:30:00Z' },
  { id: 2, qc_code: 'QC-2026-002', lot_id: 2, moisture_pct: 13.1, foreign_matter_pct: 0.8, broken_grain_pct: 2.1, protein_pct: 11.5, grade_awarded: QCGrade.GRADE_A, inspected_by: 3, inspection_date: '2026-05-30T10:00:00Z', certificate_url: null, remarks: null, created_at: '2026-05-30T10:00:00Z' },
  { id: 3, qc_code: 'QC-2026-003', lot_id: 4, moisture_pct: 10.8, foreign_matter_pct: 0.3, broken_grain_pct: null, protein_pct: null, grade_awarded: QCGrade.GRADE_A, inspected_by: 3, inspection_date: '2026-05-29T11:00:00Z', certificate_url: null, remarks: 'Excellent quality onion', created_at: '2026-05-29T11:00:00Z' },
  { id: 4, qc_code: 'QC-2026-004', lot_id: 6, moisture_pct: 11.5, foreign_matter_pct: 0.4, broken_grain_pct: 0.8, protein_pct: 25.3, grade_awarded: QCGrade.GRADE_A, inspected_by: 3, inspection_date: '2026-06-05T09:30:00Z', certificate_url: null, remarks: 'High protein groundnut', created_at: '2026-06-05T09:30:00Z' },
  { id: 5, qc_code: 'QC-2026-005', lot_id: 5, moisture_pct: 21.5, foreign_matter_pct: 3.2, broken_grain_pct: 8.5, protein_pct: 5.1, grade_awarded: QCGrade.REJECTED, inspected_by: 3, inspection_date: '2026-05-28T12:00:00Z', certificate_url: null, remarks: 'Critical moisture, above 20% threshold. Rejected.', created_at: '2026-05-28T12:00:00Z' },
];

// ─── Warehouse Receipts ──────────────────────────────────────────────

export const warehouseReceipts: WarehouseReceipt[] = [
  { id: 1, wr_code: 'WR-2026-0347', lot_id: 1, farmer_id: 1, issue_date: '2026-05-30', expiry_date: '2026-08-30', quantity_kg: 900, grade: 'Grade A', valuation: 56250, collateral_status: CollateralStatus.NONE, pledge_bank: null, loan_amount: 0, status: WRStatus.ACTIVE, enam_submitted: false, created_at: '2026-05-30T10:00:00Z', updated_at: '2026-05-30T10:00:00Z' },
  { id: 2, wr_code: 'WR-2026-0346', lot_id: 2, farmer_id: 2, issue_date: '2026-05-30', expiry_date: '2026-08-30', quantity_kg: 1200, grade: 'Grade A', valuation: 27360, collateral_status: CollateralStatus.DISBURSED, pledge_bank: 'NABARD', loan_amount: 19150, status: WRStatus.ACTIVE, enam_submitted: true, created_at: '2026-05-30T11:00:00Z', updated_at: '2026-05-30T11:00:00Z' },
  { id: 3, wr_code: 'WR-2026-0340', lot_id: 4, farmer_id: 4, issue_date: '2026-05-29', expiry_date: '2026-08-15', quantity_kg: 800, grade: 'Grade A', valuation: 14800, collateral_status: CollateralStatus.DISBURSED, pledge_bank: 'NABARD', loan_amount: 10360, status: WRStatus.ACTIVE, enam_submitted: false, created_at: '2026-05-29T12:00:00Z', updated_at: '2026-05-29T12:00:00Z' },
  { id: 4, wr_code: 'WR-2026-0332', lot_id: 6, farmer_id: 3, issue_date: '2026-06-05', expiry_date: '2026-09-05', quantity_kg: 1500, grade: 'Grade A', valuation: 102000, collateral_status: CollateralStatus.NONE, pledge_bank: null, loan_amount: 0, status: WRStatus.ACTIVE, enam_submitted: false, created_at: '2026-06-05T10:00:00Z', updated_at: '2026-06-05T10:00:00Z' },
];

// ─── Dispatch Notes ──────────────────────────────────────────────────

export const dispatchNotes: DispatchNote[] = [
  {
    id: 1, dn_code: 'DN-0082', lot_id: 3, commodity_desc: 'Soybean (JS-335)', quantity_desc: '12 MT', destination: 'Satara Aggregator', buyer_id: null, vehicle_reg: 'MH-11-AB-4421', traccar_device_id: 'DRV-2026-0001', fleetbase_order_id: null, status: DispatchStatus.IN_TRANSIT, e_way_bill_no: 'EWB-MH-2026-00891', delivery_pod_url: null, dispatch_date: '2026-05-30T09:15:00Z', delivery_date: null,
    timeline_events: [
      { id: 1, dispatch_note_id: 1, title: 'Dispatch Note Created', subtitle: 'Today, 9:15 AM', is_done: true, is_active: false, event_order: 1, event_date: '2026-05-30T09:15:00Z', created_at: '2026-05-30T09:15:00Z' },
      { id: 2, dispatch_note_id: 1, title: 'Weigh Bridge Gate-out weight certified', subtitle: 'Today, 10:00 AM', is_done: true, is_active: false, event_order: 2, event_date: '2026-05-30T10:00:00Z', created_at: '2026-05-30T10:00:00Z' },
      { id: 3, dispatch_note_id: 1, title: 'NIC e-Way Bill generated & synchronized', subtitle: 'Today, 10:12 AM', is_done: true, is_active: false, event_order: 3, event_date: '2026-05-30T10:12:00Z', created_at: '2026-05-30T10:12:00Z' },
      { id: 4, dispatch_note_id: 1, title: 'Delivery e-POD check in-transit', subtitle: 'Estimated delivery 6:00 PM', is_done: false, is_active: true, event_order: 4, event_date: null, created_at: '2026-05-30T10:12:00Z' },
    ],
    created_at: '2026-05-30T09:15:00Z', updated_at: '2026-05-30T10:12:00Z',
  },
  {
    id: 2, dn_code: 'DN-0081', lot_id: 2, commodity_desc: 'Wheat (Lokwan)', quantity_desc: '8 MT', destination: 'Phaltan FPO Warehouse', buyer_id: null, vehicle_reg: 'MH-12-PQ-9080', traccar_device_id: null, fleetbase_order_id: null, status: DispatchStatus.DELIVERED, e_way_bill_no: 'EWB-MH-2026-00890', delivery_pod_url: null, dispatch_date: '2026-05-29T08:00:00Z', delivery_date: '2026-05-29T16:30:00Z',
    timeline_events: [
      { id: 5, dispatch_note_id: 2, title: 'Dispatch Note Created', subtitle: 'Yesterday, 8:00 AM', is_done: true, is_active: false, event_order: 1, event_date: '2026-05-29T08:00:00Z', created_at: '2026-05-29T08:00:00Z' },
      { id: 6, dispatch_note_id: 2, title: 'Weigh Bridge Gate-out weight certified', subtitle: 'Yesterday, 8:45 AM', is_done: true, is_active: false, event_order: 2, event_date: '2026-05-29T08:45:00Z', created_at: '2026-05-29T08:45:00Z' },
      { id: 7, dispatch_note_id: 2, title: 'NIC e-Way Bill generated & synchronized', subtitle: 'Yesterday, 9:00 AM', is_done: true, is_active: false, event_order: 3, event_date: '2026-05-29T09:00:00Z', created_at: '2026-05-29T09:00:00Z' },
      { id: 8, dispatch_note_id: 2, title: 'Delivery e-POD completed & signed', subtitle: 'Yesterday, 4:30 PM', is_done: true, is_active: false, event_order: 4, event_date: '2026-05-29T16:30:00Z', created_at: '2026-05-29T16:30:00Z' },
    ],
    created_at: '2026-05-29T08:00:00Z', updated_at: '2026-05-29T16:30:00Z',
  },
];

// ─── Stock Movements ─────────────────────────────────────────────────

export const stockMovements: StockMovement[] = [
  { id: 1, movement_code: 'MOV-2026-001', type: MovementType.INTAKE, lot_id: 1, from_warehouse_id: null, to_warehouse_id: 1, quantity_kg: 900, performed_by_id: 3, movement_date: '2026-05-30T09:00:00Z', remarks: 'Farmer walk-in intake', created_at: '2026-05-30T09:00:00Z' },
  { id: 2, movement_code: 'MOV-2026-002', type: MovementType.INTAKE, lot_id: 2, from_warehouse_id: null, to_warehouse_id: 2, quantity_kg: 1200, performed_by_id: 3, movement_date: '2026-05-30T08:00:00Z', remarks: 'Pre-registered intake', created_at: '2026-05-30T08:00:00Z' },
  { id: 3, movement_code: 'MOV-2026-003', type: MovementType.INTAKE, lot_id: 3, from_warehouse_id: null, to_warehouse_id: 1, quantity_kg: 600, performed_by_id: 3, movement_date: '2026-05-29T14:00:00Z', remarks: null, created_at: '2026-05-29T14:00:00Z' },
  { id: 4, movement_code: 'MOV-2026-004', type: MovementType.DISPATCH, lot_id: 3, from_warehouse_id: 1, to_warehouse_id: 4, quantity_kg: 600, performed_by_id: 1, movement_date: '2026-05-30T09:15:00Z', remarks: 'Dispatched to Satara Aggregator', created_at: '2026-05-30T09:15:00Z' },
  { id: 5, movement_code: 'MOV-2026-005', type: MovementType.RETURN, lot_id: 5, from_warehouse_id: 1, to_warehouse_id: null, quantity_kg: 450, performed_by_id: 3, movement_date: '2026-05-28T15:00:00Z', remarks: 'Returned — rejected quality', created_at: '2026-05-28T15:00:00Z' },
];

// ─── Activity Logs ───────────────────────────────────────────────────

export const activityLogs: ActivityLog[] = [
  { id: 1, type: ActivityType.INTAKE, message: 'Intake completed — Farmer Suresh Patil deposited 18 bags (900 kg) Rice Grade A at Wai FPO', reference: 'WR-2026-0347', user_id: 1, created_at: '2026-05-30T10:00:00Z' },
  { id: 2, type: ActivityType.DISPATCH, message: 'Dispatch Note DN-0082 created — 12 MT Soybean dispatched to Satara Aggregator via Vehicle MH-11-AB-4421', reference: 'DN-0082', user_id: 1, created_at: '2026-05-30T09:15:00Z' },
  { id: 3, type: ActivityType.QC, message: 'Quality alert — Lot LOT-2026-089 moisture 18.2% exceeds threshold (14%). Flagged for re-drying.', reference: 'LOT-2026-089', user_id: 3, created_at: '2026-05-29T14:30:00Z' },
  { id: 4, type: ActivityType.MARKET, message: 'Purchase Order PO-2026-112 accepted from Raigad Mart — 50 MT Wheat Grade A, ₹22,000/MT', reference: 'PO-2026-112', user_id: 5, created_at: '2026-05-28T16:00:00Z' },
  { id: 5, type: ActivityType.INTAKE, message: 'Intake completed — Farmer Ramesh Jadhav deposited 30 bags (1500 kg) Groundnut Grade A at Wai FPO', reference: 'WR-2026-0332', user_id: 1, created_at: '2026-06-05T10:00:00Z' },
  { id: 6, type: ActivityType.QC, message: 'Lot LOT-2026-087 rejected — moisture 21.5% critical. Returned to farmer Vijay Kale.', reference: 'LOT-2026-087', user_id: 3, created_at: '2026-05-28T15:00:00Z' },
];

// ─── Purchase Orders ─────────────────────────────────────────────────

export const purchaseOrders: PurchaseOrder[] = [
  { id: 1, po_code: 'PO-2026-112', buyer_id: 5, commodity_id: 2, grade: 'Grade A', quantity_kg: 50000, price_per_mt: 22000, warehouse_id: 2, status: POStatus.ACCEPTED, grn_id: null, payment_status: PaymentStatus.PENDING, payment_ref: null, created_at: '2026-05-28T16:00:00Z', updated_at: '2026-05-28T16:00:00Z' },
];

// ─── Dashboard Stats (computed) ──────────────────────────────────────

export function getDashboardStats(fpoId?: number): DashboardStats {
  const fpoWarehouses = fpoId
    ? warehouses.filter(w => w.fpo_id === fpoId)
    : warehouses;
  const warehouseIds = fpoWarehouses.map(w => w.id);
  const fpoLots = fpoId
    ? commodityLots.filter(l => warehouseIds.includes(l.warehouse_id))
    : commodityLots;
  const fpoFarmers = fpoId
    ? farmers.filter(f => f.fpo_id === fpoId)
    : farmers;

  const lotsByStatus: Record<string, number> = {};
  const lotsByGrade: Record<string, number> = {};
  fpoLots.forEach(lot => {
    lotsByStatus[lot.status] = (lotsByStatus[lot.status] || 0) + 1;
    lotsByGrade[lot.grade] = (lotsByGrade[lot.grade] || 0) + 1;
  });

  return {
    total_lots: fpoLots.length,
    total_farmers: fpoFarmers.length,
    total_warehouses: fpoWarehouses.length,
    total_stock_mt: fpoWarehouses.reduce((sum, w) => sum + w.current_stock_mt, 0),
    lots_by_status: lotsByStatus,
    lots_by_grade: lotsByGrade,
    recent_activity: activityLogs.slice(0, 10),
  };
}

// ─── Helper lookups ──────────────────────────────────────────────────

export function getFarmerById(id: number): Farmer | undefined {
  return farmers.find(f => f.id === id);
}
export function getCommodityById(id: number): Commodity | undefined {
  return commodities.find(c => c.id === id);
}
export function getWarehouseById(id: number): Warehouse | undefined {
  return warehouses.find(w => w.id === id);
}
export function getFPOById(id: number): FPO | undefined {
  return fpos.find(f => f.id === id);
}
export function getUserById(id: number): User | undefined {
  return users.find(u => u.id === id);
}
export function getLotsByFarmerId(farmerId: number): CommodityLot[] {
  return commodityLots.filter(l => l.farmer_id === farmerId);
}
export function getReceiptsByFarmerId(farmerId: number): WarehouseReceipt[] {
  return warehouseReceipts.filter(wr => wr.farmer_id === farmerId);
}
export function getLotsByWarehouseId(warehouseId: number): CommodityLot[] {
  return commodityLots.filter(l => l.warehouse_id === warehouseId);
}
export function getQualityRecordsByLotId(lotId: number): QualityRecord[] {
  return qualityRecords.filter(qr => qr.lot_id === lotId);
}
export function getMovementsByLotId(lotId: number): StockMovement[] {
  return stockMovements.filter(sm => sm.lot_id === lotId);
}
export function getReceiptByLotId(lotId: number): WarehouseReceipt | undefined {
  return warehouseReceipts.find(wr => wr.lot_id === lotId);
}

// ─── Mock Auth Users ─────────────────────────────────────────────────

export const mockAuthUsers = [
  { phone: '+919876543210', password: 'farmer123', userId: 6, farmerId: 1 },
  { phone: '+919876500001', password: 'manager123', userId: 1, farmerId: null },
  { phone: '+919876500002', password: 'staff123', userId: 3, farmerId: null },
];
