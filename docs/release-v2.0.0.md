# v2.0.0 - Clinical-Grade Variant Classification

Helix Bio v2.0 upgrades the project from a gene and variant browser into a clinical genetics research tool. It adds ClinVar interpretation, gnomAD population frequency, HGVS nomenclature, and automated ACMG/AMP evidence summaries.

## Highlights

### ClinVar Pathogenicity

- Germline classification from ClinVar, including Pathogenic, Likely pathogenic, VUS, Likely benign, Benign, conflicting interpretations, and related categories.
- Review status converted into a 0-4 star rating.
- Condition metadata with OMIM, Orphanet, MedGen, and MONDO cross-references when available.

### gnomAD Population Frequency

- gnomAD r4 rsID lookup.
- Overall allele frequency, population frequency details, and AF popmax.
- Graceful handling for variants absent from gnomAD.

### ACMG/AMP Evidence Summary

- Automated preliminary 5-tier classification: Pathogenic, Likely pathogenic, Uncertain significance, Likely benign, and Benign.
- Nine supported evidence codes: PVS1, PS3, PM2, PP3, BA1, BS1, BS2, BP4, and BP7.
- Evidence code and rationale popover in the variant table.

### HGVS Nomenclature

- Coding HGVS (`hgvsc`) and protein HGVS (`hgvsp`) extraction from Ensembl VEP.
- Variant table and exports now include clinical-grade nomenclature fields.

## Clinical Disclaimer

> **FOR RESEARCH USE ONLY - Not for clinical diagnosis.**
> All variant classifications must be reviewed by a certified clinical geneticist before any clinical decision. Do not enter patient identifiers (PHI) into this system.

The disclaimer is shown in the UI, README, and CSV/TSV export metadata.

## Technical Changes

- Backend runtime standardized on Python 3.11.
- Added ClinVar, gnomAD, and ACMG service modules.
- Added clinical fields to `variant_cache`.
- Reduced Ensembl VEP batch size to 200 to match the current upstream API limit.
- Added rate-limit handling for NCBI and throttled gnomAD batch lookups.
- Added frontend columns for HGVS, ClinVar, gnomAD AF popmax, and ACMG tier.

## Migration

Run:

```bash
cd backend
alembic upgrade head
```

This adds six nullable fields to `variant_cache`: `hgvsc`, `hgvsp`, `clinvar_significance`, `clinvar_review_stars`, `gnomad_af_popmax`, and `acmg_tier`.

## Verification

- Backend test suite: `64 passed, 1 warning`
- Frontend typecheck: `npm run lint`
- ACMG classifier: 12 offline rule and tier mapping tests

## Next

- v2.5: OMIM disease associations, methods generation, reproducibility manifest.
- v3.0: pharmacogenomics, batch queries, PubMed links, and protein lollipop plots.
