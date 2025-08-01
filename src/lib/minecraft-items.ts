// Minecraft Items Database
// Using official Minecraft item IDs for future icon integration

export interface MinecraftItemData {
  id: string;
  name: string;
  category: string;
  stackSize: number;
  description?: string;
}

export const MINECRAFT_ITEMS: Record<string, MinecraftItemData> = {
  // Blocks & Materials
  'iron_block': {
    id: 'iron_block',
    name: 'Iron Block',
    category: 'materials',
    stackSize: 64,
    description: 'A block made of iron ingots'
  },
  'diamond_block': {
    id: 'diamond_block',
    name: 'Diamond Block',
    category: 'materials',
    stackSize: 64,
    description: 'A block made of diamonds'
  },
  'amethyst_shard': {
    id: 'amethyst_shard',
    name: 'Amethyst Shard',
    category: 'materials',
    stackSize: 64,
    description: 'A shard of amethyst crystal'
  },
  'netherite_ingot': {
    id: 'netherite_ingot',
    name: 'Netherite Ingot',
    category: 'materials',
    stackSize: 64,
    description: 'The strongest material in Minecraft'
  },
  
  // Weapons
  'diamond_sword': {
    id: 'diamond_sword',
    name: 'Diamond Sword',
    category: 'weapons',
    stackSize: 1,
    description: 'A sword made of diamond'
  },
  'netherite_sword': {
    id: 'netherite_sword',
    name: 'Netherite Sword',
    category: 'weapons',
    stackSize: 1,
    description: 'The strongest sword in Minecraft'
  },
  'bow': {
    id: 'bow',
    name: 'Bow',
    category: 'weapons',
    stackSize: 1,
    description: 'A ranged weapon that fires arrows'
  },
  'crossbow': {
    id: 'crossbow',
    name: 'Crossbow',
    category: 'weapons',
    stackSize: 1,
    description: 'A more powerful ranged weapon'
  },
  'trident': {
    id: 'trident',
    name: 'Trident',
    category: 'weapons',
    stackSize: 1,
    description: 'A rare three-pronged weapon'
  },
  
  // Tools
  'diamond_pickaxe': {
    id: 'diamond_pickaxe',
    name: 'Diamond Pickaxe',
    category: 'tools',
    stackSize: 1,
    description: 'A pickaxe made of diamond'
  },
  'netherite_pickaxe': {
    id: 'netherite_pickaxe',
    name: 'Netherite Pickaxe',
    category: 'tools',
    stackSize: 1,
    description: 'The strongest pickaxe in Minecraft'
  },
  'diamond_shovel': {
    id: 'diamond_shovel',
    name: 'Diamond Shovel',
    category: 'tools',
    stackSize: 1,
    description: 'A shovel made of diamond'
  },
  'netherite_shovel': {
    id: 'netherite_shovel',
    name: 'Netherite Shovel',
    category: 'tools',
    stackSize: 1,
    description: 'The strongest shovel in Minecraft'
  },
  'diamond_hoe': {
    id: 'diamond_hoe',
    name: 'Diamond Hoe',
    category: 'tools',
    stackSize: 1,
    description: 'A hoe made of diamond'
  },
  'netherite_hoe': {
    id: 'netherite_hoe',
    name: 'Netherite Hoe',
    category: 'tools',
    stackSize: 1,
    description: 'The strongest hoe in Minecraft'
  },
  
  // Armor
  'diamond_helmet': {
    id: 'diamond_helmet',
    name: 'Diamond Helmet',
    category: 'armor',
    stackSize: 1,
    description: 'A helmet made of diamond'
  },
  'netherite_helmet': {
    id: 'netherite_helmet',
    name: 'Netherite Helmet',
    category: 'armor',
    stackSize: 1,
    description: 'The strongest helmet in Minecraft'
  },
  'diamond_chestplate': {
    id: 'diamond_chestplate',
    name: 'Diamond Chestplate',
    category: 'armor',
    stackSize: 1,
    description: 'A chestplate made of diamond'
  },
  'netherite_chestplate': {
    id: 'netherite_chestplate',
    name: 'Netherite Chestplate',
    category: 'armor',
    stackSize: 1,
    description: 'The strongest chestplate in Minecraft'
  },
  'diamond_leggings': {
    id: 'diamond_leggings',
    name: 'Diamond Leggings',
    category: 'armor',
    stackSize: 1,
    description: 'Leggings made of diamond'
  },
  'netherite_leggings': {
    id: 'netherite_leggings',
    name: 'Netherite Leggings',
    category: 'armor',
    stackSize: 1,
    description: 'The strongest leggings in Minecraft'
  },
  'diamond_boots': {
    id: 'diamond_boots',
    name: 'Diamond Boots',
    category: 'armor',
    stackSize: 1,
    description: 'Boots made of diamond'
  },
  'netherite_boots': {
    id: 'netherite_boots',
    name: 'Netherite Boots',
    category: 'armor',
    stackSize: 1,
    description: 'The strongest boots in Minecraft'
  },
  'leather_boots': {
    id: 'leather_boots',
    name: 'Leather Boots',
    category: 'armor',
    stackSize: 1,
    description: 'Boots made of leather that can be dyed'
  },
  
  // Transportation
  'elytra': {
    id: 'elytra',
    name: 'Elytra',
    category: 'transportation',
    stackSize: 1,
    description: 'Wings that allow gliding through the air'
  },
  'minecart': {
    id: 'minecart',
    name: 'Minecart',
    category: 'transportation',
    stackSize: 1,
    description: 'A cart that travels on rails'
  },
  'boat': {
    id: 'boat',
    name: 'Boat',
    category: 'transportation',
    stackSize: 1,
    description: 'A vehicle for traveling on water'
  },
  
  // Magical Items
  'totem_of_undying': {
    id: 'totem_of_undying',
    name: 'Totem of Undying',
    category: 'magical',
    stackSize: 1,
    description: 'Prevents death when held in hand or offhand'
  },
  'enchanted_book': {
    id: 'enchanted_book',
    name: 'Enchanted Book',
    category: 'books',
    stackSize: 1,
    description: 'A book containing enchantments'
  },
  'ender_pearl': {
    id: 'ender_pearl',
    name: 'Ender Pearl',
    category: 'magical',
    stackSize: 16,
    description: 'Teleports the user when thrown'
  },
  'beacon': {
    id: 'beacon',
    name: 'Beacon',
    category: 'magical',
    stackSize: 64,
    description: 'Provides status effects to nearby players'
  },
  'nether_star': {
    id: 'nether_star',
    name: 'Nether Star',
    category: 'magical',
    stackSize: 64,
    description: 'A rare item dropped by the Wither'
  },
  'dragon_egg': {
    id: 'dragon_egg',
    name: 'Dragon Egg',
    category: 'magical',
    stackSize: 64,
    description: 'A trophy from defeating the Ender Dragon'
  },
  'heart_of_the_sea': {
    id: 'heart_of_the_sea',
    name: 'Heart of the Sea',
    category: 'magical',
    stackSize: 64,
    description: 'Used to craft conduits'
  },
  'conduit': {
    id: 'conduit',
    name: 'Conduit',
    category: 'magical',
    stackSize: 64,
    description: 'Provides underwater breathing and vision'
  },
  
  // Food
  'golden_apple': {
    id: 'golden_apple',
    name: 'Golden Apple',
    category: 'food',
    stackSize: 64,
    description: 'A magical apple that provides beneficial effects'
  },
  'enchanted_golden_apple': {
    id: 'enchanted_golden_apple',
    name: 'Enchanted Golden Apple',
    category: 'food',
    stackSize: 64,
    description: 'The most powerful food item in Minecraft'
  },
  
  // Spawn Eggs
  'skeleton_horse_spawn_egg': {
    id: 'skeleton_horse_spawn_egg',
    name: 'Skeleton Horse Spawn Egg',
    category: 'spawn_eggs',
    stackSize: 64,
    description: 'Spawns a skeleton horse'
  },
  'zombie_horse_spawn_egg': {
    id: 'zombie_horse_spawn_egg',
    name: 'Zombie Horse Spawn Egg',
    category: 'spawn_eggs',
    stackSize: 64,
    description: 'Spawns a zombie horse'
  },
  'bee_spawn_egg': {
    id: 'bee_spawn_egg',
    name: 'Bee Spawn Egg',
    category: 'spawn_eggs',
    stackSize: 64,
    description: 'Spawns a bee'
  },
  
  // Shulker-related
  'shulker_shell': {
    id: 'shulker_shell',
    name: 'Shulker Shell',
    category: 'materials',
    stackSize: 64,
    description: 'Used to craft shulker boxes'
  },
  'shulker_box': {
    id: 'shulker_box',
    name: 'Shulker Box',
    category: 'storage',
    stackSize: 1,
    description: 'A portable storage container'
  }
};

export const MINECRAFT_CATEGORIES = [
  'weapons',
  'tools', 
  'armor',
  'materials',
  'food',
  'books',
  'magical',
  'transportation',
  'spawn_eggs',
  'storage'
] as const;

export type MinecraftCategory = typeof MINECRAFT_CATEGORIES[number];

// Get all items by category
export function getItemsByCategory(category: MinecraftCategory): MinecraftItemData[] {
  return Object.values(MINECRAFT_ITEMS).filter(item => item.category === category);
}

// Get a random item from a category
export function getRandomItemFromCategory(category: MinecraftCategory): MinecraftItemData {
  const items = getItemsByCategory(category);
  return items[Math.floor(Math.random() * items.length)];
}

// Get a completely random item
export function getRandomItem(): MinecraftItemData {
  const allItems = Object.values(MINECRAFT_ITEMS);
  return allItems[Math.floor(Math.random() * allItems.length)];
}

// Validate that an item ID exists
export function isValidItemId(itemId: string): boolean {
  return itemId in MINECRAFT_ITEMS;
}

// Get item data by ID
export function getItemById(itemId: string): MinecraftItemData | null {
  return MINECRAFT_ITEMS[itemId] || null;
}

// Search items by name
export function searchItems(query: string): MinecraftItemData[] {
  const searchTerm = query.toLowerCase();
  return Object.values(MINECRAFT_ITEMS).filter(item => 
    item.name.toLowerCase().includes(searchTerm) ||
    item.id.toLowerCase().includes(searchTerm)
  );
}