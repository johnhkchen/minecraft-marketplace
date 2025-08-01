// TypeScript interfaces from 000_consolidated_specification.md
// These are the unified interfaces that serve as contracts between frontend and backend

// =============================================================================
// PRICING SYSTEM
// =============================================================================

export enum CurrencyUnit {
  DIAMONDS = 'diamonds',
  DIAMOND_BLOCKS = 'diamond_blocks',
  EMERALDS = 'emeralds', 
  EMERALD_BLOCKS = 'emerald_blocks',
  IRON_INGOTS = 'iron_ingots',
  IRON_BLOCKS = 'iron_blocks'
}

export interface PriceInput {
  amount: number;
  unit: CurrencyUnit;
  notes?: string;
}

export interface ItemPrice {
  id: number;
  item_id: number;
  amount: number;
  currency_unit: CurrencyUnit;
  diamond_equivalent: number;
  notes?: string;
  is_current: boolean;
  created_at: Date;
}

export interface DisplayPrice {
  primary: string; // "2.5 Diamonds"
  conversions?: string[]; // ["0.28 DB", "3.1 EM"]
  age_indicator?: string; // "Updated 2 days ago"
  confidence?: 'high' | 'medium' | 'low'; // Based on report history
}

// =============================================================================
// AUTHENTICATION & AUTHORIZATION
// =============================================================================

export enum UserRole {
  USER = 'user',
  SHOP_OWNER = 'shop_owner', 
  ADMIN = 'admin'
}

export enum Permission {
  // Item management
  CREATE_ITEMS = 'create_items',
  EDIT_OWN_ITEMS = 'edit_own_items',
  EDIT_ANY_ITEMS = 'edit_any_items',
  DELETE_OWN_ITEMS = 'delete_own_items',
  DELETE_ANY_ITEMS = 'delete_any_items',
  
  // Reports
  SUBMIT_REPORTS = 'submit_reports',
  REVIEW_REPORTS = 'review_reports',
  VIEW_ALL_REPORTS = 'view_all_reports',
  
  // Users
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // System
  ACCESS_ADMIN = 'access_admin'
}

export interface UserSession {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  shop_name?: string;
  expires_at: Date;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: UserSession;
  loading: boolean;
  error?: string;
}

// =============================================================================
// ITEMS & CATEGORIES
// =============================================================================

export enum ItemCategory {
  BLOCKS = 'blocks',
  ITEMS = 'items', 
  TOOLS = 'tools',
  ARMOR = 'armor',
  FOOD = 'food',
  REDSTONE = 'redstone',
  DECORATIVE = 'decorative',
  OTHER = 'other'
}

export interface Item {
  id: number;
  name: string;
  description?: string;
  category: ItemCategory;
  stock_quantity: number;
  is_available: boolean;
  user_id: number;
  created_at: Date;
  updated_at: Date;
}

export interface PublicItem extends Omit<Item, 'user_id'> {
  seller_name: string;
  shop_name?: string;
  current_price?: DisplayPrice;
  price_history?: ItemPrice[];
}

export interface PrivateItem extends Item {
  // Includes private fields for owner
  views_count?: number;
  reports_count?: number;
}

// =============================================================================
// MARKET DATA & TRADING (from existing codebase)
// =============================================================================

export enum MarketActivity {
  DEAD = 'dead',
  LOW = 'low', 
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface TradeHistory {
  id: number;
  item_id: number;
  buyer_id?: number;
  seller_id?: number;
  qty_traded: number;
  price_per_unit: number;
  currency_unit: CurrencyUnit;
  total_value: number;
  diamond_equivalent_total: number;
  trade_source: string;
  notes?: string;
  created_at: Date;
}

export interface MarketData {
  item_name: string;
  current_sell_low?: number;
  current_sell_high?: number;
  current_buy_high?: number;
  current_buy_low?: number;
  last_trade_price?: number;
  last_trade_date?: Date;
  total_sell_volume: number;
  total_buy_interest: number;
  market_activity: MarketActivity;
  active_sellers: number;
  active_buyers: number;
  spread_percentage?: number;
}

export interface MarketReference {
  id: number;
  item_id: number;
  current_sell_low?: number;
  current_sell_high?: number;
  current_buy_high?: number;
  current_buy_low?: number;
  last_trade_price?: number;
  last_trade_date?: Date;
  total_sell_volume: number;
  total_buy_interest: number;
  market_activity: MarketActivity;
  spread_percentage?: number;
  active_sellers: number;
  active_buyers: number;
  last_updated: Date;
}

// =============================================================================
// COMMUNITY REPORTS
// =============================================================================

export enum ReportType {
  PRICE_CHANGE = 'price_change',
  OUT_OF_STOCK = 'out_of_stock', 
  BACK_IN_STOCK = 'back_in_stock',
  SHOP_CLOSED = 'shop_closed',
  INCORRECT_INFO = 'incorrect_info'
}

export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  AUTO_APPROVED = 'auto_approved'
}

export enum EvidenceType {
  SCREENSHOT = 'screenshot',
  TRANSACTION = 'transaction',
  SHOP_VISIT = 'shop_visit',
  EXTERNAL_LINK = 'external_link',
  WORD_OF_MOUTH = 'word_of_mouth'
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface Evidence {
  type: EvidenceType;
  
  // File evidence
  file_uuid?: string;
  
  // External evidence
  external_url?: string;
  
  // Context
  description: string;
  timestamp?: string; // When evidence was captured
  confidence_level: ConfidenceLevel;
}

export interface ReportSubmission {
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>; // Flexible based on report type
  evidence: Evidence[];
  reporter_contact?: string;
}

export interface CommunityReport {
  id: number;
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>;
  evidence: Evidence[];
  
  // Reporter info
  reporter_contact?: string;
  reporter_ip: string;
  
  // Review workflow
  status: ReportStatus;
  reviewed_by?: number;
  reviewed_at?: Date;
  review_notes?: string;
  
  created_at: Date;
}

// =============================================================================
// API CONTRACTS
// =============================================================================

// Authentication Endpoints
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  shop_name?: string;
  discord_contact?: string;
}

export interface RegisterResponse {
  user: PublicUser;
  session: UserSession;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: PublicUser;
  session: UserSession;
}

export interface MeResponse {
  user: PublicUser;
  session: UserSession;
}

// Items API
export interface ItemsQuery {
  category?: ItemCategory;
  search?: string;
  min_price?: number;
  max_price?: number;
  currency?: CurrencyUnit;
  available_only?: boolean;
  sort?: 'price_asc' | 'price_desc' | 'created_desc' | 'updated_desc';
  page?: number;
  limit?: number;
}

export interface ItemsResponse {
  items: PublicItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  filters_applied: ItemsQuery;
}

export interface CreateItemRequest {
  name: string;
  description?: string;
  category: ItemCategory;
  price: PriceInput;
  stock_quantity: number;
}

export interface CreateItemResponse {
  item: PrivateItem; // Includes private fields for owner
}

// Reports API
export interface CreateReportRequest {
  item_id: number;
  type: ReportType;
  description: string;
  suggested_changes?: Record<string, any>;
  evidence: Evidence[];
  reporter_contact?: string;
}

export interface CreateReportResponse {
  report: CommunityReport;
  message: string;
}

export interface ReportsQuery {
  item_id?: number;
  status?: ReportStatus;
  type?: ReportType;
  page?: number;
  limit?: number;
}

export interface ReportsResponse {
  reports: CommunityReport[];
  pagination: PaginationMeta;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export interface PublicUser {
  id: number;
  username: string;
  shop_name?: string;
  role: UserRole;
  created_at: Date;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  field?: string;
}