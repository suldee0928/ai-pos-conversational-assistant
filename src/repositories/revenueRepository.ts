import { prisma } from "../lib/prisma";

export async function getDailyRevenue(date: string): Promise<number> {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);
  return getRevenueBetween(start.toISOString(), end.toISOString());
}

export async function getRevenueBetween(startIso: string, endIso: string): Promise<number> {
  const result = await prisma.sale.aggregate({
    _sum: {
      totalAmount: true
    },
    where: {
      createdAt: {
        gte: new Date(startIso),
        lt: new Date(endIso)
      }
    }
  });

  return result._sum.totalAmount ?? 0;
}