import { redirect } from "next/navigation";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";

export async function requireCurrentUser() {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    throw error;
  }
}
