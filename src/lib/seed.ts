import { prisma } from "./prisma";

async function main() {

  console.log("Seeding database...");

  // ---------------------------
  // Employees
  // ---------------------------

  const alice = await prisma.employee.create({
    data: { name: "Alice", role: "CASHIER" }
  });

  const bob = await prisma.employee.create({
    data: { name: "Bob", role: "CASHIER" }
  });

  const manager = await prisma.employee.create({
    data: { name: "Carol", role: "MANAGER" }
  });

  // ---------------------------
  // Product categories
  // ---------------------------

  const drinks = await prisma.productCategory.create({
    data: { name: "Drinks" }
  });

  const snacks = await prisma.productCategory.create({
    data: { name: "Snacks" }
  });

  const groceries = await prisma.productCategory.create({
    data: { name: "Groceries" }
  });

  // ---------------------------
  // Products
  // ---------------------------

  const cola = await prisma.product.create({
    data: {
      name: "Coca-Cola",
      sku: "DR001",
      price: 2.5,
      stock: 200,
      categoryId: drinks.id
    }
  });

  const water = await prisma.product.create({
    data: {
      name: "Mineral Water",
      sku: "DR002",
      price: 1.5,
      stock: 200,
      categoryId: drinks.id
    }
  });

  const chips = await prisma.product.create({
    data: {
      name: "Potato Chips",
      sku: "SN001",
      price: 3.0,
      stock: 100,
      categoryId: snacks.id
    }
  });

  const sandwich = await prisma.product.create({
    data: {
      name: "Ham Sandwich",
      sku: "SN002",
      price: 5.0,
      stock: 80,
      categoryId: snacks.id
    }
  });

  const milk = await prisma.product.create({
    data: {
      name: "Milk",
      sku: "GR001",
      price: 2.2,
      stock: 120,
      categoryId: groceries.id
    }
  });

  // ---------------------------
  // Shift
  // ---------------------------

  const shift = await prisma.shift.create({
    data: {
      employeeId: alice.id,
      startTime: new Date()
    }
  });

  // ---------------------------
  // Sales
  // ---------------------------

  const sale1 = await prisma.sale.create({
    data: {
      employeeId: alice.id,
      shiftId: shift.id,
      paymentType: "CARD",
      totalAmount: 8.0
    }
  });

  const sale2 = await prisma.sale.create({
    data: {
      employeeId: alice.id,
      shiftId: shift.id,
      paymentType: "CASH",
      totalAmount: 6.5
    }
  });

  // ---------------------------
  // Sale Items
  // ---------------------------

  await prisma.saleItem.createMany({
    data: [
      {
        saleId: sale1.id,
        productId: cola.id,
        quantity: 2,
        unitPrice: 2.5,
        lineTotal: 5.0
      },
      {
        saleId: sale1.id,
        productId: chips.id,
        quantity: 1,
        unitPrice: 3.0,
        lineTotal: 3.0
      },
      {
        saleId: sale2.id,
        productId: sandwich.id,
        quantity: 1,
        unitPrice: 5.0,
        lineTotal: 5.0
      },
      {
        saleId: sale2.id,
        productId: water.id,
        quantity: 1,
        unitPrice: 1.5,
        lineTotal: 1.5
      }
    ]
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });