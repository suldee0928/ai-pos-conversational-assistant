import { prisma } from "../lib/prisma";

function utcDayRange(date: string): { start: Date; endExclusive: Date } {
  const start = new Date(`${date}T00:00:00.000Z`);
  const endExclusive = new Date(start);
  endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
  return { start, endExclusive };
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return 0;
  return Number(value);
}

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
  const { start, endExclusive } = utcDayRange(date);

  const result = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: start,
        lt: endExclusive
      }
    }
  });

  return asNumber(result._sum.totalAmount);
}

export async function compareRevenuePeriods(
  a_from: string,
  a_to: string,
  b_from: string,
  b_to: string
) {
  const { start: aStart } = utcDayRange(a_from);
  const { endExclusive: aEndFromTo } = utcDayRange(a_to);

  const { start: bStart } = utcDayRange(b_from);
  const { endExclusive: bEnd } = utcDayRange(b_to);

  const aResult = await prisma.sale.aggregate({
    _sum: { totalAmount: true },
    where: {
      createdAt: {
        gte: aStart,
        lt: aEndFromTo
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
    periodA: asNumber(aResult._sum.totalAmount),
    periodB: asNumber(bResult._sum.totalAmount)
  };
}