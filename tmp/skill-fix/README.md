# Skill and Wiki Fix Mirror

This directory contains a writable mirror of external targets that could not be edited directly in this session:

- `~/.agents/skills/graphify/SKILL.md`
- `~/.agents/skills/knowledge-workflow/SKILL.md`
- `~/.agents/skills/llm-wiki/SKILL.md`
- `~/wiki/...`

## Contents

- `skills/` - patched mirror copies of the three skill files
- `wiki/` - patched mirror copy of the relevant wiki pages
- `patches/graphify-skill.patch`
- `patches/knowledge-workflow-skill.patch`
- `patches/llm-wiki-skill.patch`
- `patches/*.codex.patch` - same content, labeled for the duplicate copies under `~/.codex/skills/`
- `patches/wiki-remediation.patch`

## Verification performed

1. Confirmed the patched skill copies contain the new compatibility and workflow constraints.
2. Ran wiki lint checks against the mirrored wiki copy:
   - missing frontmatter fields: `0`
   - broken wikilinks: `0`
   - orphan pages: `0`
3. Rebuilt a minimal `graphify` graph and ran `graphify query` successfully.

## Limitation

The session sandbox only allowed writes inside `/Users/tuchengshin/bio`, so the real files in `~/.agents`, `~/.codex`, and `~/wiki` were not modified directly.
