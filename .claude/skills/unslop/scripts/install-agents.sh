#!/usr/bin/env bash
# Install the unslop studio roles as Claude Code subagents.
#
#   bash install-agents.sh           -> ./.claude/agents/   (this project only)
#   bash install-agents.sh --user    -> ~/.claude/agents/   (every project)
#
# Role files refer to the skill folder as <unslop>. Installing replaces that placeholder with
# the real path, so the installed agents can read the libraries from any project.
# Without installing, the orchestrator can still run the roles by passing the role file to a
# general-purpose subagent (see SKILL.md), so this step is optional.
set -euo pipefail

skill_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
repo_dir="$(cd "$skill_dir/../.." && pwd)"
dest=".claude/agents"
if [ "${1:-}" = "--user" ]; then dest="$HOME/.claude/agents"; fi
mkdir -p "$dest"

for f in "$skill_dir"/agents/*.md; do
  out="$dest/unslop-$(basename "$f")"
  sed -e "s#<unslop>#${skill_dir}#g" -e "s#<repo>#${repo_dir}#g" "$f" > "$out"
  echo "installed $out"
done
echo "Done. Run /agents in Claude Code to confirm they are listed (start a new session if they are not)."
