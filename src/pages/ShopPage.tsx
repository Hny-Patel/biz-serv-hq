import { Store } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";

export default function ShopPage() {
  return (
    <div>
      <PageHeader title="Shop" description="Manage your storefront and public profile." actionLabel="Create Shop" />
      <EmptyState
        icon={Store}
        title="No shop set up yet"
        description="Create your shop profile to showcase your services and attract customers."
        actionLabel="Create Shop"
      />
    </div>
  );
}
