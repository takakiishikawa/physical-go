import { AppLayout } from "@takaki/go-design-system";
import { PhysicalGoSidebar } from "@/components/layout/physical-go-sidebar";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout sidebar={<PhysicalGoSidebar />}>
      {children}
    </AppLayout>
  );
}
