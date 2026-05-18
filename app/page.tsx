import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";

export default function Index() {
  const user = currentUser();
  if (user) redirect("/dashboard");
  redirect("/login");
}
