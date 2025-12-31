import { redirect } from "next/navigation";

export default function ProPendingRedirect() {
  redirect("/auth/pending");
}
