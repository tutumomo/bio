export const CLINICAL_DISCLAIMER_EN =
  "FOR RESEARCH AND EDUCATION USE ONLY - NOT FOR CLINICAL DIAGNOSIS. " +
  "All variant classifications must be reviewed by a certified clinical geneticist " +
  "before any clinical decision. Do not enter patient identifiers (PHI).";

export const CLINICAL_DISCLAIMER_ZH =
  "本工具僅供研究與教育用途，不可用於臨床診斷。" +
  "所有變異分類結果應由臨床遺傳師覆核後始可作為臨床決策依據。" +
  "請勿輸入可識別之病患個資（PHI）。";

export function ClinicalDisclaimer() {
  return (
    <div
      role="alert"
      className="border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-100"
    >
      <p className="font-bold">Research use only</p>
      <p>{CLINICAL_DISCLAIMER_EN}</p>
      <p className="mt-1">{CLINICAL_DISCLAIMER_ZH}</p>
    </div>
  );
}
