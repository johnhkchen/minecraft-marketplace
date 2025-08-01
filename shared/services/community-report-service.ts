/**
 * Community Report Service - SPEC Epic 2 Implementation
 * Evidence-based reporting with confidence scoring
 */

import { v4 as uuidv4 } from 'uuid';

export type ReportType = 'price_change' | 'stock_update' | 'shop_closure' | 'item_unavailable';
export type ReportStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface CreateReportData {
  item_id: string;
  reporter_id: string;
  report_type: ReportType;
  description: string;
}

export interface ReporterHistory {
  approved_reports: number;
  total_reports: number;
}

export interface CommunityReport {
  id: string;
  status: ReportStatus;
  item_id: string;
  reporter_id: string;
  report_type: ReportType;
  description: string;
  created_at: string;
  confidence_level?: ConfidenceLevel;
}

export class CommunityReportService {
  async createReport(reportData: CreateReportData): Promise<CommunityReport> {
    // Generate unique ID and timestamp
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    // Default status is pending (will be enhanced with confidence scoring)
    const status: ReportStatus = 'pending';
    
    return {
      id,
      status,
      created_at,
      ...reportData
    };
  }

  async createReportWithHistory(reportData: CreateReportData, reporterHistory: ReporterHistory): Promise<CommunityReport> {
    // Generate unique ID and timestamp
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    // SPEC Auto-approval rules: High confidence stock status changes auto-approve
    const isEstablishedReporter = reporterHistory.approved_reports > 5;  // SPEC requirement
    const isStockUpdate = reportData.report_type === 'stock_update';
    
    let status: ReportStatus = 'pending';
    let confidence_level: ConfidenceLevel = 'medium';
    
    if (isEstablishedReporter && isStockUpdate) {
      status = 'auto_approved';
      confidence_level = 'high';
    }
    
    return {
      id,
      status,
      created_at,
      confidence_level,
      ...reportData
    };
  }
}