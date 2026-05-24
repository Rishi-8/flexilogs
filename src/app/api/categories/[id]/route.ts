import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withUser, HttpError } from "@/lib/api-helpers";
import { CategoryUpdateSchema } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.userId !== userId)
      throw new HttpError(404, "Not found");
    const body = CategoryUpdateSchema.parse(await req.json());
    return prisma.category.update({
      where: { id: params.id },
      data: body,
    });
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withUser(async (userId) => {
    const existing = await prisma.category.findUnique({
      where: { id: params.id },
    });
    if (!existing || existing.userId !== userId)
      throw new HttpError(404, "Not found");

    const all = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (all.length <= 1)
      throw new HttpError(400, "You must keep at least one category");

    const fallback = all.find((c) => c.id !== params.id)!;

    await prisma.$transaction([
      prisma.log.updateMany({
        where: { userId, categoryId: params.id },
        data: { categoryId: fallback.id },
      }),
      prisma.category.delete({ where: { id: params.id } }),
    ]);

    return { ok: true, fallbackId: fallback.id };
  });
}
