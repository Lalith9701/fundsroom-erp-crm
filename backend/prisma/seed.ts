import { PrismaClient, Role, CustomerType, CustomerStatus, MovementType, ChallanStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records (in reverse dependency order)
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.followUp.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: passwordHash,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      email: 'sales@example.com',
      password: passwordHash,
      name: 'Sales Manager',
      role: Role.SALES,
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      email: 'warehouse@example.com',
      password: passwordHash,
      name: 'Warehouse Keeper',
      role: Role.WAREHOUSE,
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      email: 'accounts@example.com',
      password: passwordHash,
      name: 'Accounts Executive',
      role: Role.ACCOUNTS,
    },
  });

  console.log('✅ Users seeded successfully.');

  // 3. Create Sample Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Wholesale Traders',
      mobile: '+919876543210',
      email: 'contact@apextraders.com',
      businessName: 'Apex Wholesale Pvt Ltd',
      gstNumber: '27AAAAA0000A1Z5',
      customerType: CustomerType.DISTRIBUTOR,
      address: 'Plot 42, Industrial Zone, Mumbai, MH',
      status: CustomerStatus.ACTIVE,
      notes: 'Key distributor for Western region.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Metro Retail Store',
      mobile: '+919812345678',
      email: 'orders@metroretail.in',
      businessName: 'Metro Retails',
      gstNumber: '27BBBCA1234B1Z2',
      customerType: CustomerType.RETAIL,
      address: 'Shop 12, Main Market, Pune, MH',
      status: CustomerStatus.LEAD,
      notes: 'Interested in bulk electronics & accessories.',
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Global Supply Co',
      mobile: '+919988776655',
      email: 'info@globalsupply.com',
      businessName: 'Global Supply Corporation',
      gstNumber: '27CCCCB9876C1Z8',
      customerType: CustomerType.WHOLESALE,
      address: 'Warehouse Complex, Thane, MH',
      status: CustomerStatus.ACTIVE,
      notes: 'Monthly bulk orders.',
    },
  });

  console.log('✅ Customers seeded successfully.');

  // 4. Create Follow-ups
  await prisma.followUp.create({
    data: {
      customerId: customer2.id,
      notes: 'Called customer regarding discount structure for next quarter.',
      followUpDate: new Date(Date.now() + 86400000 * 3),
      createdById: salesUser.id,
    },
  });

  // 5. Create Sample Products
  const productA = await prisma.product.create({
    data: {
      name: 'Industrial Valve 2-inch',
      sku: 'VALVE-2IN-001',
      category: 'Hardware',
      unitPrice: 1250.00,
      currentStock: 50,
      minStockAlert: 10,
      warehouseLocation: 'Rack A-12',
    },
  });

  const productB = await prisma.product.create({
    data: {
      name: 'Heavy Duty Copper Cable (100m)',
      sku: 'CABLE-COP-100',
      category: 'Electrical',
      unitPrice: 4500.00,
      currentStock: 15,
      minStockAlert: 5,
      warehouseLocation: 'Bay B-04',
    },
  });

  const productC = await prisma.product.create({
    data: {
      name: 'Pressure Gauge 100 PSI',
      sku: 'GAUGE-100PSI',
      category: 'Instruments',
      unitPrice: 850.00,
      currentStock: 3, // Low stock!
      minStockAlert: 8,
      warehouseLocation: 'Shelf C-02',
    },
  });

  console.log('✅ Products seeded successfully.');

  // 6. Create Initial Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: productA.id,
        quantity: 50,
        movementType: MovementType.IN,
        reason: 'Initial Inventory Setup',
        createdById: warehouseUser.id,
      },
      {
        productId: productB.id,
        quantity: 15,
        movementType: MovementType.IN,
        reason: 'Initial Inventory Setup',
        createdById: warehouseUser.id,
      },
      {
        productId: productC.id,
        quantity: 3,
        movementType: MovementType.IN,
        reason: 'Initial Purchase Stock Received',
        createdById: warehouseUser.id,
      },
    ],
  });

  console.log('✅ Stock movements seeded successfully.');

  // 7. Create Sample Challan
  const sampleChallan = await prisma.challan.create({
    data: {
      challanNumber: 'CH-2026-000001',
      customerId: customer1.id,
      totalQuantity: 5,
      status: ChallanStatus.DRAFT,
      createdById: salesUser.id,
      items: {
        create: [
          {
            productId: productA.id,
            productNameSnapshot: productA.name,
            skuSnapshot: productA.sku,
            unitPriceSnapshot: productA.unitPrice,
            quantity: 3,
          },
          {
            productId: productB.id,
            productNameSnapshot: productB.name,
            skuSnapshot: productB.sku,
            unitPriceSnapshot: productB.unitPrice,
            quantity: 2,
          },
        ],
      },
    },
  });

  console.log('✅ Sample draft challan seeded successfully:', sampleChallan.challanNumber);
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
