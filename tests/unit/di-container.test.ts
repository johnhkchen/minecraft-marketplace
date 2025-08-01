/**
 * Dependency Injection Container Tests
 * Foundation-first architecture validation with performance monitoring
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ServiceContainer } from "@shared/di/container";
import { measure, expectFastExecution } from "../utils/fast-test-setup";

// CONFIGURABLE - Update for your project
const TEST_DATA = {
  serviceName: 'testService',
  duplicateName: 'duplicate',
  nonSingletonName: 'nonSingleton',
  mockValue: 42
};

describe("ServiceContainer", () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe("Service Registration", () => {
    it("registers a service factory", () => {
      const { result, timeMs } = measure(() => {
        const mockService = { value: TEST_DATA.mockValue };
        container.register(TEST_DATA.serviceName, () => mockService);
        return container.has(TEST_DATA.serviceName);
      });
      
      expect(result).toBe(true);
      expectFastExecution(timeMs, 5);
    });

    it("throws error when registering duplicate service", () => {
      const { timeMs } = measure(() => {
        container.register(TEST_DATA.duplicateName, () => ({ value: 1 }));
        
        expect(() => {
          container.register(TEST_DATA.duplicateName, () => ({ value: 2 }));
        }).toThrow(`Service '${TEST_DATA.duplicateName}' is already registered`);
      });
      
      expectFastExecution(timeMs, 5);
    });

    it("allows non-singleton services", () => {
      const { result, timeMs } = measure(() => {
        const factory = () => ({ random: Math.random() });
        container.register(TEST_DATA.nonSingletonName, factory, false);
        
        const instance1 = container.get(TEST_DATA.nonSingletonName);
        const instance2 = container.get(TEST_DATA.nonSingletonName);
        
        return { instance1, instance2 };
      });
      
      expect(result.instance1).not.toBe(result.instance2);
      expectFastExecution(timeMs, 5);
    });
  });

  describe("Service Resolution", () => {
    it("resolves a registered service", () => {
      const { result, timeMs } = measure(() => {
        const mockService = { value: TEST_DATA.mockValue };
        container.register(TEST_DATA.serviceName, () => mockService);
        
        const resolved = container.get(TEST_DATA.serviceName);
        return { mockService, resolved };
      });
      
      expect(result.resolved).toBe(result.mockService);
      expectFastExecution(timeMs, 5);
    });

    it("should return same instance for singleton services", () => {
      const mockService = { value: 42 };
      container.register("singleton", () => mockService, true);
      
      const instance1 = container.get("singleton");
      const instance2 = container.get("singleton");
      
      expect(instance1).toBe(instance2);
    });

    it("should throw error for unregistered service", () => {
      expect(() => {
        container.get("nonExistent");
      }).toThrow("Service 'nonExistent' is not registered");
    });

    it("should detect circular dependencies", () => {
      container.register("serviceA", () => {
        return container.get("serviceB");
      });
      
      container.register("serviceB", () => {
        return container.get("serviceA");
      });
      
      expect(() => {
        container.get("serviceA");
      }).toThrow(/Circular dependency detected/);
    });
  });

  describe("Container Management", () => {
    it("should clear all services", () => {
      container.register("service1", () => ({ value: 1 }));
      container.register("service2", () => ({ value: 2 }));
      
      expect(container.getRegisteredServices()).toHaveLength(2);
      
      container.clear();
      
      expect(container.getRegisteredServices()).toHaveLength(0);
      expect(container.has("service1")).toBe(false);
    });

    it("should create child container with inherited services", () => {
      const parentService = { value: "parent" };
      container.register("parentService", () => parentService);
      
      const child = container.createChild();
      
      expect(child.has("parentService")).toBe(true);
      expect(child.get("parentService")).toBe(parentService);
    });

    it("should list all registered services", () => {
      container.register("service1", () => ({}));
      container.register("service2", () => ({}));
      container.register("service3", () => ({}));
      
      const services = container.getRegisteredServices();
      
      expect(services).toHaveLength(3);
      expect(services).toContain("service1");
      expect(services).toContain("service2");
      expect(services).toContain("service3");
    });
  });

  describe("Service Removal", () => {
    it("should unregister a service", () => {
      container.register("testService", () => ({ value: 42 }));
      
      expect(container.has("testService")).toBe(true);
      
      container.unregister("testService");
      
      expect(container.has("testService")).toBe(false);
    });
  });

  describe("Complex Dependencies", () => {
    interface DatabaseService {
      query: (sql: string) => string[];
    }

    interface UserRepository {
      findById: (id: string) => { id: string; name: string } | null;
    }

    interface UserService {
      getUser: (id: string) => { id: string; name: string } | null;
    }

    it("should resolve complex dependency chain", () => {
      // Register database service
      container.register<DatabaseService>("database", () => ({
        query: (sql: string) => [`result for: ${sql}`],
      }));

      // Register repository that depends on database
      container.register<UserRepository>("userRepository", () => {
        const db = container.get<DatabaseService>("database");
        return {
          findById: (id: string) => {
            const results = db.query(`SELECT * FROM users WHERE id = '${id}'`);
            return results.length > 0 ? { id, name: `User ${id}` } : null;
          },
        };
      });

      // Register service that depends on repository
      container.register<UserService>("userService", () => {
        const repo = container.get<UserRepository>("userRepository");
        return {
          getUser: (id: string) => repo.findById(id),
        };
      });

      // Test the full chain
      const userService = container.get<UserService>("userService");
      const user = userService.getUser("123");

      expect(user).toEqual({ id: "123", name: "User 123" });
    });
  });
});