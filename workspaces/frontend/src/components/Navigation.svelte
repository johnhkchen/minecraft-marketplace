<script lang="ts">
  /**
   * Navigation Component - HATEOAS-compliant navigation
   * Provides semantic navigation structure with accessibility features
   */
  
  interface Props {
    currentPage?: string;
  }
  
  let { currentPage = 'home' }: Props = $props();
</script>

<nav role="navigation" aria-label="Main navigation" class="main-navigation">
  <ul class="nav-list">
    <li class="nav-item">
      <a 
        href="/" 
        class="nav-link"
        class:active={currentPage === 'home'}
        aria-current={currentPage === 'home' ? 'page' : undefined}
      >
        Home
      </a>
    </li>
    <li class="nav-item">
      <a 
        href="/browse" 
        class="nav-link"
        class:active={currentPage === 'browse'}
        aria-current={currentPage === 'browse' ? 'page' : undefined}
      >
        Browse Items
      </a>
    </li>
    <li class="nav-item">
      <a 
        href="/sell" 
        class="nav-link"
        class:active={currentPage === 'sell'}
        aria-current={currentPage === 'sell' ? 'page' : undefined}
      >
        Sell Items
      </a>
    </li>
    <li class="nav-item">
      <a 
        href="/shops" 
        class="nav-link"
        class:active={currentPage === 'shops'}
        aria-current={currentPage === 'shops' ? 'page' : undefined}
      >
        Browse Shops
      </a>
    </li>
  </ul>
</nav>

<style>
  .main-navigation {
    background: rgba(0, 0, 0, 0.3);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .nav-list {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .nav-item {
    margin: 0;
  }
  
  .nav-link {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #8b5a3c;
    color: white;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .nav-link:hover {
    background: #a0693d;
    transform: translateY(-2px);
  }
  
  .nav-link.active {
    background: #4caf50;
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  .nav-link:focus {
    outline: 2px solid #ffd700;
    outline-offset: 2px;
  }
  
  @media (max-width: 768px) {
    .nav-list {
      flex-direction: column;
      align-items: center;
    }
    
    .nav-link {
      width: 200px;
      text-align: center;
    }
  }
</style>