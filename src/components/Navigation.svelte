<script lang="ts">
  interface Props {
    currentPage: 'home' | 'browse' | 'sell' | 'account' | 'help';
    onNavigate: (page: string) => void;
  }
  
  let { currentPage, onNavigate }: Props = $props();
  
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      description: 'Return to main page'
    },
    {
      id: 'browse',
      label: 'Browse Items', 
      icon: '🔍',
      description: 'Find items to buy'
    },
    {
      id: 'sell',
      label: 'Sell Items',
      icon: '💰', 
      description: 'List your items for sale'
    },
    {
      id: 'account',
      label: 'My Account',
      icon: '👤',
      description: 'View purchases and settings'
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      description: 'Get help and support'
    }
  ];
</script>

<nav class="main-navigation" role="navigation" aria-label="Main navigation">
  <div class="nav-container">
    {#each navItems as item}
      <button 
        class="nav-item"
        class:active={currentPage === item.id}
        onclick={() => onNavigate(item.id)}
        aria-current={currentPage === item.id ? 'page' : undefined}
        title={item.description}
        type="button"
      >
        <span class="nav-icon" aria-hidden="true">{item.icon}</span>
        <span class="nav-label">{item.label}</span>
      </button>
    {/each}
  </div>
  
  <!-- Breadcrumb trail -->
  <div class="breadcrumb" aria-label="Breadcrumb">
    <span class="breadcrumb-item">Marketplace</span>
    {#if currentPage !== 'home'}
      <span class="breadcrumb-separator" aria-hidden="true">›</span>
      <span class="breadcrumb-item current" aria-current="page">
        {navItems.find(item => item.id === currentPage)?.label || 'Page'}
      </span>
    {/if}
  </div>
</nav>

<style>
  .main-navigation {
    background: rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1rem 0;
    margin-bottom: 1rem;
  }
  
  .nav-container {
    display: flex;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    color: #e0e0e0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
  }
  
  .nav-item:hover {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    transform: translateY(-1px);
  }
  
  .nav-item.active {
    background: linear-gradient(135deg, #4caf50 0%, #45a049 100%);
    color: white;
    border-color: #4caf50;
    box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
  }
  
  .nav-item.active:hover {
    background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%);
  }
  
  .nav-icon {
    font-size: 1.1rem;
  }
  
  .nav-label {
    font-weight: 500;
  }
  
  .breadcrumb {
    text-align: center;
    font-size: 0.85rem;
    color: #ccc;
    margin-top: 0.5rem;
  }
  
  .breadcrumb-item {
    color: #999;
  }
  
  .breadcrumb-item.current {
    color: #ffd700;
    font-weight: 500;
  }
  
  .breadcrumb-separator {
    margin: 0 0.5rem;
    color: #666;
  }
  
  @media (max-width: 768px) {
    .nav-container {
      flex-direction: column;
      align-items: center;
    }
    
    .nav-item {
      width: 100%;
      max-width: 250px;
      justify-content: center;
    }
  }
</style>