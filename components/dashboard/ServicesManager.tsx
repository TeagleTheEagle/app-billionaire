"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/common/Button";
import { ServiceForm } from "@/components/forms/ServiceForm";

export function ServicesManager() {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Service catalog</h2>
          <p className="text-sm text-slate-500">What you offer and how it’s priced. Add pricing rules on the Pricing tab.</p>
        </div>
        {!adding && <Button onClick={() => setAdding(true)}>+ Add service</Button>}
      </div>
      {adding && <div className="mt-5 border-t border-slate-100 pt-5"><ServiceForm onDone={() => { setAdding(false); router.refresh(); }} onCancel={() => setAdding(false)} /></div>}
    </div>
  );
}
