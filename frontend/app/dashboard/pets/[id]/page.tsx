import { Suspense } from "react";

import PetDetail from "@/components/PetDetail";

export default function PetPage({ params }: { params: { id: string } }) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <span className="loading loading-spinner loading-lg" />
        </div>
      }
    >
      <PetDetail id={params.id} />
    </Suspense>
  );
}
