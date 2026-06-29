"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { STATUS_LABELS } from "@/lib/candidate";

interface Props {
  submissionId: string;
  currentStatus: string;
}

export function StatusUpdater({ submissionId, currentStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function handleChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Cambiar estado
      </label>
      <select
        value={status}
        disabled={loading}
        onChange={(e) => handleChange(e.target.value)}
        className="px-4 py-2 text-sm font-medium text-white border rounded-lg bg-white/10 border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50"
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
