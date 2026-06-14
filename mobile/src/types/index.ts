/**
 * Wakhar WMS — TypeScript types matching backend SQLAlchemy models.
 */

// ─── Enums ───────────────────────────────────────────────────────────

export enum UserRole {
  FARMER = 'farmer',
  FPO_STAFF = 'fpo_staff',
  FPO_MANAGER = 'fpo_manager',
  AGGREGATOR = 'aggregator',
  MARKET_PARTNER = 'market_partner',
  ADMIN = 'admin',
}

export enum WarehouseType {
  FPO = 'fpo',
  AGGREGATOR = 'aggregator',
  COLD_STORAGE = 'cold_storage',
}

export enum GradeEnum {
  GRADE_A = 'grade_a',
  GRADE_B = 'grade_b',
  GRADE_C = 'grade_c',
  REJECTED = 'rejected',
  PENDING = 'pending',
}

export enum LotStatus {
  AVAILABLE = 'available',
  RESERVED = 'reserved',
  QC_PENDING = 'qc_pending',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  RETURNED = 'returned',
}

export enum IntakeType {
  WALK_IN = 'walk_in',
  PRE_REGISTERED = 'pre_registered',
}

export enum QCGrade {
  GRADE_A = 'grade_a',
  GRADE_B = 'grade_b',
  GRADE_C = 'grade_c',
  REJECTED = 'rejected',
}

export enum CollateralStatus {
  NONE = 'none',
  APPLIED = 'applied',
  DISBURSED = 'disbursed',
  RELEASED = 'released',
}

export enum WRStatus {
  ACTIVE = 'active',
  AMENDED = 'amended',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

export enum MovementType {
  INTAKE = 'intake',
  TRANSFER = 'transfer',
  DISPATCH = 'dispatch',
  RETURN = 'return',
  ADJUSTMENT = 'adjustment',
}

export enum DispatchStatus {
  CREATED = 'created',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum POStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  FULFILLED = 'fulfilled',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum ActivityType {
  INTAKE = 'intake',
  DISPATCH = 'dispatch',
  QC = 'qc',
  MARKET = 'market',
  SYSTEM = 'system',
}

// ─── Models ──────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string | null;
  phone: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  initials: string | null;
  is_active: boolean;
  fpo_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface FPO {
  id: number;
  name: string;
  code: string;
  region: string | null;
  district: string | null;
  state: string;
  contact_phone: string | null;
  contact_email: string | null;
  aggregator_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  name: string;
  code: string;
  type: WarehouseType;
  fpo_id: number;
  geo_lat: number | null;
  geo_lng: number | null;
  capacity_mt: number;
  current_stock_mt: number;
  address: string | null;
  contact_person: string | null;
  contact_phone: string | null;
  operating_hours: string | null;
  permitted_commodities: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Farmer {
  id: number;
  farmer_code: string;
  name: string;
  phone: string;
  aadhaar: string | null;
  village: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  fpo_id: number;
  total_deposit_kg: number;
  user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Commodity {
  id: number;
  name: string;
  name_mr: string | null;
  name_hi: string | null;
  base_rate: number;
  category: string | null;
  created_at: string;
}

export interface CommodityLot {
  id: number;
  lot_code: string;
  farmer_id: number;
  commodity_id: number;
  variety: string | null;
  quantity_kg: number;
  bag_count: number;
  moisture_pct: number | null;
  grade: GradeEnum;
  warehouse_id: number;
  zone: string | null;
  status: LotStatus;
  intake_type: IntakeType;
  source_gps_lat: number | null;
  source_gps_lng: number | null;
  remarks: string | null;
  intake_date: string;
  created_at: string;
  updated_at: string;
}

export interface QualityRecord {
  id: number;
  qc_code: string;
  lot_id: number;
  moisture_pct: number;
  foreign_matter_pct: number | null;
  broken_grain_pct: number | null;
  protein_pct: number | null;
  grade_awarded: QCGrade;
  inspected_by: number;
  inspection_date: string;
  certificate_url: string | null;
  remarks: string | null;
  created_at: string;
}

export interface WarehouseReceipt {
  id: number;
  wr_code: string;
  lot_id: number;
  farmer_id: number;
  issue_date: string;
  expiry_date: string;
  quantity_kg: number;
  grade: string;
  valuation: number;
  collateral_status: CollateralStatus;
  pledge_bank: string | null;
  loan_amount: number;
  status: WRStatus;
  enam_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  movement_code: string;
  type: MovementType;
  lot_id: number;
  from_warehouse_id: number | null;
  to_warehouse_id: number | null;
  quantity_kg: number;
  performed_by_id: number;
  movement_date: string;
  remarks: string | null;
  created_at: string;
}

export interface DispatchNote {
  id: number;
  dn_code: string;
  lot_id: number;
  commodity_desc: string;
  quantity_desc: string;
  destination: string;
  buyer_id: number | null;
  vehicle_reg: string;
  traccar_device_id: string | null;
  fleetbase_order_id: string | null;
  status: DispatchStatus;
  e_way_bill_no: string | null;
  delivery_pod_url: string | null;
  dispatch_date: string;
  delivery_date: string | null;
  timeline_events: DispatchTimelineEvent[];
  created_at: string;
  updated_at: string;
}

export interface DispatchTimelineEvent {
  id: number;
  dispatch_note_id: number;
  title: string;
  subtitle: string | null;
  is_done: boolean;
  is_active: boolean;
  event_order: number;
  event_date: string | null;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_code: string;
  buyer_id: number;
  commodity_id: number;
  grade: string;
  quantity_kg: number;
  price_per_mt: number;
  warehouse_id: number;
  status: POStatus;
  grn_id: string | null;
  payment_status: PaymentStatus;
  payment_ref: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  type: ActivityType;
  message: string;
  reference: string | null;
  user_id: number | null;
  created_at: string;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────

export interface DashboardStats {
  total_lots: number;
  total_farmers: number;
  total_warehouses: number;
  total_stock_mt: number;
  lots_by_status: Record<string, number>;
  lots_by_grade: Record<string, number>;
  recent_activity: ActivityLog[];
}

// ─── Auth ────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  farmerProfile: Farmer | null;
  fpo: FPO | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  phone: string;
  password: string;
}
