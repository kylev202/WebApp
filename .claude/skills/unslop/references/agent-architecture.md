# Running the studio in Claude Code

How the unslop team maps onto Claude Code features, and why it is shaped this way. Read this
when setting up the studio for a project, choosing between subagents and agent teams, or
adding hooks. Facts about Claude Code features come from the official docs listed in Sources
and were checked in November 2026; features marked experimental may change.

## Contents
- Why a studio and not one prompt
- The hierarchy
- Three ways to run it
- Spawning a role
- Parallelism and handoffs
- The loops
- Memory and the learning loop
- Optional hooks
- Optional agent teams
- Sources

## Why a studio and not one prompt

Three of the root causes of AI slop are structural, not stylistic (see
`references/ai-slop-atlas.md`): the model skips the brief and fills gaps with the average, it
cannot see what it built, and it grades its own work generously. A single long prompt cannot
fix those. A process can:

- Separate roles force separate decisions. A typographer whose only job is type, reading only
  the type library, makes a typographic decision instead of inheriting a default.
- Written artifacts (`.unslop/*.md`) turn each decision into something the next role must
  honor and the critic can check.
- An evaluator that does not build (the design critic) plus screenshots it must look at
  closes the feedback loop the model otherwise lacks. Anthropic calls this the
  evaluator-optimizer pattern; the creative director dispatching specialists is the
  orchestrator-workers pattern [S1].
- Each specialist runs the basic agent loop on its own slice: gather context, act, verify [S2].

The process is scaled to the task. Anthropic's own guidance is to use the simplest structure
that works [S1], so a single component never gets nine agents (see "Size the team" in SKILL.md).

## The hierarchy

```
Creative director  (the main Claude Code thread running SKILL.md)
├── Discover:  ux-strategist, copywriter
├── Direction: art-director
├── System:    typographer, colorist, layout-designer   (parallel)
├── Build:     frontend-engineer, motion-designer
└── QA:        design-critic  (evaluator; never edits product code)
```

The creative director stays in the main thread because it holds the conversation with the
user, owns every decision gate and dispatches the loop. Claude Code lets subagents spawn
subagents up to three levels below the main conversation by default [S3], but the studio uses
one level on purpose: each extra level hides context from the director and costs tokens
without adding judgment. A specialist may still use a helper subagent for a narrow chore (for
example the engineer delegating an asset search).

## Three ways to run it

1. **Installed subagents (best for repeat use).** Run
   `bash <unslop>/scripts/install-agents.sh` (project) or `... --user` (all projects). This
   writes `.claude/agents/unslop-<role>.md` files with real paths. Spawn them by name
   (`unslop-typographer` and so on). Subagent files take YAML frontmatter with `name` and
   `description` required, plus optional `tools`, `model`, `color`, `memory`, `skills`,
   `effort`, `isolation` and others [S3]. Project agents override user agents with the same name [S3].
2. **Role-file subagents (no install).** Spawn a general-purpose subagent and tell it to read
   `<unslop>/agents/<role>.md` and act as that role, giving it the real paths for `<unslop>`
   and `<repo>`. Same behavior, no setup.
3. **Solo (no subagents).** On surfaces without subagents (claude.ai) or for size S work, the
   main agent reads each role file in turn and produces the same artifacts itself. The
   artifacts are the contract, so the process survives; only parallelism is lost. Keep the
   critic step honest by finishing the build, then re-reading `rubric.md` fresh before judging.

## Spawning a role

Use this prompt shape for every specialist, whether installed or role-file:

```
You are the unslop studio's <role>. Read <unslop>/agents/<role>.md and follow it.
<unslop> = /abs/path/to/core-design/unslop   <repo> = /abs/path/to/repo (may not exist)
Project root: /abs/path/to/project. Studio folder: /abs/path/to/project/.unslop/
Ready inputs: brief.md, direction.md, content.md   (list what exists)
Deliverable: <file(s)>.  Director's notes: <decisions, constraints, user preferences>.
Return a summary of at most 120 words.
```

Specialists return short summaries, and the detail lives in their files. This keeps the
director's context small enough to run the whole loop.

## Parallelism and handoffs

| Phase | Runs | Starts when | Writes |
|---|---|---|---|
| Discover | ux-strategist | intake done | brief.md |
| Discover | copywriter (draft) | brief.md exists | content.md |
| Direction | art-director | brief.md exists | direction.md |
| System | typographer, colorist, layout-designer in parallel | direction chosen | type.md, color.md, layout.md, tokens.*.css |
| System | copywriter (fit to layout) | layout.md exists | content.md (revised) |
| Build | frontend-engineer | system gate passed | code, build-notes.md |
| Build | motion-designer | build exists and stance is not "none" | motion.md, code |
| QA | design-critic | build exists | critique-n.md, shots/n/ |
| Fix | owners named in the critique, in parallel when they touch different files | verdict is fix | updated files |

Spawn independent roles in the same message so they run concurrently. Never let two roles
write the same file in parallel. That is why each system role has its own `tokens.<area>.css`
and the engineer merges them.

## The loops

- **Build loop (evaluator-optimizer).** build, then critic, then fixes routed to owners, then
  critic again. Stop on the rubric's stop criteria. After three loops, escalate to the user
  with the critique instead of lowering the bar.
- **Direction loop.** If the critic finds the problem is the direction itself (the swap or
  category test fails at the concept level), go back to the art director, not the engineer.
- **Learning loop (across projects).** See below.

## Memory and the learning loop

Two mechanisms, use both when available:

- `scripts/log.mjs` keeps a history file (`~/.claude/unslop/history.jsonl`, or
  `./.unslop/history.jsonl` if the home folder is not writable). The director logs each
  finished project; `roll.mjs` and `log.mjs check` read it so the next project avoids the same
  aesthetic, fonts, palette and layouts; `log.mjs lessons` surfaces recurring critic findings.
  It works on every surface because it is just a script.
- Native subagent memory: the installed art-director and design-critic declare
  `memory: user`, which gives each a persistent folder under `~/.claude/agent-memory/` whose
  `MEMORY.md` is loaded at startup [S3]. Use it for qualitative notes (what the user liked,
  which directions they rejected and why). It has no effect when auto memory is turned off [S3].

## Optional hooks

Hooks make two parts of the process automatic in projects that opt in by having a `.unslop/`
folder. Add to `.claude/settings.json` (replace the path):

```json
{
  "hooks": {
    "PostToolUse": [
      { "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "node /abs/path/core-design/unslop/scripts/hooks/post-edit-lint.mjs" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node /abs/path/core-design/unslop/scripts/hooks/stop-gate.mjs" }] }
    ]
  }
}
```

- `post-edit-lint.mjs` lints each UI file as it is written. Exit code 2 on PostToolUse sends
  stderr to Claude as feedback; the edit has already happened, so it informs rather than
  blocks [S4].
- `stop-gate.mjs` blocks the session from ending while `.unslop/brief.md` exists but the
  latest critique has no `Verdict: ship` or `Verdict: escalate`. Exit code 2 on Stop blocks the
  stop and gives Claude the reason [S4]. It respects `stop_hook_active` to avoid loops, and a
  project can opt out with `.unslop/skip-gate`.

## Optional agent teams

Claude Code has an experimental agent teams mode, enabled with
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`: a lead and teammates, each a full session, share a
task list and message each other [S5]. It costs more tokens than subagents and is worth it only
for size L work where specialists should challenge each other directly (for example the critic
and art director debating whether a direction is distinct enough). The lead plays the
creative director; teammates take the same role files and artifacts. Teammates do not apply a
definition's `skills` field [S3], and teams only run in interactive sessions [S5].

## Sources
- [S1] Anthropic, "Building effective agents" (orchestrator-workers, evaluator-optimizer), https://www.anthropic.com/engineering/building-effective-agents
- [S2] Claude Code docs, "How Claude Code works" (gather context, take action, verify), https://code.claude.com/docs/en/how-claude-code-works.md
- [S3] Claude Code docs, "Subagents", https://code.claude.com/docs/en/sub-agents.md
- [S4] Claude Code docs, "Hooks", https://code.claude.com/docs/en/hooks.md
- [S5] Claude Code docs, "Agent teams", https://code.claude.com/docs/en/agent-teams.md
- Claude Code docs, "Skills" (forked skills, `context: fork`), https://code.claude.com/docs/en/skills.md
