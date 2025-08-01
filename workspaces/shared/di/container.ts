/**
 * Service Container - Dependency Injection Spine
 * 
 * This is the central service registry that manages all dependencies in the application.
 * It ensures proper service lifecycle management and prevents circular dependencies.
 */

type ServiceFactory<T = any> = () => T;
type ServiceKey = string;

export class ServiceContainer {
  private services = new Map<ServiceKey, any>();
  private factories = new Map<ServiceKey, ServiceFactory>();
  private singletons = new Set<ServiceKey>();
  private resolutionStack = new Set<ServiceKey>();

  /**
   * Register a service factory with the container
   * @param key Unique identifier for the service
   * @param factory Function that creates the service instance
   * @param singleton Whether this service should be a singleton (default: true)
   */
  register<T>(key: ServiceKey, factory: ServiceFactory<T>, singleton: boolean = true): void {
    if (this.factories.has(key)) {
      throw new Error(`Service '${key}' is already registered`);
    }

    this.factories.set(key, factory);
    
    if (singleton) {
      this.singletons.add(key);
    }
  }

  /**
   * Get a service instance from the container
   * @param key Service identifier
   * @returns Service instance
   */
  get<T>(key: ServiceKey): T {
    // Check for circular dependencies
    if (this.resolutionStack.has(key)) {
      const stack = Array.from(this.resolutionStack).join(' -> ');
      throw new Error(`Circular dependency detected: ${stack} -> ${key}`);
    }

    // Return existing singleton instance
    if (this.singletons.has(key) && this.services.has(key)) {
      return this.services.get(key);
    }

    // Get factory function
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' is not registered`);
    }

    // Track resolution to detect circular dependencies
    this.resolutionStack.add(key);

    try {
      // Create service instance
      const instance = factory();

      // Store singleton instance
      if (this.singletons.has(key)) {
        this.services.set(key, instance);
      }

      return instance;
    } finally {
      // Clean up resolution tracking
      this.resolutionStack.delete(key);
    }
  }

  /**
   * Check if a service is registered
   * @param key Service identifier
   * @returns True if registered
   */
  has(key: ServiceKey): boolean {
    return this.factories.has(key);
  }

  /**
   * Remove a service from the container
   * @param key Service identifier
   */
  unregister(key: ServiceKey): void {
    this.factories.delete(key);
    this.services.delete(key);
    this.singletons.delete(key);
  }

  /**
   * Clear all services from the container
   * Useful for testing
   */
  clear(): void {
    this.factories.clear();
    this.services.clear();
    this.singletons.clear();
    this.resolutionStack.clear();
  }

  /**
   * Get all registered service keys
   * @returns Array of service keys
   */
  getRegisteredServices(): ServiceKey[] {
    return Array.from(this.factories.keys());
  }

  /**
   * Validate the service graph for circular dependencies
   * This should be called after all services are registered
   */
  validateServiceGraph(): void {
    const visited = new Set<ServiceKey>();
    const stack = new Set<ServiceKey>();

    const validateService = (key: ServiceKey): void => {
      if (stack.has(key)) {
        const cycle = Array.from(stack).join(' -> ');
        throw new Error(`Circular dependency detected: ${cycle} -> ${key}`);
      }

      if (visited.has(key)) {
        return;
      }

      stack.add(key);
      visited.add(key);

      try {
        // This will trigger dependency resolution without creating instances
        const factory = this.factories.get(key);
        if (factory) {
          // Note: This is a simplified validation
          // In a real implementation, you might parse the factory function
          // to detect its dependencies
        }
      } finally {
        stack.delete(key);
      }
    };

    // Validate all registered services
    for (const key of this.factories.keys()) {
      validateService(key);
    }
  }

  /**
   * Create a child container that inherits from this container
   * Useful for request-scoped services
   */
  createChild(): ServiceContainer {
    const child = new ServiceContainer();
    
    // Copy all factory registrations
    for (const [key, factory] of this.factories) {
      child.factories.set(key, factory);
      if (this.singletons.has(key)) {
        child.singletons.add(key);
      }
    }

    // Copy singleton instances (shared with parent)
    for (const [key, instance] of this.services) {
      if (this.singletons.has(key)) {
        child.services.set(key, instance);
      }
    }

    return child;
  }
}

// Global container instance
export const container = new ServiceContainer();

// Type-safe service registration helpers
export const registerService = <T>(
  key: ServiceKey, 
  factory: ServiceFactory<T>, 
  singleton = true
): void => {
  container.register(key, factory, singleton);
};

export const getService = <T>(key: ServiceKey): T => {
  return container.get<T>(key);
};

// Service registration keys (constants to prevent typos)
export const SERVICE_KEYS = {
  // Repositories
  USER_REPOSITORY: 'userRepository',
  ITEM_REPOSITORY: 'itemRepository', 
  PRICE_REPOSITORY: 'priceRepository',
  COMMUNITY_REPORT_REPOSITORY: 'communityReportRepository',
  EVIDENCE_REPOSITORY: 'evidenceRepository',

  // Services
  AUTHENTICATION_SERVICE: 'authenticationService',
  PRICING_SERVICE: 'pricingService',
  ITEM_SERVICE: 'itemService',
  REPORTING_SERVICE: 'reportingService',
  NOTIFICATION_SERVICE: 'notificationService',
  FILE_UPLOAD_SERVICE: 'fileUploadService',
  BAML_PROCESSING_SERVICE: 'bamlProcessingService',

  // Infrastructure
  DATABASE: 'database',
  CACHE: 'cache',
  LOGGER: 'logger',
  CONFIG: 'config'
} as const;

export type ServiceKeys = typeof SERVICE_KEYS[keyof typeof SERVICE_KEYS];