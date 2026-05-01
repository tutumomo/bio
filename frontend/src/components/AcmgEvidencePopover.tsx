import { useState } from "react";

interface AcmgEvidencePopoverProps {
  tier: string | null | undefined;
  codes: string[] | null | undefined;
  rationale: string | null | undefined;
}

const TIER_CLASS: Record<string, string> = {
  Pathogenic: "text-red-700 dark:text-red-300",
  "Likely pathogenic": "text-orange-700 dark:text-orange-300",
  "Uncertain significance": "text-slate-600 dark:text-slate-300",
  "Likely benign": "text-emerald-700 dark:text-emerald-300",
  Benign: "text-blue-700 dark:text-blue-300",
};

export function AcmgEvidencePopover({ tier, codes, rationale }: AcmgEvidencePopoverProps) {
  const [open, setOpen] = useState(false);

  if (!tier) {
    return <span className="text-xs text-slate-400 dark:text-slate-500">N/A</span>;
  }

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
        className={`text-left text-xs font-bold ${TIER_CLASS[tier] ?? TIER_CLASS["Uncertain significance"]}`}
        title="Click for ACMG evidence codes"
      >
        {tier}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="font-bold text-slate-900 dark:text-slate-100">Evidence codes</div>
          <div className="mt-1 font-mono text-slate-600 dark:text-slate-300">
            {codes?.length ? codes.join(", ") : "none"}
          </div>
          {rationale && (
            <div className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">
              {rationale}
            </div>
          )}
          <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500 dark:border-slate-800 dark:text-slate-400">
            Automated ACMG classification. Manual clinical review required.
          </div>
        </div>
      )}
    </span>
  );
}
