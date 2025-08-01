<script lang="ts">
  import { getItemById } from '../lib/minecraft-items.js';
  
  interface Props {
    itemId: string;
    size?: 'small' | 'medium' | 'large';
    showName?: boolean;
  }
  
  let { itemId, size = 'medium', showName = false }: Props = $props();
  
  let itemData = $derived(getItemById(itemId));
  
  // Icon size mapping
  let iconSize = $derived.by(() => {
    switch (size) {
      case 'small': return '16px';
      case 'medium': return '24px';
      case 'large': return '32px';
      default: return '24px';
    }
  });
  
  // Category-based emoji fallback until we implement real icons
  let categoryEmoji = $derived.by(() => {
    if (!itemData) return '📦';
    
    switch (itemData.category) {
      case 'weapons': return '⚔️';
      case 'tools': return '🔧';
      case 'armor': return '🛡️';
      case 'materials': return '🧱';
      case 'food': return '🍎';
      case 'books': return '📚';
      case 'magical': return '✨';
      case 'transportation': return '🪐';
      case 'spawn_eggs': return '🥚';
      case 'storage': return '📦';
      default: return '❓';
    }
  });
</script>

<div class="minecraft-item-icon" class:with-name={showName}>
  <!-- Future: Replace with actual Minecraft item sprite -->
  <!-- <img src="/icons/minecraft/{itemId}.png" alt={itemData?.name || itemId} /> -->
  
  <!-- Temporary emoji fallback -->
  <span 
    class="item-emoji" 
    style="font-size: {iconSize};"
    title={itemData?.name || itemId}
  >
    {categoryEmoji}
  </span>
  
  {#if showName && itemData}
    <span class="item-name">{itemData.name}</span>
  {/if}
</div>

<style>
  .minecraft-item-icon {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .item-emoji {
    display: inline-block;
    line-height: 1;
  }
  
  .item-name {
    font-size: 0.9rem;
    color: inherit;
  }
  
  .with-name {
    flex-direction: row;
  }
  
  /* Future: Real icon styles */
  /*
  .minecraft-item-icon img {
    width: var(--icon-size);
    height: var(--icon-size);
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
  }
  */
</style>