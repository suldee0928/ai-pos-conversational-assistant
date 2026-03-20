import { prisma } from "../lib/prisma";

export async function getCurrentShifts(at: string) {
  const currentTime = new Date(at);

  return prisma.shift.findMany({
    where: {
      startTime: {
        lte: currentTime
      },
      OR: [
        { endTime: null },
        {
          endTime: {
            gte: currentTime
          }
        }
      ]
    },
    include: {
      employee: true
    }
  });
}

export async function getDailyRevenue(date: string): Promise<number> {
  const start = new Date(date);
  const end = new Date(date);
  end.setDate(end.getDate() + 1);

  const result = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: start,
        lt: end
      }
    }
  });

  return result._sum.totalAmount ?? 0;
}

export async function compareRevenuePeriods(
  a_from: string,
  a_to: string,
  b_from: string,
  b_to: string
) {
  const aStart = new Date(a_from);
  const aEnd = new Date(a_to);
  aEnd.setDate(aEnd.getDate() + 1);

  const bStart = new Date(b_from);
  const bEnd = new Date(b_to);
  bEnd.setDate(bEnd.getDate() + 1);

  const aResult = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: aStart,
        lt: aEnd
      }
    }
  });

  const bResult = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: bStart,
        lt: bEnd
      }
    }
  });

  return {
    periodA: aResult._sum.totalAmount ?? 0,
    periodB: bResult._sum.totalAmount ?? 0
  };
}