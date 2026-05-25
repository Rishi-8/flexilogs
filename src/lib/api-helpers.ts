import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getOrCreateUser, UnauthorizedError } from "./auth";
import { checkRateLimit } from "./rate-limit";
import { reportError } from "./report-error";

export async function withUser<T>(
  fn: (userId: string) => Promise<T>
): Promise<NextResponse> {
  try {
    const { userId } = await getOrCreateUser();
    const rl = checkRateLimit(userId);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000)).toString(),
          },
        }
      );
    }
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
    reportError(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
