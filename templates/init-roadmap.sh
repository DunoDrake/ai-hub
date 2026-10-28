#!/bin/bash
# Run only when the operator requests a four-phase roadmap.
# Usage: bash /path/to/ai-hub/templates/init-roadmap.sh [--with-retrospective]
# Run from the adopting project's root after backlog init.
set -eu
WITH_RETROSPECTIVE=false
for arg in "$@"; do
  case "$arg" in
    --with-retrospective) WITH_RETROSPECTIVE=true ;;
    *) echo "Usage: $0 [--with-retrospective]" >&2; exit 1 ;;
  esac
done
backlog milestone add "Phase 0: Foundation" --description "Repository setup, architecture, core infrastructure"
backlog milestone add "Phase 1: Features" --description "Develop and integrate main capabilities"
backlog milestone add "Phase 2: Polish" --description "Optimize, test, refine UX"
backlog milestone add "Phase 3: Release" --description "Final QA, documentation, production readiness"
if [ "$WITH_RETROSPECTIVE" = true ]; then
  # CLI owns document metadata. Fill the generated documents with backlog doc edit.
  backlog doc create "Phase completion checklist" --type guide
  backlog doc create "Phase retrospective" --type other
fi
echo "Milestones created. See AI Hub guides/roadmap-quickstart.md."
echo "Create routed tickets with acceptance criteria; do not treat generated document stubs as completed reviews."
