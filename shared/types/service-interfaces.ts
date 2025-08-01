/**
 * Core Service Interfaces - Foundation Layer
 * 
 * These interfaces define the contracts for all services in the application.
 * They must be defined before any implementations to ensure proper dependency management.
 */

// ============================================================================
// Domain Entity Types
// ============================================================================

export interface User {
  id: string;
  discordId: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  shopName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Item {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  processedDescription?: string; // BAML processed
  category: ItemCategory;
  minecraftId: string;
  enchantments?: Record<string, number>;
  itemAttributes?: Record<string, any>; // BAML extracted
  stockQuantity: number;
  isAvailable: boolean;
  serverName?: string;
  shopLocation?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Price {
  id: string;
  itemId: string;
  priceDiamonds: number;
  tradingUnit: TradingUnitType;
  isCurrent: boolean;
  source: string;
  createdBy: string;
  createdAt: Date;
}

export interface CommunityReport {
  id: string;
  itemId: string;
  reporterId: string;
  reportType: ReportType;
  description: string;
  status: ReportStatus;
  confidenceLevel?: ConfidenceLevel;
  autoApproved: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
}

export interface Evidence {
  id: string;
  reportId: string;
  evidenceType: EvidenceType;
  filePath?: string;
  externalUrl?: string;
  description?: string;
  timestampCaptured?: Date;
  minecraftServer?: string;
  coordinates?: string;
  verifiedBy?: string;
  createdAt: Date;
}

// ============================================================================
// Enum Types
// ============================================================================

export type UserRole = 'user' | 'shop_owner' | 'moderator' | 'admin';
export type ItemCategory = 'tools' | 'armor' | 'blocks' | 'food' | 'misc';
export type TradingUnitType = 'per_item' | 'per_stack' | 'per_shulker' | 'per_dozen';
export type ReportType = 'price_change' | 'stock_status' | 'shop_closure' | 'incorrect_info';
export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type EvidenceType = 'screenshot' | 'transaction_record' | 'description' | 'external_link';

// ============================================================================
// Repository Interfaces (Data Layer)
// ============================================================================

export interface StorageRepository<T> {
  save(entity: T): Promise<T>;
  findById(id: string): Promise<T | null>;
  findAll(criteria?: Partial<T>): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

export interface UserRepository extends StorageRepository<User> {
  findByDiscordId(discordId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}

export interface ItemRepository extends StorageRepository<Item> {
  findByOwnerId(ownerId: string): Promise<Item[]>;
  findByCategory(category: ItemCategory): Promise<Item[]>;
  findByMinecraftId(minecraftId: string): Promise<Item[]>;
  searchItems(query: string): Promise<Item[]>;
  findAvailable(): Promise<Item[]>;
}

export interface PriceRepository extends StorageRepository<Price> {
  findByItemId(itemId: string): Promise<Price[]>;
  findCurrentPrices(): Promise<Price[]>;
  updateCurrentPrice(itemId: string, newPrice: Price): Promise<void>;
}

export interface CommunityReportRepository extends StorageRepository<CommunityReport> {
  findByItemId(itemId: string): Promise<CommunityReport[]>;
  findByReporterId(reporterId: string): Promise<CommunityReport[]>;
  findByStatus(status: ReportStatus): Promise<CommunityReport[]>;
  findPendingReports(): Promise<CommunityReport[]>;
}

export interface EvidenceRepository extends StorageRepository<Evidence> {
  findByReportId(reportId: string): Promise<Evidence[]>;
  findByType(evidenceType: EvidenceType): Promise<Evidence[]>;
}

// ============================================================================
// Service Interfaces (Business Logic Layer)
// ============================================================================

export interface AuthenticationService {
  authenticate(discordToken: string): Promise<User>;
  validateSession(sessionId: string): Promise<User | null>;
  createSession(user: User): Promise<string>;
  destroySession(sessionId: string): Promise<void>;
  generateJWT(user: User): Promise<string>;
  validateJWT(token: string): Promise<User | null>;
}

export interface PricingService {
  calculatePrice(item: Item, tradingUnit: TradingUnitType): Price;
  formatPriceDisplay(price: Price): string;
  convertTradingUnits(price: Price, fromUnit: TradingUnitType, toUnit: TradingUnitType): Price;
  validatePriceChange(oldPrice: Price, newPrice: Price): boolean;
}

export interface ItemService {
  createItem(itemData: CreateItemRequest, userId: string): Promise<Item>;
  updateItem(itemId: string, updates: Partial<Item>, userId: string): Promise<Item>;
  deleteItem(itemId: string, userId: string): Promise<void>;
  getItem(itemId: string): Promise<Item | null>;
  searchItems(query: SearchItemsRequest): Promise<Item[]>;
  getUserItems(userId: string): Promise<Item[]>;
}

export interface ReportingService {
  submitReport(report: CreateReportRequest, userId: string): Promise<CommunityReport>;
  reviewReport(reportId: string, decision: ReportDecision, reviewerId: string): Promise<CommunityReport>;
  calculateConfidence(evidence: Evidence[]): ConfidenceLevel;
  getReportsForItem(itemId: string): Promise<CommunityReport[]>;
  getPendingReports(): Promise<CommunityReport[]>;
}

export interface NotificationService {
  send(notification: Notification): Promise<void>;
  sendBulk(notifications: Notification[]): Promise<void>;
  scheduleNotification(notification: Notification, delay: number): Promise<void>;
}

export interface FileUploadService {
  uploadFile(file: FileUpload, userId: string): Promise<string>;
  validateFile(file: FileUpload): boolean;
  deleteFile(filePath: string): Promise<void>;
  getFileUrl(filePath: string): string;
}

export interface BAMLProcessingService {
  processDescription(description: string): Promise<ProcessedDescription>;
  extractMetadata(item: Item): Promise<ItemMetadata>;
  standardizeItemData(item: Item): Promise<Item>;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateItemRequest {
  name: string;
  description: string;
  category: ItemCategory;
  minecraftId: string;
  stockQuantity: number;
  serverName?: string;
  shopLocation?: string;
  price: number;
  tradingUnit: TradingUnitType;
}

export interface SearchItemsRequest {
  query?: string;
  category?: ItemCategory;
  minPrice?: number;
  maxPrice?: number;
  tradingUnit?: TradingUnitType;
  serverName?: string;
  availableOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateReportRequest {
  itemId: string;
  reportType: ReportType;
  description: string;
  evidence?: EvidenceData[];
}

export interface EvidenceData {
  evidenceType: EvidenceType;
  filePath?: string;
  externalUrl?: string;
  description?: string;
  timestampCaptured?: Date;
  minecraftServer?: string;
  coordinates?: string;
}

export interface ReportDecision {
  approved: boolean;
  notes?: string;
}

export interface Notification {
  type: string;
  recipient: string;
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface FileUpload {
  filename: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}

export interface ProcessedDescription {
  standardized: string;
  extractedData: Record<string, any>;
  confidence: number;
}

export interface ItemMetadata {
  enchantments: Record<string, number>;
  attributes: Record<string, any>;
  category: ItemCategory;
  rarity?: string;
}

// ============================================================================
// Configuration Interfaces
// ============================================================================

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

export interface ServiceConfig {
  discord: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    webhookUrl: string;
  };
  baml: {
    apiKey: string;
    model: string;
  };
  upload: {
    maxSize: number;
    allowedTypes: string[];
    path: string;
  };
  security: {
    jwtSecret: string;
    corsOrigin: string;
    rateLimitWindow: number;
    rateLimitMax: number;
  };
}