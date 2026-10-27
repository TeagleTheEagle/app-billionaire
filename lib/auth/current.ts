import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/session";

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: {
      businesses: {
        orderBy: { createdAt: "asc" },
        take: 1,
        include: { settings: true, subscription: true },
      },
    },
  });
  if (!user) return null;
  return { ...user, business: user.businesses[0] ?? null };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For server components: redirects to login when signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For server components inside the app: also requires an onboarded business. */
export async function requireBusiness() {
  const user = await requireUser();
  if (!user.business) redirect("/onboarding");
  return { user, business: user.business };
}

export class ApiAuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/** For API routes: throws instead of redirecting. */
export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) throw new ApiAuthError("Not signed in", 401);
  return user;
}

export async function requireApiBusiness() {
  const user = await requireApiUser();
  if (!user.business) throw new ApiAuthError("Business profile not set up yet", 403);
  return { user, business: user.business };
}
