import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Variant from './models/Variant.js';
import Coupon from './models/Coupon.js';
import ServiceablePincode from './models/ServiceablePincode.js';
import Settings from './models/Settings.js';
import HomepageSection from './models/HomepageSection.js';
import Review from './models/Review.js';

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Variant.deleteMany({});
    await Coupon.deleteMany({});
    await ServiceablePincode.deleteMany({});
    await Settings.deleteMany({});
    await HomepageSection.deleteMany({});
    await Review.deleteMany({});
    console.log('Database cleared.');

    // 1. Seed global settings
    console.log('Seeding settings...');
    const settings = await Settings.create({
      storeName: 'VESTRA',
      storeLogo: '',
      supportEmail: 'support@vestra.com',
      supportPhone: '+919876543210',
      freeShippingThreshold: 2999,
      shippingCharges: 150,
      codEnabled: true,
      returnWindowDays: 14,
      exchangeWindowDays: 14,
      gstPercentage: 12,
      maintenanceMode: false,
      defaultMetaTitle: 'VESTRA | Modern Premium Apparel',
      defaultMetaDescription: 'Premium fashion brand focused on clean design, quality apparel, and a polished shopping experience.'
    });
    console.log('Settings seeded.');

    // 2. Seed Users (Admin & Customer)
    console.log('Seeding users...');
    const adminUser = await User.create({
      name: 'Vestra Manager',
      email: 'admin@vestra.com',
      password: 'admin123', // Will be hashed via pre-save hook
      role: 'admin'
    });

    const customerUser = await User.create({
      name: 'Jane Doe',
      email: 'customer@vestra.com',
      password: 'customer123',
      role: 'customer',
      savedAddresses: [
        {
          fullName: 'Jane Doe',
          phone: '9876543210',
          addressLine1: 'Flat 405, Olive Apartment',
          addressLine2: 'Road No. 4, Banjara Hills',
          landmark: 'Near Starbucks',
          city: 'Hyderabad',
          state: 'Telangana',
          pincode: '500034',
          country: 'India',
          isDefault: true
        }
      ]
    });
    console.log('Users seeded successfully. (admin@vestra.com / admin123, customer@vestra.com / customer123)');

    // 3. Seed Serviceable Pincodes
    console.log('Seeding pincodes...');
    const pincodesData = [
      { pincode: '380015', city: 'Ahmedabad', state: 'Gujarat' },
      { pincode: '400001', city: 'Mumbai', state: 'Maharashtra' },
      { pincode: '110001', city: 'Delhi', state: 'Delhi' },
      { pincode: '560001', city: 'Bengaluru', state: 'Karnataka' },
      { pincode: '700001', city: 'Kolkata', state: 'West Bengal' },
      { pincode: '600001', city: 'Chennai', state: 'Tamil Nadu' },
      { pincode: '500034', city: 'Hyderabad', state: 'Telangana' }
    ];
    await ServiceablePincode.insertMany(pincodesData);
    console.log('Pincodes seeded.');

    // 4. Seed Coupons
    console.log('Seeding coupons...');
    const couponsData = [
      {
        code: 'VESTRA10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 1999,
        maxDiscount: 500,
        expiryDate: new Date('2028-12-31')
      },
      {
        code: 'LAUNCH20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 2999,
        expiryDate: new Date('2028-12-31')
      },
      {
        code: 'WELCOME500',
        discountType: 'flat',
        discountValue: 500,
        minOrderValue: 3999,
        expiryDate: new Date('2028-12-31')
      }
    ];
    await Coupon.insertMany(couponsData);
    console.log('Coupons seeded.');

    // 5. Seed Products & Variants
    console.log('Seeding products and variants...');
    
    // We will use highly-curated premium placeholder shapes for e-commerce catalog image arrays
    const items = [
      {
        name: 'Essential Boxy Tee',
        description: 'Made from high-twist organic cotton jersey. Features a clean ribbed mockneck and relaxed dropped shoulders. Designed with generous proportions for a structured yet fluid drape.',
        category: 'Men',
        subcategory: 'T-Shirts',
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80&color=pine-green',
          'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80&color=ink-black'
        ],
        variants: [
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'S', sku: 'VES-TEE-PINE-S', price: 1490, compareAtPrice: 1990, stock: 15 },
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'M', sku: 'VES-TEE-PINE-M', price: 1490, stock: 18 },
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'L', sku: 'VES-TEE-PINE-L', price: 1490, stock: 4 }, // Low stock check
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'M', sku: 'VES-TEE-BONE-M', price: 1490, stock: 20 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'L', sku: 'VES-TEE-BONE-L', price: 1490, stock: 15 },
          { color: 'Ink Black', colorHex: '#14110F', size: 'M', sku: 'VES-TEE-INK-M', price: 1490, stock: 3 } // Low stock
        ]
      },
      {
        name: 'Linen Resort Shirt',
        description: 'Cut from breathable, premium French linen. Features a relaxed camp collar, wide chest pocket, and a clean straight hem. Prefect for warm afternoons.',
        category: 'Men',
        subcategory: 'Shirts',
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80&color=bone-white',
          'https://images.unsplash.com/photo-1621072156002-e2fcc103e869?w=800&auto=format&fit=crop&q=80&color=mist-gray'
        ],
        variants: [
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'M', sku: 'VES-SHR-BONE-M', price: 2990, compareAtPrice: 3490, stock: 8 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'L', sku: 'VES-SHR-BONE-L', price: 2990, stock: 10 },
          { color: 'Mist Gray', colorHex: '#E4E1D8', size: 'M', sku: 'VES-SHR-MIST-M', price: 2990, stock: 12 },
          { color: 'Mist Gray', colorHex: '#E4E1D8', size: 'L', sku: 'VES-SHR-MIST-L', price: 2990, stock: 10 }
        ]
      },
      {
        name: 'Relaxed Loopback Hoodie',
        description: 'Made from heavyweight dry loopback cotton. Detailed with a double-layered hood without drawstrings for a modern, clean look. Features deep side-seam pockets.',
        category: 'Men',
        subcategory: 'Hoodies',
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&auto=format&fit=crop&q=80&color=ink-black',
          'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=80&color=mist-gray'
        ],
        variants: [
          { color: 'Ink Black', colorHex: '#14110F', size: 'M', sku: 'VES-HOD-INK-M', price: 4490, stock: 10 },
          { color: 'Ink Black', colorHex: '#14110F', size: 'L', sku: 'VES-HOD-INK-L', price: 4490, stock: 8 },
          { color: 'Mist Gray', colorHex: '#E4E1D8', size: 'M', sku: 'VES-HOD-MIST-M', price: 4490, stock: 15 }
        ]
      },
      {
        name: 'Classic Cropped Tee',
        description: 'Womens everyday tee. Knitted from ultra-soft fine Supima cotton with a touch of stretch. Flatlock stitching, sits slightly above the waist.',
        category: 'Women',
        subcategory: 'T-Shirts',
        images: [
          'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80&color=bone-white',
          'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=80&color=pine-green'
        ],
        variants: [
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'XS', sku: 'VES-WTEE-BONE-XS', price: 1290, stock: 10 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'S', sku: 'VES-WTEE-BONE-S', price: 1290, stock: 12 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'M', sku: 'VES-WTEE-BONE-M', price: 1290, stock: 15 },
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'S', sku: 'VES-WTEE-PINE-S', price: 1290, compareAtPrice: 1590, stock: 10 },
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'M', sku: 'VES-WTEE-PINE-M', price: 1290, stock: 12 }
        ]
      },
      {
        name: 'Oversized Silk Shirt',
        description: 'Woven in fine Mulberry silk. Draped silhouette with an elegant point collar, long statement cuffs, and mother-of-pearl buttons. Brings a luxurious touch to daily tailoring.',
        category: 'Women',
        subcategory: 'Shirts',
        images: [
          'https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&auto=format&fit=crop&q=80&color=brass-gold',
          'https://images.unsplash.com/photo-1548624149-f7b31640e791?w=800&auto=format&fit=crop&q=80&color=bone-white'
        ],
        variants: [
          { color: 'Brass Gold', colorHex: '#B08968', size: 'S', sku: 'VES-WSHR-GOLD-S', price: 3490, stock: 8 },
          { color: 'Brass Gold', colorHex: '#B08968', size: 'M', sku: 'VES-WSHR-GOLD-M', price: 3490, stock: 8 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'S', sku: 'VES-WSHR-BONE-S', price: 3490, stock: 6 },
          { color: 'Bone White', colorHex: '#F6F3EE', size: 'M', sku: 'VES-WSHR-BONE-M', price: 3490, stock: 7 }
        ]
      },
      {
        name: 'French Terry Zip Hoodie',
        description: 'Crafted from premium heavy French terry. Cut in an oversized cropped profile with double sliders and structured side slits. Warm, comfortable and airy.',
        category: 'Women',
        subcategory: 'Hoodies',
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80&color=mist-gray',
          'https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=800&auto=format&fit=crop&q=80&color=ink-black'
        ],
        variants: [
          { color: 'Mist Gray', colorHex: '#E4E1D8', size: 'S', sku: 'VES-WHOD-MIST-S', price: 4290, stock: 12 },
          { color: 'Mist Gray', colorHex: '#E4E1D8', size: 'M', sku: 'VES-WHOD-MIST-M', price: 4290, stock: 15 },
          { color: 'Ink Black', colorHex: '#14110F', size: 'S', sku: 'VES-WHOD-INK-S', price: 4290, compareAtPrice: 4990, stock: 10 }
        ]
      },
      {
        name: 'Minimalist Leather Tote',
        description: 'Handcrafted from full-grain LWG-certified Italian leather. Open top layout with a magnetic center closure. Interior detailed with a zippered key pouch. Raw unlined leather interior.',
        category: 'Accessories',
        subcategory: 'None',
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80&color=brass-brown',
          'https://images.unsplash.com/photo-1547949003-9792a18a2601?w=800&auto=format&fit=crop&q=80&color=ink-black'
        ],
        variants: [
          { color: 'Brass Brown', colorHex: '#B08968', size: 'OS', sku: 'VES-ACC-TOTE-BRS', price: 7990, stock: 15 },
          { color: 'Ink Black', colorHex: '#14110F', size: 'OS', sku: 'VES-ACC-TOTE-INK', price: 7990, stock: 20 }
        ]
      },
      {
        name: 'Cashmere Wool Scarf',
        description: 'Knitted in Scotland from premium cashmere and wool blend. Features a dense honeycomb weave and soft fringe detailing. Unbelievably soft and warming.',
        category: 'Accessories',
        subcategory: 'None',
        images: [
          'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&auto=format&fit=crop&q=80&color=pine-green',
          'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800&auto=format&fit=crop&q=80&color=brass-brown'
        ],
        variants: [
          { color: 'Pine Green', colorHex: '#1F3D2B', size: 'OS', sku: 'VES-ACC-SCARF-PNE', price: 2490, stock: 12 },
          { color: 'Brass Brown', colorHex: '#B08968', size: 'OS', sku: 'VES-ACC-SCARF-BRS', price: 2490, stock: 15 }
        ]
      }
    ];

    const seededProducts = [];
    for (const item of items) {
      const slug = item.name.toLowerCase().replace(/\s+/g, '-');
      const product = await Product.create({
        name: item.name,
        slug,
        description: item.description,
        category: item.category,
        subcategory: item.subcategory,
        images: item.images,
        seoTitle: `${item.name} | VESTRA`,
        seoDescription: item.description.slice(0, 150)
      });
      
      seededProducts.push(product);

      // Insert variants for this product
      for (const variant of item.variants) {
        await Variant.create({
          productId: product._id,
          ...variant
        });
      }
    }
    console.log(`Seeded ${seededProducts.length} products with variants.`);

    // 6. Seed homepage sections CMS
    console.log('Seeding homepage sections...');
    await HomepageSection.create([
      {
        sectionType: 'Hero Banner',
        title: 'SILHOUETTES OF MODERN GROTESK',
        subtitle: 'A quiet luxury approach to everyday dress codes. Off-white canvas, ink tones, and deep pine statements.',
        image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&auto=format&fit=crop&q=80',
        products: [],
        displayOrder: 0,
        isActive: true
      },
      {
        sectionType: 'New Arrivals',
        title: 'New Arrivals',
        subtitle: 'Our newest seasonal shapes. Confident cuts, premium linen, and structured organics.',
        products: [seededProducts[0]._id, seededProducts[1]._id, seededProducts[3]._id, seededProducts[4]._id],
        displayOrder: 1,
        isActive: true
      },
      {
        sectionType: 'Featured Collection',
        title: 'The Ink & Green Palette',
        subtitle: 'A capsule wardrobe focused on our signature pine green and ink black accents.',
        image: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&auto=format&fit=crop&q=80',
        products: [seededProducts[2]._id, seededProducts[5]._id, seededProducts[6]._id, seededProducts[7]._id],
        displayOrder: 2,
        isActive: true
      }
    ]);
    console.log('Homepage sections seeded.');

    // 7. Seed Reviews for PDP distribution charts
    console.log('Seeding reviews...');
    const firstProductId = seededProducts[0]._id; // Essential Boxy Tee
    const mockReviews = [
      {
        productId: firstProductId,
        userId: customerUser._id,
        userName: 'Jane Doe',
        rating: 5,
        comment: 'Absolutely love the fit! The mockneck is nicely structured and organic cotton feels very heavy and premium. Definitely buying in other colors.',
        images: ['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&auto=format&fit=crop&q=80']
      },
      {
        productId: firstProductId,
        userId: customerUser._id,
        userName: 'Arjun Mehta',
        rating: 5,
        comment: 'Outstanding quality. Sizing is slightly oversized, perfect boxy drape. Handwashed it twice, no shrinkage whatsoever.',
        images: []
      },
      {
        productId: firstProductId,
        userId: customerUser._id,
        userName: 'Rohan Shah',
        rating: 4,
        comment: 'Nice tee, heavy weight fabric as advertised. Docking one star because the shipping took 4 days to Ahmedabad.',
        images: []
      },
      {
        productId: firstProductId,
        userId: customerUser._id,
        userName: 'Sara Khan',
        rating: 4,
        comment: 'Very premium feel, color matches the pictures perfectly. Looks great in pine green!',
        images: []
      },
      {
        productId: firstProductId,
        userId: customerUser._id,
        userName: 'Kunal Sen',
        rating: 3,
        comment: 'Quality is decent but fits a bit too large for me. I would suggest sizing down.',
        images: []
      }
    ];
    await Review.insertMany(mockReviews);
    console.log('Reviews seeded.');

    console.log('Database Seeding Completed Successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`Database Seeding Failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
