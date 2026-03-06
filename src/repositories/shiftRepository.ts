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