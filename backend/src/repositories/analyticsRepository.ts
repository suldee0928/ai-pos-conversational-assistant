// Analytics-oriented reads: payment splits, rankings, employee aggregates, inventory thresholds.
import { PaymentType } from "@prisma/client";
import { prisma } from "../lib/prisma";

function utcDayRange(date: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${date}T00:00:00.000Z`);
  const endExclusive = new Date(start);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

function utcRangeInclusive(from: string, to: string): { start: Date; endExclusive: Date } {
  const { start } = utcDayRange(from);
  const { endExclusive } = utcDayRange(to);
  return { start, endExclusive };
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  return Number(value);
}

export type PaymentBreakdownRow = {
  paymentType: PaymentType;
  revenue: number;
};

/** Revenue aggregated by payment channel for one calendar day (UTC). */
export async function getRevenueByPaymentForDay(date: string): Promise<PaymentBreakdownRow[]> {
  const { start, endExclusive } = utcDayRange(date);

  const rows = await prisma.sale.groupBy({
    by: ["paymentType"],
    where: {
      createdAt: {
        gte: start,
        lt: endExclusive
      }
    },
    _sum: {
      totalAmount: true
    }
  });

  return rows.map((r) => ({
    paymentType: r.paymentType,
    revenue: asNumber(r._sum.totalAmount)
  }));
}

export type TopProductRow = {
  productId: number;
  name: string;
  sku: string;
  revenue: number;
  quantitySold: number;
};

/** Top products by line revenue over an inclusive date range (UTC calendar days). */
export async function getTopProductsByRevenue(
  from: string,
  to: string,
  limit: number
): Promise<TopProductRow[]> {
  const { start, endExclusive } = utcRangeInclusive(from, to);
  const take = Math.min(Math.max(limit, 1), 50);

  const groupedAll = await prisma.saleItem.groupBy({
    by: ["productId"],
    where: {
      sale: {
        createdAt: {
          gte: start,
          lt: endExclusive
        }
      }
    },
    _sum: {
      lineTotal: true,
      quantity: true
    }
  });

  const grouped = [...groupedAll]
    .sort((a, b) => asNumber(b._sum.lineTotal) - asNumber(a._sum.lineTotal))
    .slice(0, take);

  const ids = grouped.map((g) => g.productId);
  if (ids.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, sku: true }
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  return grouped.map((g) => {
    const p = byId.get(g.productId);
    return {
      productId: g.productId,
      name: p?.name ?? `Product #${g.productId}`,
      sku: p?.sku ?? "",
      revenue: asNumber(g._sum.lineTotal),
      quantitySold: asNumber(g._sum.quantity)
    };
  });
}

export type EmployeeSalesRow = {
  employeeId: number;
  name: string;
  revenue: number;
};

/** Total sale amounts per employee over an inclusive date range (employees with no sales omitted). */
export async function getEmployeeSalesTotals(from: string, to: string): Promise<EmployeeSalesRow[]> {
  const { start, endExclusive } = utcRangeInclusive(from, to);

  const groupedAll = await prisma.sale.groupBy({
    by: ["employeeId"],
    where: {
      createdAt: {
        gte: start,
        lt: endExclusive
      },
      employeeId: { not: null }
    },
    _sum: {
      totalAmount: true
    }
  });

  const grouped = [...groupedAll].sort(
    (a, b) => asNumber(b._sum.totalAmount) - asNumber(a._sum.totalAmount)
  );

  const ids = grouped.map((g) => g.employeeId).filter((id): id is number => id !== null);
  if (ids.length === 0) return [];

  const employees = await prisma.employee.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true }
  });
  const byId = new Map(employees.map((e) => [e.id, e]));

  return grouped
    .filter((g) => g.employeeId !== null)
    .map((g) => ({
      employeeId: g.employeeId as number,
      name: byId.get(g.employeeId as number)?.name ?? `Employee #${g.employeeId}`,
      revenue: asNumber(g._sum.totalAmount)
    }));
}

export type LowStockRow = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  categoryName: string;
};

/** Products at or below stock threshold, lowest stock first. */
export async function getLowStockProducts(
  stockThreshold: number,
  maxRows: number
): Promise<LowStockRow[]> {
  const threshold = Math.max(0, stockThreshold);
  const take = Math.min(Math.max(maxRows, 1), 100);

  const rows = await prisma.product.findMany({
    where: {
      stock: { lte: threshold }
    },
    orderBy: { stock: "asc" },
    take,
    include: {
      category: { select: { name: true } }
    }
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    sku: r.sku,
    stock: r.stock,
    categoryName: r.category.name
  }));
}
