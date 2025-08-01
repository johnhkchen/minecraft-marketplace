<script lang="ts">
  interface Props {
    onSubmit: (listing: {
      seller_name: string;
      stall_id: string;
      item_name: string;
      qty: number;
      price: number;
      description?: string;
      inventory_unit?: string;
    }) => void;
  }
  
  let { onSubmit }: Props = $props();
  
  let sellerName = $state('');
  let stallId = $state('');
  let itemName = $state('');
  let qty = $state(1);
  let price = $state(1);
  let description = $state('');
  let inventoryUnit = $state('per item');
  let listingType = $state<'buy' | 'sell'>('sell');
  
  let isValid = $derived(
    sellerName.trim() !== '' &&
    stallId.trim() !== '' &&
    itemName.trim() !== '' &&
    qty > 0 &&
    price >= 0 // Allow 0 for "make offer" listings
  );
  
  function handleSubmit() {
    if (!isValid) return;
    
    onSubmit({
      seller_name: sellerName.trim(),
      stall_id: stallId.trim(),
      item_name: itemName.trim(),
      qty,
      price,
      description: description.trim() || undefined,
      inventory_unit: inventoryUnit,
      listing_type: listingType
    });
    
    // Reset form
    sellerName = '';
    stallId = '';
    itemName = '';
    qty = 1;
    price = 1;
    description = '';
    inventoryUnit = 'per item';
    listingType = 'sell';
  }
</script>

<div class="listing-form">
  <h2>{listingType === 'buy' ? 'Post Buy Request' : 'List Item for Sale'}</h2>
  
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
    <div class="form-group">
      <label for="listingType">Listing Type:</label>
      <select 
        id="listingType"
        bind:value={listingType}
        required
      >
        <option value="sell">🟢 Sell - I have items to sell</option>
        <option value="buy">🔵 Buy - I want to buy items</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="sellerName">{listingType === 'buy' ? 'Your Name:' : 'Seller Name:'}</label>
      <input 
        id="sellerName"
        type="text" 
        bind:value={sellerName}
        placeholder="Your Minecraft username"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="stallId">Stall ID:</label>
      <input 
        id="stallId"
        type="text" 
        bind:value={stallId}
        placeholder="e.g., A-12, B-5"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="itemName">Item Name:</label>
      <input 
        id="itemName"
        type="text" 
        bind:value={itemName}
        placeholder="e.g., Iron Ingots, Cobblestone"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="inventoryUnit">Selling Unit:</label>
      <select 
        id="inventoryUnit"
        bind:value={inventoryUnit}
        required
      >
        <option value="per item">Per Item</option>
        <option value="per shulker">Per Shulker (27 stacks)</option>
        <option value="per stack">Per Stack (64 items)</option>
        <option value="per dozen">Per Dozen (12 items)</option>
      </select>
    </div>
    
    <div class="form-group">
      <label for="qty">{listingType === 'buy' ? 'Quantity Wanted:' : 'Quantity Available:'}</label>
      <input 
        id="qty"
        type="number" 
        bind:value={qty}
        min="1"
        required
      />
    </div>
    
    <div class="form-group">
      <label for="price">
        {listingType === 'buy' ? 'Offering (Diamond Blocks' : 'Price (Diamond Blocks'} {inventoryUnit}):
      </label>
      <input 
        id="price"
        type="number" 
        bind:value={price}
        min="0"
        step="0.1"
        placeholder={price === 0 ? "0 for 'make offer'" : ""}
        required
      />
    </div>
    
    <div class="form-group">
      <label for="description">Description (optional):</label>
      <textarea 
        id="description"
        bind:value={description}
        placeholder="Additional details about your listing"
        rows="3"
      ></textarea>
    </div>
    
    <button type="submit" disabled={!isValid}>
      {listingType === 'buy' ? 'Post Buy Request' : 'List Item for Sale'}
    </button>
  </form>
</div>

<style>
  .listing-form {
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem;
    border: 2px solid #8b5a3c;
    border-radius: 8px;
    background: #f5e6d3;
    font-family: 'Courier New', monospace;
  }
  
  h2 {
    text-align: center;
    color: #8b5a3c;
    margin-bottom: 1.5rem;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.25rem;
    font-weight: bold;
    color: #5d4037;
  }
  
  input, textarea, select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #8b5a3c;
    border-radius: 4px;
    font-family: inherit;
    background: white;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
    font-family: inherit;
  }
  
  button:disabled {
    background: #cccccc;
    cursor: not-allowed;
  }
  
  button:not(:disabled):hover {
    background: #45a049;
  }
</style>