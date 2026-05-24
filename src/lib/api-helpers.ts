import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOrCreateUser, UnauthorizedError } from "./auth";

export async function withUser<T>(
  fn: (userId: string) => Promise<T>
): Promise<NextResponse> {
  try {
    const { userId } = await getOrCreateUser();
    const data = await fn(userId);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", issues: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof HttpError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
