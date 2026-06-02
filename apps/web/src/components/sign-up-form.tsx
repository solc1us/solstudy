import { Button } from "@solstudy/ui/components/button";
import { Input } from "@solstudy/ui/components/input";
import { Label } from "@solstudy/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.replace("/study-mode");
    }
  }, [router, session]);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            router.push("/study-mode");
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
  });

  if (isPending || session) {
    return <Loader />;
  }

  return (
    <main className="flex min-h-0 flex-1 items-center justify-center bg-[#111722] px-4 py-8 text-white">
      <div className="w-full max-w-md rounded-2xl border border-[#232f48] bg-[#1a2332]/95 p-5 shadow-2xl shadow-black/20 sm:p-6">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">SolStudy</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Create Account</h1>
          <p className="mt-2 text-sm text-[#92a4c9]">
            Start syncing tasks, focus sessions, and ideas.
          </p>
        </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[#c5d3ef]">Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11 rounded-xl border-[#232f48] bg-[#111722] px-3 text-sm text-white placeholder:text-[#556987] focus-visible:border-blue-500/60"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-300">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[#c5d3ef]">Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11 rounded-xl border-[#232f48] bg-[#111722] px-3 text-sm text-white placeholder:text-[#556987] focus-visible:border-blue-500/60"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-300">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name} className="text-[#c5d3ef]">Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="h-11 rounded-xl border-[#232f48] bg-[#111722] px-3 text-sm text-white placeholder:text-[#556987] focus-visible:border-blue-500/60"
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-sm text-red-300">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-[0_0_18px_rgba(19,91,236,0.28)] hover:bg-blue-500"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Sign Up"}
              {!isSubmitting ? <ArrowRight size={16} /> : null}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="rounded-xl text-blue-300 hover:text-blue-200"
        >
          Already have an account? Sign In
        </Button>
      </div>
    </div>
    </main>
  );
}
