"use client";

import dynamic from "next/dynamic";
import { Activity } from "lucide-react";

const LoginPage = dynamic(
  () =>
    import("@takaki/go-design-system").then((m) => ({ default: m.LoginPage })),
  { loading: () => <div className="min-h-screen" /> },
);

export default function Page() {
  const handleGoogleLogin = async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://physical-go.vercel.app/auth/callback",
        scopes: "email profile",
      },
    });
  };

  return (
    <LoginPage
      productName="PhysicalGo"
      productLogo={
        <Activity
          className="w-5 h-5"
          style={{ color: "var(--color-primary)" }}
        />
      }
      tagline="撮る・記録する・振り返る。"
      onGoogleSignIn={handleGoogleLogin}
    />
  );
}
