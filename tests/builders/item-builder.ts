/**
 * Fluent Test Data Builder for Items
 * 
 * Provides a readable, composable way to create test data that reads like
 * business specifications rather than technical object construction.
 */

import type { Item, ItemCategory } from '../../workspaces/shared/types/service-interfaces.js';

export class ItemBuilder {
  private item: Partial<Item> = {};

  /**
   * Creates a basic valid item with minimal required fields
   */
  static create(): ItemBuilder {
    return new ItemBuilder()
      .withOwner('user_123')
      .withName('Test Item')
      .withCategory('materials')
      .withMinecraftId('test_item')
      .withStock(1)
      .available();
  }

  /**
   * Creates a Diamond Sword - common test case for weapons
   */
  static diamondSword(): ItemBuilder {
    return ItemBuilder.create()
      .withName('Diamond Sword')
      .withCategory('weapons')
      .withMinecraftId('diamond_sword')
      .withDescription('Sharp diamond sword with Sharpness V')
      .withStock(5)
      .withEnchantments({
        sharpness: 5,
        unbreaking: 3
      });
  }

  /**
   * Creates an Enchanted Book - common test case for materials
   */
  static enchantedBook(): ItemBuilder {
    return ItemBuilder.create()
      .withName('Enchanted Book')
      .withCategory('materials')
      .withMinecraftId('enchanted_book')
      .withDescription('Contains powerful magic')
      .withEnchantments({
        mending: 1,
        efficiency: 4
      });
  }

  /**
   * Creates an Iron Pickaxe - common test case for tools
   */
  static ironPickaxe(): ItemBuilder {
    return ItemBuilder.create()
      .withName('Iron Pickaxe')
      .withCategory('tools')
      .withMinecraftId('iron_pickaxe')
      .withDescription('Durable mining tool')
      .withStock(10);
  }

  /**
   * Creates a Netherite Helmet - common test case for armor
   */
  static netheriteHelmet(): ItemBuilder {
    return ItemBuilder.create()
      .withName('Netherite Helmet')
      .withCategory('armor')
      .withMinecraftId('netherite_helmet')
      .withDescription('Ultimate protection gear')
      .withStock(2)
      .withEnchantments({
        protection: 4,
        unbreaking: 3,
        mending: 1
      });
  }

  /**
   * Creates a Diamond Block - common test case for blocks
   */
  static diamondBlock(): ItemBuilder {
    return ItemBuilder.create()
      .withName('Diamond Block')
      .withCategory('blocks')
      .withMinecraftId('diamond_block')
      .withDescription('Valuable building material')
      .withStock(32);
  }

  // Builder methods for fluent construction

  withOwner(ownerId: string): ItemBuilder {
    this.item.ownerId = ownerId;
    return this;
  }

  withName(name: string): ItemBuilder {
    this.item.name = name;
    return this;
  }

  withCategory(category: ItemCategory): ItemBuilder {
    this.item.category = category;
    return this;
  }

  withMinecraftId(minecraftId: string): ItemBuilder {
    this.item.minecraftId = minecraftId;
    return this;
  }

  withStock(quantity: number): ItemBuilder {
    this.item.stockQuantity = quantity;
    return this;
  }

  withDescription(description: string): ItemBuilder {
    this.item.description = description;
    return this;
  }

  withProcessedDescription(processedDescription: string): ItemBuilder {
    this.item.processedDescription = processedDescription;
    return this;
  }

  withEnchantments(enchantments: Record<string, number>): ItemBuilder {
    this.item.enchantments = enchantments;
    return this;
  }

  withAttributes(attributes: Record<string, any>): ItemBuilder {
    this.item.itemAttributes = attributes;
    return this;
  }

  withServer(serverName: string): ItemBuilder {
    this.item.serverName = serverName;
    return this;
  }

  withShopLocation(location: string): ItemBuilder {
    this.item.shopLocation = location;
    return this;
  }

  available(): ItemBuilder {
    this.item.isAvailable = true;
    return this;
  }

  unavailable(): ItemBuilder {
    this.item.isAvailable = false;
    return this;
  }

  outOfStock(): ItemBuilder {
    this.item.stockQuantity = 0;
    return this;
  }

  // Validation test helpers - create invalid data for specific test scenarios

  withInvalidOwner(): ItemBuilder {
    this.item.ownerId = '';
    return this;
  }

  withEmptyName(): ItemBuilder {
    this.item.name = '';
    return this;
  }

  withWhitespaceName(): ItemBuilder {
    this.item.name = '   ';
    return this;
  }

  withNegativeStock(): ItemBuilder {
    this.item.stockQuantity = -1;
    return this;
  }

  withInvalidMinecraftId(): ItemBuilder {
    this.item.minecraftId = 'Invalid-ID With Spaces!';
    return this;
  }

  withNullCategory(): ItemBuilder {
    this.item.category = null as any;
    return this;
  }

  // Business scenario helpers

  /**
   * Creates an item that should appear in search results
   */
  searchable(): ItemBuilder {
    return this.available().withStock(1);
  }

  /**
   * Creates an item that should NOT appear in search results
   */
  notSearchable(): ItemBuilder {
    return this.unavailable().outOfStock();
  }

  /**
   * Creates an expensive item (for pricing display tests)
   */
  expensive(): ItemBuilder {
    return this.withName('Expensive Item').withDescription('Costs many diamonds');
  }

  /**
   * Creates a commonly searched item (for performance tests)
   */
  popular(): ItemBuilder {
    return this.withName('Diamond').withDescription('Everyone wants diamonds');
  }

  /**
   * Build the final item object
   */
  build(): Partial<Item> {
    return { ...this.item };
  }

  /**
   * Build and return the item ready for creation (without ID/timestamps)
   */
  buildForCreation(): Omit<Item, 'id' | 'createdAt' | 'updatedAt'> {
    const item = this.build();
    // Ensure required fields have defaults
    return {
      ownerId: item.ownerId || 'default_owner',
      name: item.name || 'Default Item',
      category: item.category || 'materials',
      minecraftId: item.minecraftId || 'default_item',
      stockQuantity: item.stockQuantity ?? 1,
      isAvailable: item.isAvailable ?? true,
      description: item.description,
      processedDescription: item.processedDescription,
      enchantments: item.enchantments,
      itemAttributes: item.itemAttributes,
      serverName: item.serverName,
      shopLocation: item.shopLocation
    };
  }
}

/**
 * Collection of pre-built items for common test scenarios
 */
export const TestItems = {
  // Basic items
  basicItem: () => ItemBuilder.create(),
  
  // Weapon items
  diamondSword: () => ItemBuilder.diamondSword(),
  ironSword: () => ItemBuilder.create().withName('Iron Sword').withCategory('weapons').withMinecraftId('iron_sword'),
  
  // Tool items  
  ironPickaxe: () => ItemBuilder.ironPickaxe(),
  diamondPickaxe: () => ItemBuilder.create().withName('Diamond Pickaxe').withCategory('tools').withMinecraftId('diamond_pickaxe'),
  
  // Armor items
  netheriteHelmet: () => ItemBuilder.netheriteHelmet(),
  diamondChestplate: () => ItemBuilder.create().withName('Diamond Chestplate').withCategory('armor').withMinecraftId('diamond_chestplate'),
  
  // Block items
  diamondBlock: () => ItemBuilder.diamondBlock(),
  ironBlock: () => ItemBuilder.create().withName('Iron Block').withCategory('blocks').withMinecraftId('iron_block'),
  
  // Material items
  enchantedBook: () => ItemBuilder.enchantedBook(),
  diamond: () => ItemBuilder.create().withName('Diamond').withCategory('materials').withMinecraftId('diamond'),
  
  // Invalid items for validation testing
  invalidOwner: () => ItemBuilder.create().withInvalidOwner(),
  emptyName: () => ItemBuilder.create().withEmptyName(),
  negativeStock: () => ItemBuilder.create().withNegativeStock(),
  invalidMinecraftId: () => ItemBuilder.create().withInvalidMinecraftId(),
  
  // Business scenario items
  searchableItem: () => ItemBuilder.create().searchable(),
  unavailableItem: () => ItemBuilder.create().notSearchable(),
  expensiveItem: () => ItemBuilder.create().expensive(),
  popularItem: () => ItemBuilder.create().popular()
};

/**
 * Validation test case generator
 */
export function createItemValidationCases() {
  return [
    {
      name: 'empty owner ID',
      data: TestItems.invalidOwner().build(),
      expectedError: { type: 'ItemValidationError', code: 'INVALID_OWNER_ID', message: 'Owner ID is required' }
    },
    {
      name: 'empty name',
      data: TestItems.emptyName().build(),
      expectedError: { type: 'ItemValidationError', code: 'INVALID_ITEM_NAME', message: 'Item name is required' }
    },
    {
      name: 'negative stock quantity',
      data: TestItems.negativeStock().build(),
      expectedError: { type: 'ItemValidationError', code: 'INVALID_STOCK_QUANTITY', message: 'cannot be negative' }
    },
    {
      name: 'invalid Minecraft ID format',
      data: TestItems.invalidMinecraftId().build(),
      expectedError: { type: 'ItemValidationError', code: 'INVALID_MINECRAFT_ID', message: 'Invalid Minecraft ID format' }
    }
  ];
}