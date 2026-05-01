from __future__ import annotations

from enum import Enum
from typing import Dict, List


class EvidenceCode(str, Enum):
    PVS1 = "PVS1"
    PS3 = "PS3"
    PM2 = "PM2"
    PP3 = "PP3"
    BA1 = "BA1"
    BS1 = "BS1"
    BS2 = "BS2"
    BP4 = "BP4"
    BP7 = "BP7"


_PM2_AF_THRESHOLD = 0.0001
_BS2_AF_LOW = 0.005
_BS1_AF_THRESHOLD = 0.01
_BA1_AF_THRESHOLD = 0.05
_PP3_CADD = 25
_PP3_GERP = 4.0
_BP4_CADD = 10
_BP7_GERP = 2.0
_PS3_REVIEW_STARS = 2
_NULL_CONSEQUENCES = {
    "stop_gained",
    "frameshift_variant",
    "splice_acceptor_variant",
    "splice_donor_variant",
    "start_lost",
    "transcript_ablation",
}


def _check_pathogenic_codes(ctx: Dict) -> List[EvidenceCode]:
    codes = []
    consequence = (ctx.get("consequence") or "").lower()
    cadd = ctx.get("cadd_score") or 0
    gerp = ctx.get("gerp_score") or 0
    af_popmax = ctx.get("gnomad_af_popmax")
    clinvar = (ctx.get("clinvar_classification") or "").lower()
    review_stars = ctx.get("clinvar_review_stars") or 0

    if consequence in _NULL_CONSEQUENCES and "pathogenic" in clinvar:
        codes.append(EvidenceCode.PVS1)

    if "pathogenic" in clinvar and review_stars >= _PS3_REVIEW_STARS:
        codes.append(EvidenceCode.PS3)

    if af_popmax is not None and af_popmax < _PM2_AF_THRESHOLD:
        codes.append(EvidenceCode.PM2)

    if cadd >= _PP3_CADD and gerp >= _PP3_GERP:
        codes.append(EvidenceCode.PP3)

    return codes


def _check_benign_codes(ctx: Dict) -> List[EvidenceCode]:
    codes = []
    consequence = (ctx.get("consequence") or "").lower()
    impact = (ctx.get("impact") or "").upper()
    cadd = ctx.get("cadd_score")
    gerp = ctx.get("gerp_score")
    af_popmax = ctx.get("gnomad_af_popmax")

    if af_popmax is not None and af_popmax > _BA1_AF_THRESHOLD:
        codes.append(EvidenceCode.BA1)
        return codes

    if af_popmax is not None and af_popmax > _BS1_AF_THRESHOLD:
        codes.append(EvidenceCode.BS1)
    elif af_popmax is not None and af_popmax > _BS2_AF_LOW:
        codes.append(EvidenceCode.BS2)

    if cadd is not None and cadd < _BP4_CADD and impact != "HIGH":
        codes.append(EvidenceCode.BP4)

    if "synonymous" in consequence and gerp is not None and gerp < _BP7_GERP:
        codes.append(EvidenceCode.BP7)

    return codes


def _derive_tier(codes: List[EvidenceCode]) -> str:
    has_pvs1 = EvidenceCode.PVS1 in codes
    ps_count = sum(1 for code in codes if code.value.startswith("PS"))
    pm_count = sum(1 for code in codes if code.value.startswith("PM"))
    pp_count = sum(1 for code in codes if code.value.startswith("PP"))

    has_ba1 = EvidenceCode.BA1 in codes
    bs_count = sum(1 for code in codes if code.value.startswith("BS"))
    bp_count = sum(1 for code in codes if code.value.startswith("BP"))

    if has_ba1:
        return "Benign"
    if bs_count >= 2:
        return "Benign"
    if bs_count >= 1 and bp_count >= 1:
        return "Likely benign"
    if bp_count >= 2:
        return "Likely benign"

    supporting = ps_count + pm_count + pp_count
    if has_pvs1 and supporting >= 1:
        return "Pathogenic"
    if ps_count >= 2:
        return "Pathogenic"
    if ps_count >= 1 and pm_count >= 3:
        return "Pathogenic"
    if has_pvs1:
        return "Likely pathogenic"
    if ps_count >= 1:
        return "Likely pathogenic"
    if pm_count >= 3:
        return "Likely pathogenic"
    if pm_count >= 2 and pp_count >= 2:
        return "Likely pathogenic"

    return "Uncertain significance"


def _build_rationale(codes: List[EvidenceCode], tier: str) -> str:
    if not codes:
        return f"{tier}: no automated evidence triggered"
    code_str = ", ".join(code.value for code in codes)
    return f"{tier}: triggered codes = {code_str}"


def classify(variant_context: Dict) -> Dict:
    pathogenic_codes = _check_pathogenic_codes(variant_context)
    benign_codes = _check_benign_codes(variant_context)
    all_codes = pathogenic_codes + benign_codes
    tier = _derive_tier(all_codes)
    return {
        "tier": tier,
        "evidence_codes": all_codes,
        "rationale": _build_rationale(all_codes, tier),
    }
