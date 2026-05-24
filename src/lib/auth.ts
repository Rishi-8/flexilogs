import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { DEFAULT_CATEGORIES } from "./defaults";

/** Returns the current user's id, creating their User row + default categories on first call. */
export async function getOrCreateUser(): Promise<{ userId: string }> {
  const { userId } = auth();
  if (!userId) throw new UnauthorizedError();

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (existing) return { userId };

  const cu = await currentUser();
  const email = cu?.emailAddresses?.[0]?.emailAddress ?? null;
  const name =
    [cu?.firstName, cu?.lastName].filter(Boolean).join(" ") ||
    cu?.username ||
    null;

  await prisma.$transaction([
    prisma.user.create({
      data: { id: userId, email, name },
    }),
    prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map((c) => ({ ...c, userId })),
    }),
  ]);

  return { userId };
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}
