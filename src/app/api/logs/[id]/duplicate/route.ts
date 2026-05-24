import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withUser, HttpError } from "@/lib/api-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const existing = await prisma.log.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId)
      throw new HttpError(404, "Not found");
    return prisma.log.create({
      data: {
        userId,
        categoryId: existing.categoryId,
        title: existing.title,
        description: existing.description,
        date: existing.date,
        startTime: existing.startTime,
        endTime: existing.endTime,
        tags: existing.tags,
      },
    });
  });
}
