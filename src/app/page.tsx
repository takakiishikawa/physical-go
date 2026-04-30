import dynamic from "next/dynamic";

const LoginPageClient = dynamic(
  () => import("@/components/login-page-client"),
  { ssr: false },
);

export default function Page() {
  return <LoginPageClient />;
}
