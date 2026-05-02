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


### OMIM Disease Associations

- OMIM disease entries with inheritance pattern and age of onset displayed in Gene Detail page.
- Orphanet rare disease cross-references linked from each OMIM entry.

### Reproducibility Manifest

- Each CSV/TSV export includes a companion `manifest.json` recording API versions and `accessed_at` timestamps.
- Supports reproducibility requirements for supplementary tables in publications.

## Clinical Disclaimer

> **FOR RESEARCH USE ONLY — Not for clinical diagnosis.**
> All variant classifications must be reviewed by a certified clinical geneticist before any clinical decision. Do not enter patient identifiers (PHI) into this system.

The disclaimer is shown in the UI banner, README, API response metadata, and CSV/TSV export metadata.

## Technical Changes

- Backend runtime standardized on Python 3.11.
- Added `clinvar`, `gnomad`, `acmg_classifier`, `omim`, `orphanet` service modules.
- Added clinical fields to `variant_cache` via two Alembic migrations.
- Reduced Ensembl VEP batch size to 200 to match the current upstream API limit.
- Added rate-limit handling for NCBI and throttled gnomAD batch lookups.
- Frontend: new VariantTable columns for HGVS, ClinVar, gnomAD AF_popmax, and ACMG tier; collapsible `AcmgEvidencePopover`; `OmimDiseasePanel` in Gene Detail page.

## Migration

Run after deploying:

```bash
cd backend
alembic upgrade head
```

This adds six nullable fields to `variant_cache`:
- `hgvsc`, `hgvsp` (migration `7552cb4e3125`)
- `clinvar_significance`, `clinvar_review_stars`, `gnomad_af_popmax`, `acmg_tier` (migration `453a3747ceb7`)

## Verification

- Backend test suite: **68 passed, 1 warning**
- Frontend typecheck: `npm run lint`
- ACMG classifier: 12 offline rule and tier mapping tests

## Next

- v3.0: pharmacogenomics (PharmGKB/CPIC), batch gene-list queries, PubMed variant citations, protein lollipop plots.
