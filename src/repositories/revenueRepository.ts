import { prisma } from "../lib/prisma";

export async function getDailyRevenue(date: string): Promise<number> {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const result = await prisma.sale.aggregate({
    _sum: {
      totalAmount: true
    },
    where: {
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });

  return result._sum.totalAmount ?? 0;
}