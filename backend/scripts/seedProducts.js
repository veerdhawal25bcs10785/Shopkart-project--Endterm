const Product = require('../models/product.model');

const sampleProducts = [
  {
    name: 'Mechanical Keyboard',
    description: 'Tenkeyless RGB mechanical gaming keyboard with tactile blue switches and durable aluminum frame.',
    price: 2999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
    stock: 12,
  },
  {
    name: 'Noise Cancelling Headphones',
    description: 'Wireless over-ear Bluetooth headphones with active noise cancellation, 30-hour battery life, and deep bass.',
    price: 4999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    stock: 25,
  },
  {
    name: 'Wireless Ergonomic Mouse',
    description: 'High-precision wireless optical mouse designed to reduce wrist strain, featuring customizable DPI settings.',
    price: 999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80',
    stock: 40,
  },
  {
    name: 'Ultra HD 4K Monitor',
    description: '27-inch IPS borderless 4K display with 99% sRGB color accuracy, HDR support, and USB-C connectivity.',
    price: 19999,
    category: 'Electronics',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
    stock: 8,
  },
  {
    name: 'Classic Denim Jacket',
    description: 'Authentic stone-washed cotton denim jacket with button flap chest pockets and a comfortable relaxed fit.',
    price: 2499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80',
    stock: 18,
  },
  {
    name: 'Pure Cotton Casual Shirt',
    description: 'Breathable, slim-fit long sleeve cotton shirt suitable for both office wear and weekend outings.',
    price: 1299,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
    stock: 30,
  },
  {
    name: 'Lightweight Running Shoes',
    description: 'Performance road running shoes featuring responsive foam cushioning and breathable engineered mesh upper.',
    price: 3499,
    category: 'Fashion',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    stock: 15,
  },
  {
    name: 'Clean Code by Robert C. Martin',
    description: 'A handbook of agile software craftsmanship, filled with best practices for writing clean, maintainable code.',
    price: 899,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=800&q=80',
    stock: 45,
  },
  {
    name: 'Designing Data-Intensive Applications',
    description: 'The definitive guide to the architecture of data systems, storage engines, distributed systems, and reliability.',
    price: 1499,
    category: 'Books',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
    stock: 20,
  },
  {
    name: 'Ceramic Coffee Mug Set',
    description: 'Set of 4 handcrafted matte ceramic mugs (350ml each), microwave and dishwasher safe.',
    price: 799,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
    stock: 22,
  },
  {
    name: 'Ultrasonic Essential Oil Diffuser',
    description: 'Whisper-quiet 500ml ultrasonic aroma humidifier with 7 ambient LED colors and automatic shut-off.',
    price: 1599,
    category: 'Home',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80',
    stock: 14,
  },
];

const seedProducts = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany(sampleProducts);
      console.log(`[Seed] Seeded ${sampleProducts.length} initial products into MongoDB.`);
    }
  } catch (error) {
    console.error('[Seed] Error seeding products:', error.message);
  }
};

module.exports = { sampleProducts, seedProducts };
