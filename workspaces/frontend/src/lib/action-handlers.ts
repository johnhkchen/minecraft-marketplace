/**
 * Action Handlers for Enhanced HATEOAS Filtering
 * TDD-driven implementation for marketplace item actions
 */

export interface ActionHandlers {
  copyWarp: (warpCommand: string) => Promise<void>;
  editListing: (itemId: string) => Promise<void>;
  updateStock: (itemId: string, newQuantity: number) => Promise<void>;
  reportPrice: (itemId: string, newPrice: number) => Promise<void>;
  verifyItem: (itemId: string) => Promise<void>;
}

/**
 * Default implementation of ActionHandlers
 * Uses browser APIs and simulated backend calls for TDD testing
 */
export class MarketplaceActionHandlers implements ActionHandlers {
  
  /**
   * Copy warp command to clipboard
   */
  async copyWarp(warpCommand: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(warpCommand);
        console.log(`✅ Copied warp command: ${warpCommand}`);
        
        // Show user feedback (could be replaced with toast notification)
        this.showNotification(`Copied: ${warpCommand}`, 'success');
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = warpCommand;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        console.log(`✅ Copied warp command (fallback): ${warpCommand}`);
        this.showNotification(`Copied: ${warpCommand}`, 'success');
      }
    } catch (error) {
      console.error('Failed to copy warp command:', error);
      this.showNotification('Failed to copy warp command', 'error');
      throw error;
    }
  }

  /**
   * Edit listing - redirect to edit page or open modal
   */
  async editListing(itemId: string): Promise<void> {
    try {
      console.log(`🔧 Editing listing: ${itemId}`);
      
      // In a real app, this would either:
      // 1. Navigate to edit page: window.location.href = `/edit/${itemId}`
      // 2. Open edit modal: openEditModal(itemId)
      // 3. Make API call to get item data for editing
      
      // For TDD testing, we'll simulate the API call
      const response = await fetch(`/api/internal/items/${itemId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch item for editing: ${response.statusText}`);
      }
      
      const itemData = await response.json();
      console.log(`✅ Loaded item for editing:`, itemData);
      
      // This would open the edit interface
      this.showNotification(`Opening editor for ${itemData.name || itemId}`, 'info');
      
    } catch (error) {
      console.error('Failed to edit listing:', error);
      this.showNotification('Failed to open editor', 'error');
      throw error;
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(itemId: string, newQuantity: number): Promise<void> {
    try {
      console.log(`📦 Updating stock for ${itemId}: ${newQuantity}`);
      
      const response = await fetch(`/api/internal/items/${itemId}/stock`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ stock_quantity: newQuantity })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update stock: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Stock updated:`, result);
      
      this.showNotification(`Stock updated to ${newQuantity}`, 'success');
      
      // Trigger a refresh of the marketplace data
      this.triggerDataRefresh();
      
    } catch (error) {
      console.error('Failed to update stock:', error);
      this.showNotification('Failed to update stock', 'error');
      throw error;
    }
  }

  /**
   * Report price change
   */
  async reportPrice(itemId: string, newPrice: number): Promise<void> {
    try {
      console.log(`💰 Reporting price change for ${itemId}: ${newPrice} diamonds`);
      
      const response = await fetch('/api/v1/reports/price', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_id: itemId,
          reported_price: newPrice,
          report_type: 'price_change',
          description: `Price reported as ${newPrice} diamonds`
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to report price: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Price report submitted:`, result);
      
      this.showNotification(`Price report submitted: ${newPrice} diamonds`, 'success');
      
    } catch (error) {
      console.error('Failed to report price:', error);
      this.showNotification('Failed to submit price report', 'error');
      throw error;
    }
  }

  /**
   * Verify item (moderator action)
   */
  async verifyItem(itemId: string): Promise<void> {
    try {
      console.log(`✅ Verifying item: ${itemId}`);
      
      const response = await fetch(`/api/v1/items/${itemId}/verify`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verified_at: new Date().toISOString(),
          confidence_level: 'high'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to verify item: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`✅ Item verified:`, result);
      
      this.showNotification('Item verified successfully', 'success');
      
      // Trigger a refresh of the marketplace data
      this.triggerDataRefresh();
      
    } catch (error) {
      console.error('Failed to verify item:', error);
      this.showNotification('Failed to verify item', 'error');
      throw error;
    }
  }

  /**
   * Helper: Get authentication token
   */
  private getAuthToken(): string {
    // In a real app, this would get the JWT token from localStorage, sessionStorage, or a store
    return localStorage.getItem('auth_token') || 'mock_token_for_testing';
  }

  /**
   * Helper: Show notification to user
   */
  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    // In a real app, this would use a toast library or notification system
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // For testing, we can create a simple notification
    if (typeof document !== 'undefined') {
      const notification = document.createElement('div');
      notification.textContent = message;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 16px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
      `;
      
      document.body.appendChild(notification);
      
      // Remove after 3 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 3000);
    }
  }

  /**
   * Helper: Trigger data refresh in the application
   */
  private triggerDataRefresh(): void {
    // In a real app, this would trigger a store update or emit an event
    console.log('🔄 Triggering marketplace data refresh');
    
    // Emit a custom event that components can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('marketplaceDataChanged'));
    }
  }
}

/**
 * Factory function to create ActionHandlers instance
 */
export function createActionHandlers(): ActionHandlers {
  return new MarketplaceActionHandlers();
}

/**
 * Mock ActionHandlers for testing
 */
export class MockActionHandlers implements ActionHandlers {
  public calls: Array<{ method: string; args: any[] }> = [];

  async copyWarp(warpCommand: string): Promise<void> {
    this.calls.push({ method: 'copyWarp', args: [warpCommand] });
    console.log(`MOCK: copyWarp(${warpCommand})`);
  }

  async editListing(itemId: string): Promise<void> {
    this.calls.push({ method: 'editListing', args: [itemId] });
    console.log(`MOCK: editListing(${itemId})`);
  }

  async updateStock(itemId: string, newQuantity: number): Promise<void> {
    this.calls.push({ method: 'updateStock', args: [itemId, newQuantity] });
    console.log(`MOCK: updateStock(${itemId}, ${newQuantity})`);
  }

  async reportPrice(itemId: string, newPrice: number): Promise<void> {
    this.calls.push({ method: 'reportPrice', args: [itemId, newPrice] });
    console.log(`MOCK: reportPrice(${itemId}, ${newPrice})`);
  }

  async verifyItem(itemId: string): Promise<void> {
    this.calls.push({ method: 'verifyItem', args: [itemId] });
    console.log(`MOCK: verifyItem(${itemId})`);
  }

  reset(): void {
    this.calls = [];
  }
}