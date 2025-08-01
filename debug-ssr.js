// Debug script to test SSR homepage data loading directly
console.log('🔍 SSR DEBUG SCRIPT');
console.log('Environment:', process.env.NODE_ENV);
console.log('Docker indicators:', {
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  VALKEY_HOST: process.env.VALKEY_HOST,
  HOME: process.env.HOME,
  HOSTNAME: process.env.HOSTNAME
});

console.log('\n📡 Testing direct PostgREST connection...');
fetch('http://postgrest:3000/public_items')
  .then(r => r.json())
  .then(data => {
    console.log(`✅ PostgREST direct: ${data.length} items`);
    
    // Count unique shops
    const shops = new Set(data.map(item => item.owner_shop_name).filter(Boolean));
    console.log(`✅ PostgREST shops: ${shops.size} unique shops`);
    
    console.log('\n🏠 Testing homepage data loading...');
    
    // Simulate what the homepage does
    const testUrls = [
      'http://postgrest:3000/public_items?limit=20&offset=0&order=price_diamonds.desc',
      'http://postgrest:3000/public_items?select=id',
      'http://postgrest:3000/public_items?select=owner_shop_name'
    ];
    
    Promise.all(testUrls.map(url => 
      fetch(url).then(r => r.json()).catch(e => ({ error: e.message }))
    )).then(results => {
      console.log('📊 Homepage API simulation results:');
      console.log(`   Paginated items: ${Array.isArray(results[0]) ? results[0].length : 'ERROR'}`);
      console.log(`   Total items: ${Array.isArray(results[1]) ? results[1].length : 'ERROR'}`);
      
      if (Array.isArray(results[2])) {
        const uniqueShops = new Set(results[2].map(item => item.owner_shop_name).filter(Boolean));
        console.log(`   Unique shops: ${uniqueShops.size}`);
      }
      
      console.log('\n🎯 EXPECTED HOMEPAGE STATS:');
      console.log(`   Should show: ${results[1].length} items from ${new Set(results[2].map(item => item.owner_shop_name).filter(Boolean)).size} shops`);
    });
  })
  .catch(error => {
    console.log('❌ PostgREST connection failed:', error.message);
  });