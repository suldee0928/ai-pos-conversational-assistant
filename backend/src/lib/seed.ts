// Seed data (thesis): relational structure reflects the author's Prisma schema and modelling choices.
// Synthetic tuples and procedural seed logic were drafted with Cursor (IDE AI); the author reviewed, adjusted quantities/dates/catalogue data, and verified by running prisma db seed — see Declaration on AI tools.
import "dotenv/config";
import { prisma } from "./prisma";

function atTime(base: Date, hours: number, minutes = 0): Date {
  const d = new Date(base);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function startOfCalendarYear(now = new Date()): Date {
  const d = new Date(now.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfLocalDay(d = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function formatLocalCalendarDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Compare by local calendar Y-M-D only (avoids DST / ms-length issues). */
function compareLocalCalendar(a: Date, b: Date): number {
  const dy = a.getFullYear() - b.getFullYear();
  if (dy !== 0) return dy;
  const dm = a.getMonth() - b.getMonth();
  if (dm !== 0) return dm;
  return a.getDate() - b.getDate();
}

/** Each local calendar day from Jan 1 through today inclusive. */
function localCalendarDaysJan1ThroughToday(now = new Date()): Date[] {
  const end = startOfLocalDay(now);
  const dates: Date[] = [];
  const cursor = startOfCalendarYear(now);
  while (compareLocalCalendar(cursor, end) <= 0) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

async function main() {
  console.log("Seeding database...");

  // cleanup in dependency order
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.product.deleteMany();
  await prisma.productCategory.deleteMany();
  await prisma.employee.deleteMany();

  // ---------------------------
  // Employees
  // ---------------------------
  const alice = await prisma.employee.create({
    data: { name: "Alice", role: "CASHIER" }
  });

  const bob = await prisma.employee.create({
    data: { name: "Bob", role: "CASHIER" }
  });

  const carol = await prisma.employee.create({
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

  const juice = await prisma.product.create({
    data: {
      name: "Orange Juice",
      sku: "DR003",
      price: 2.8,
      stock: 90,
      categoryId: drinks.id
    }
  });

  const cookies = await prisma.product.create({
    data: {
      name: "Cookies",
      sku: "SN003",
      price: 4.0,
      stock: 70,
      categoryId: snacks.id
    }
  });

  const bread = await prisma.product.create({
    data: {
      name: "Bread",
      sku: "GR002",
      price: 1.8,
      stock: 110,
      categoryId: groceries.id
    }
  });

  // ---------------------------
  // Shifts + sales: Jan 1 (local) through seed run date (same calendar year).
  // ---------------------------
  const employees = [alice, bob];
  const products = {
    cola,
    water,
    chips,
    sandwich,
    milk,
    juice,
    cookies,
    bread
  };

  const seedDates = localCalendarDaysJan1ThroughToday();
  const seedDays = seedDates.length;
  const todayIndex = seedDays - 1;

  if (seedDays > 0) {
    console.log(
      `Seeding sales/shifts per local calendar day: ${formatLocalCalendarDate(seedDates[0])} → ${formatLocalCalendarDate(seedDates[todayIndex])} (${seedDays} day(s))`
    );
  }

  for (let dayIndex = 0; dayIndex < seedDates.length; dayIndex++) {
    const baseDay = seedDates[dayIndex];
    const cashier = employees[dayIndex % employees.length];

    const shiftStart = atTime(baseDay, 9, 0);
    const shiftEnd = dayIndex === todayIndex ? null : atTime(baseDay, 17, 0); // last seeded day stays open for "now" demos

    const shift = await prisma.shift.create({
      data: {
        employeeId: cashier.id,
        startTime: shiftStart,
        endTime: shiftEnd
      }
    });

    // sale 1
    const sale1Items = [
      {
        productId: products.cola.id,
        quantity: 2 + (dayIndex % 3),
        unitPrice: 2.5
      },
      {
        productId: products.chips.id,
        quantity: 1,
        unitPrice: 3.0
      }
    ];

    const sale1Total = sale1Items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const sale1 = await prisma.sale.create({
      data: {
        employeeId: cashier.id,
        shiftId: shift.id,
        paymentType: dayIndex % 2 === 0 ? "CARD" : "CASH",
        totalAmount: sale1Total,
        createdAt: atTime(baseDay, 10, 15)
      }
    });

    await prisma.saleItem.createMany({
      data: sale1Items.map((item) => ({
        saleId: sale1.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice
      }))
    });

    // sale 2
    const sale2Items = [
      {
        productId: products.sandwich.id,
        quantity: 1 + (dayIndex % 4 === 0 ? 1 : 0),
        unitPrice: 5.0
      },
      {
        productId: products.water.id,
        quantity: 1,
        unitPrice: 1.5
      }
    ];

    const sale2Total = sale2Items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const sale2 = await prisma.sale.create({
      data: {
        employeeId: cashier.id,
        shiftId: shift.id,
        paymentType: dayIndex % 3 === 0 ? "CARD" : "CASH",
        totalAmount: sale2Total,
        createdAt: atTime(baseDay, 13, 40)
      }
    });

    await prisma.saleItem.createMany({
      data: sale2Items.map((item) => ({
        saleId: sale2.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice
      }))
    });

    // sale 3
    const sale3Items = [
      {
        productId: dayIndex % 2 === 0 ? products.juice.id : products.milk.id,
        quantity: 1,
        unitPrice: dayIndex % 2 === 0 ? 2.8 : 2.2
      },
      {
        productId: dayIndex % 2 === 0 ? products.cookies.id : products.bread.id,
        quantity: 1 + (dayIndex % 2),
        unitPrice: dayIndex % 2 === 0 ? 4.0 : 1.8
      }
    ];

    const sale3Total = sale3Items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    const sale3 = await prisma.sale.create({
      data: {
        employeeId: cashier.id,
        shiftId: shift.id,
        paymentType: "CARD",
        totalAmount: sale3Total,
        createdAt: atTime(baseDay, 16, 20)
      }
    });

    await prisma.saleItem.createMany({
      data: sale3Items.map((item) => ({
        saleId: sale3.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice
      }))
    });
  }

  // manager shift today
  const today = startOfLocalDay();
  await prisma.shift.create({
    data: {
      employeeId: carol.id,
      startTime: atTime(today, 8, 30),
      endTime: null
    }
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