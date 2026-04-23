"use client";

import { Activity } from "lucide-react";
import { LoginPage } from "@takaki/go-design-system";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const handleGoogleLogin = async () => {
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
