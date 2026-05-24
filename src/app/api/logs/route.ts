import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withUser, HttpError } from "@/lib/api-helpers";
import { LogCreateSchema, LogQuerySchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  return withUser(async (userId) => {
    const { searchParams } = new URL(req.url);
    const q = LogQuerySchema.parse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    const where: any = { userId };
    if (q.from || q.to) {
      where.date = {};
      if (q.from) where.date.gte = q.from;
      if (q.to) where.date.lte = q.to;
    }
    return prisma.log.findMany({
      where,
      orderBy: [{ date: "desc" }, { startTime: "asc" }],
    });
  });
}

export async function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = LogCreateSchema.parse(await req.json());
    const cat = await prisma.category.findUnique({
      where: { id: body.categoryId },
    });
    if (!cat || cat.userId !== userId)
      throw new HttpError(400, "Invalid category");
    return prisma.log.create({
      data: {
        userId,
        categoryId: body.categoryId,
        title: body.title,
        description: body.description ?? null,
        date: body.date,
        startTime: body.startTime ?? null,
        endTime: body.endTime ?? null,
        tags: body.tags,
      },
    });
  });
}
