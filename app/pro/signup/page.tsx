import { redirect } from "next/navigation";

export default function ProSignupRedirect() {
  redirect("/auth/register-pro");
}
