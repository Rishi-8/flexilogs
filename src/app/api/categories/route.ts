import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withUser } from "@/lib/api-helpers";
import { CategoryCreateSchema } from "@/lib/schemas";

export async function GET() {
  return withUser(async (userId) => {
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    return categories;
  });
}

export async function POST(req: NextRequest) {
  return withUser(async (userId) => {
    const body = CategoryCreateSchema.parse(await req.json());
    return prisma.category.create({
      data: { ...body, userId },
    });
  });
}
