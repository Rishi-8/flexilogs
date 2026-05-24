import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withUser, HttpError } from "@/lib/api-helpers";
import { LogUpdateSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const existing = await prisma.log.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId)
      throw new HttpError(404, "Not found");
    const body = LogUpdateSchema.parse(await req.json());
    if (body.categoryId) {
      const cat = await prisma.category.findUnique({
        where: { id: body.categoryId },
      });
      if (!cat || cat.userId !== userId)
        throw new HttpError(400, "Invalid category");
    }
    return prisma.log.update({
      where: { id: params.id },
      data: {
        categoryId: body.categoryId,
        title: body.title,
        description: body.description ?? undefined,
        date: body.date,
        startTime: body.startTime ?? undefined,
        endTime: body.endTime ?? undefined,
        tags: body.tags,
      },
    });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const existing = await prisma.log.findUnique({ where: { id: params.id } });
    if (!existing || existing.userId !== userId)
      throw new HttpError(404, "Not found");
    await prisma.log.delete({ where: { id: params.id } });
    return { ok: true };
  });
}
