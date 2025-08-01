/**
 * Minecraft Domain Guide for Developers
 * 
 * Understanding the business domain without being a Minecraft expert
 * Use this reference when working on marketplace features
 */

export const MINECRAFT_DOMAIN_GUIDE = {
  /**
   * Currency System - Diamond-based Economy
   */
  currency: {
    diamonds: {
      description: "Base currency unit (like cents in USD)",
      example: "1 diamond = basic unit of trade",
      usage: "Store prices as integer diamonds in database"
    },
    diamondBlocks: {
      description: "Display currency for large amounts (like dollars)",
      conversion: "1 diamond block = 9 diamonds",
      example: "Display '2.5 diamond blocks' instead of '22 diamonds'",
      usage: "Frontend display only, always store as diamonds"
    },
    economicScale: {
      cheap: "1-10 diamonds (basic tools, food)",
      moderate: "10-50 diamonds (weapons, armor)", 
      expensive: "50+ diamonds (rare items, enchanted gear)",
      luxury: "100+ diamonds (special items, bulk trades)"
    }
  },

  /**
   * Trading Units - How Items Are Sold
   */
  tradingUnits: {
    per_item: {
      description: "Single item (1 sword, 1 pickaxe)",
      example: "Diamond Sword - 5 diamonds per item",
      usage: "Default for tools, weapons, armor"
    },
    per_stack: {
      description: "64 items (Minecraft stack size)",
      example: "Cobblestone - 2 diamonds per stack (64 blocks)",
      usage: "Common for blocks, materials, food"
    },
    per_shulker: {
      description: "1,728 items (27 stacks in a shulker box)",
      calculation: "27 stacks × 64 items = 1,728 items",
      example: "Dirt - 50 diamonds per shulker (1,728 blocks)",
      usage: "Bulk sales, storage optimization"
    },
    per_dozen: {
      description: "12 items (like real-world dozen)",
      example: "Eggs - 1 diamond per dozen",
      usage: "Small consumables, special cases"
    }
  },

  /**
   * Server Types - Different Minecraft Environments  
   */
  servers: {
    HermitCraft: {
      description: "Popular YouTube server with content creators",
      economy: "High-value, established economy",
      analogy: "Like trading on Wall Street - established, high stakes",
      characteristics: ["Advanced builds", "Mature economy", "High-value trades"]
    },
    CreativeWorld: {
      description: "Building-focused server with unlimited resources",
      economy: "Focus on rare/decorative items",
      analogy: "Like an art market - aesthetics matter more than utility",
      characteristics: ["Unlimited blocks", "Focus on design", "Rare items valued"]
    },
    SurvivalWorld: {
      description: "Resource-gathering focused server",
      economy: "Utility-based, survival necessities",
      analogy: "Like a frontier market - practical goods in demand",
      characteristics: ["Resource scarcity", "Tool durability matters", "Food important"]
    }
  },

  /**
   * Item Categories - What Players Trade
   */
  itemCategories: {
    weapons: {
      description: "Combat tools (swords, bows, crossbows)",
      priceFactors: ["Damage", "Durability", "Enchantments"],
      examples: ["Diamond Sword", "Netherite Axe", "Enchanted Bow"]
    },
    tools: {
      description: "Resource gathering tools (pickaxes, shovels, axes)",
      priceFactors: ["Efficiency", "Durability", "Mining level"],
      examples: ["Diamond Pickaxe", "Silk Touch Shovel", "Fortune Axe"]
    },
    armor: {
      description: "Protection gear (helmets, chestplates, leggings, boots)",
      priceFactors: ["Protection level", "Durability", "Enchantments"],
      examples: ["Diamond Chestplate", "Netherite Helmet", "Elytra"]
    },
    blocks: {
      description: "Building materials (stone, wood, rare blocks)",
      priceFactors: ["Rarity", "Aesthetic value", "Functionality"],
      examples: ["Netherite Block", "Dragon Egg", "Beacon"]
    },
    food: {
      description: "Consumables for health/hunger (bread, steak, golden apples)",
      priceFactors: ["Hunger restoration", "Status effects", "Rarity"],
      examples: ["Golden Apple", "Enchanted Golden Apple", "Cake"]
    },
    misc: {
      description: "Everything else (redstone, potions, maps)",
      priceFactors: ["Utility", "Crafting value", "Rarity"],
      examples: ["Elytra", "Shulker Box", "Mending Book"]
    }
  },

  /**
   * Community Reporting - Trust & Verification System
   */
  reportingSystem: {
    confidenceLevels: {
      high: {
        description: "Screenshot + record + established reporter",
        requirements: ["Visual proof", "Transaction history", "Trusted user"],
        autoApproval: "Yes - can auto-approve stock changes",
        example: "Regular trader with screenshot and transaction log"
      },
      medium: {
        description: "Screenshot OR record (not both)",
        requirements: ["Some proof provided", "Basic verification"],
        autoApproval: "Manual review required",
        example: "New user with screenshot but no transaction history"
      },
      low: {
        description: "Description only, no proof",
        requirements: ["Text description only"],
        autoApproval: "No - requires manual verification",
        example: "User reports price change but provides no evidence"
      }
    },
    reportTypes: {
      price_change: {
        description: "Item price has changed",
        impact: "Updates marketplace pricing",
        verification: "Compare with recent transactions"
      },
      stock_change: {
        description: "Item availability has changed",
        impact: "Updates inventory status",
        verification: "Check with shop owner"
      },
      quality_change: {
        description: "Item condition/enchantments changed",
        impact: "Updates item metadata",
        verification: "Requires screenshot proof"
      },
      shop_closure: {
        description: "Shop is no longer operating",
        impact: "Removes all shop listings",
        verification: "High confidence required"
      }
    }
  },

  /**
   * Realistic Test Data - Use These in Tests
   */
  testData: {
    users: {
      main_trader: 'steve',
      alt_trader: 'alex', 
      admin_user: 'notch',
      new_user: 'herobrine'
    },
    items: {
      primary: {
        name: 'Diamond Sword',
        id: 'diamond_sword',
        category: 'weapons',
        price: 5
      },
      secondary: {
        name: 'Iron Pickaxe',
        id: 'iron_pickaxe', 
        category: 'tools',
        price: 3
      },
      bulk: {
        name: 'Cobblestone',
        id: 'cobblestone',
        category: 'blocks',
        price: 2,
        unit: 'per_stack'
      }
    },
    servers: {
      primary: 'HermitCraft',
      secondary: 'CreativeWorld',
      test: 'TestServer'
    },
    locations: {
      spawn: 'spawn_market',
      diamond_district: 'diamond_district',
      shopping_district: 'shopping_district'
    }
  }
};

/**
 * Helper Functions for Domain Logic
 */
export const DomainHelpers = {
  /**
   * Convert diamonds to diamond blocks for display
   */
  formatCurrency(diamonds: number): string {
    if (diamonds >= 9) {
      const blocks = Math.floor(diamonds / 9);
      const remaining = diamonds % 9;
      
      if (remaining === 0) {
        return `${blocks} diamond blocks`;
      } else {
        return `${blocks}.${Math.round(remaining * 10 / 9)} diamond blocks`;
      }
    }
    return `${diamonds} diamonds`;
  },

  /**
   * Calculate total price based on trading unit
   */
  calculateTotalPrice(pricePerUnit: number, tradingUnit: string, quantity: number = 1): number {
    const multipliers = {
      per_item: 1,
      per_stack: 64,
      per_shulker: 1728,
      per_dozen: 12
    };
    
    const multiplier = multipliers[tradingUnit as keyof typeof multipliers] || 1;
    return pricePerUnit * multiplier * quantity;
  },

  /**
   * Validate if an item category is valid
   */
  isValidCategory(category: string): boolean {
    return Object.keys(MINECRAFT_DOMAIN_GUIDE.itemCategories).includes(category);
  },

  /**
   * Get realistic price range for category
   */
  getPriceRange(category: string): { min: number; max: number } {
    const ranges = {
      weapons: { min: 3, max: 20 },
      tools: { min: 2, max: 15 },
      armor: { min: 4, max: 25 },
      blocks: { min: 1, max: 100 },
      food: { min: 1, max: 10 },
      misc: { min: 1, max: 50 }
    };
    
    return ranges[category as keyof typeof ranges] || { min: 1, max: 10 };
  }
};

/**
 * Usage Examples for Tests
 */
export const DomainExamples = {
  /**
   * Create a realistic item listing
   */
  createRealisticItem(overrides: Partial<any> = {}) {
    const { items, users, servers } = MINECRAFT_DOMAIN_GUIDE.testData;
    
    return {
      id: 1,
      name: items.primary.name,
      category: items.primary.category,
      minecraft_id: items.primary.id,
      price_diamonds: items.primary.price,
      trading_unit: 'per_item',
      owner_id: users.main_trader,
      server_name: servers.primary,
      is_available: true,
      created_at: new Date().toISOString(),
      ...overrides
    };
  },

  /**
   * Create a realistic community report
   */
  createRealisticReport(overrides: Partial<any> = {}) {
    const { users, items } = MINECRAFT_DOMAIN_GUIDE.testData;
    
    return {
      id: 'report-123',
      item_id: 'item-456',
      item_name: items.primary.name,
      reporter_id: users.alt_trader,
      report_type: 'price_change',
      description: `Price changed from 4 to 5 diamonds`,
      confidence_level: 'medium',
      evidence_type: 'screenshot',
      created_at: new Date().toISOString(),
      ...overrides
    };
  }
};

/**
 * For Newcomers: You Don't Need to Memorize This!
 * 
 * This guide exists so you can:
 * 1. Understand test data when you see "steve" or "Diamond Sword"
 * 2. Create realistic test scenarios
 * 3. Understand business rules (like trading units)
 * 4. Not worry about Minecraft mechanics while coding
 * 
 * Just reference this file when you need domain context.
 * Focus on the programming - the domain knowledge is captured here.
 */