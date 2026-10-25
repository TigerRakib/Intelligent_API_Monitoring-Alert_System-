import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma";
import type { AlertQuery } from "../schemas/alert-query.schema";

export async function getAlerts(query: AlertQuery) {
  const { severity, status, api_name, page, limit, sort } = query;

  const where: Prisma.AlertWhereInput = {
    ...(severity ? { severity } : {}),
    ...(status !== "ALL" ? { status } : {}),
    ...(api_name
      ? {
          event: {
            apiService: {
              name: api_name,
            },
          },
        }
      : {}),
  };

  const skip = (page - 1) * limit;
  const [total, alerts] = await prisma.$transaction([
    prisma.alert.count({ where }),
    prisma.alert.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: sort }, { id: sort }],
      include: {
        event: {
          include: {
            apiService: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    alerts,
  };
}
