from backend.services.acmg_classifier import EvidenceCode, classify


def test_pvs1_null_variant_with_pathogenic_clinvar():
    ctx = {
        "consequence": "stop_gained",
        "impact": "HIGH",
        "cadd_score": 35,
        "gerp_score": 5.0,
        "gnomad_af_popmax": 0.0,
        "clinvar_classification": "Pathogenic",
        "clinvar_review_stars": 3,
    }
    res = classify(ctx)
    assert EvidenceCode.PVS1 in res["evidence_codes"]


def test_ps3_pathogenic_with_expert_review():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 28,
        "gerp_score": 4.5,
        "gnomad_af_popmax": 0.00005,
        "clinvar_classification": "Pathogenic",
        "clinvar_review_stars": 3,
    }
    res = classify(ctx)
    assert EvidenceCode.PS3 in res["evidence_codes"]


def test_pm2_rare_in_gnomad():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 22,
        "gerp_score": 3.0,
        "gnomad_af_popmax": 0.00005,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.PM2 in res["evidence_codes"]


def test_pp3_high_cadd_and_conserved():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 27,
        "gerp_score": 4.5,
        "gnomad_af_popmax": None,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.PP3 in res["evidence_codes"]


def test_ba1_common_in_gnomad():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 15,
        "gerp_score": 2.0,
        "gnomad_af_popmax": 0.12,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.BA1 in res["evidence_codes"]


def test_bs1_above_1pct():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 12,
        "gerp_score": 2.0,
        "gnomad_af_popmax": 0.02,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.BS1 in res["evidence_codes"]
    assert EvidenceCode.BA1 not in res["evidence_codes"]


def test_bp4_low_cadd_low_impact():
    ctx = {
        "consequence": "missense_variant",
        "impact": "LOW",
        "cadd_score": 5,
        "gerp_score": 1.0,
        "gnomad_af_popmax": 0.001,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.BP4 in res["evidence_codes"]


def test_bp7_synonymous_not_conserved():
    ctx = {
        "consequence": "synonymous_variant",
        "impact": "LOW",
        "cadd_score": 8,
        "gerp_score": 0.5,
        "gnomad_af_popmax": 0.001,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert EvidenceCode.BP7 in res["evidence_codes"]


def test_tier_pathogenic_pvs1_plus_pp():
    ctx = {
        "consequence": "stop_gained",
        "impact": "HIGH",
        "cadd_score": 35,
        "gerp_score": 5.0,
        "gnomad_af_popmax": 0.0,
        "clinvar_classification": "Pathogenic",
        "clinvar_review_stars": 3,
    }
    res = classify(ctx)
    assert res["tier"] == "Pathogenic"


def test_tier_benign_ba1_alone_sufficient():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 15,
        "gerp_score": 2.0,
        "gnomad_af_popmax": 0.12,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert res["tier"] == "Benign"


def test_tier_vus_when_no_evidence():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 18,
        "gerp_score": 3.0,
        "gnomad_af_popmax": 0.001,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert res["tier"] == "Uncertain significance"
    assert res["evidence_codes"] == []


def test_classify_returns_rationale_string():
    ctx = {
        "consequence": "missense_variant",
        "impact": "MODERATE",
        "cadd_score": 27,
        "gerp_score": 4.5,
        "gnomad_af_popmax": 0.00005,
        "clinvar_classification": None,
        "clinvar_review_stars": 0,
    }
    res = classify(ctx)
    assert "rationale" in res
    assert isinstance(res["rationale"], str)
    assert len(res["rationale"]) > 0
