"use client";

import { useRouter } from "next/navigation";

import SignUpForm from "@/components/sign-up-form";

export default function RegisterPage() {
  const router = useRouter();

  return <SignUpForm onSwitchToSignIn={() => router.push("/login")} />;
}
