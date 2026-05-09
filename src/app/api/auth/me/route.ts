import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
  try {
    const user = await getCurrentUser();

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        title: user.title,
        department: user.department,
        teamId: user.teamId,
        roles: user.roles,
        scopes: user.scopes,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json(
        { authenticated: false, error: error.message },
        { status: 401 },
      );
    }

    throw error;
  }
}
