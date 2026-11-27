#!/usr/bin/env python3
"""Build the Placement Roadmap seed from the roadmap doc's XML.

Usage:
  python3 -I seed/build_seed.py <doc.xml> <outdir> [existing.json]

<doc.xml>   the doc tab as read with the Claude Docs tools (payload {"kind":"view"}), the "xml" string saved to a file.
<outdir>    gets seed.json (every document: content fields + first-time progress defaults) and ops-*.json
            (db_write batches of at most 50 ops).
existing    optional {path: version} for documents already in the db. Those get a `merge` of CONTENT fields
            only (with ifVersion), so a re-run never touches Kyle's progress (status, doneAt, note, evidence...).

Doc wording is copied with ElementTree.itertext(): bold, italic and link markup are dropped, the words are not.
Nothing here is written to git: the output holds the doc's text and is ignored (roadmap/.gitignore).
"""
import json, re, sys, datetime as dt
import xml.etree.ElementTree as ET

SCHEMA_VERSION = 1
SEED_VERSION = 2
DOC = {"title": "AI Placement Roadmap: Week-by-Week Plan (Dec 2026 – Dec 2027)",
       "url": "https://claude.ai/artifact/SnyN66CpkWx9sqL2c1uTbg", "rev": 90}
PLAN_START = dt.date(2026, 11, 30)  # Week 1, a Monday (doc: "Week 1 (30 Nov – 6 Dec)")

# Phases come from the doc's routine table and month notes (summer break to 2 Mar, semester from 3 Mar,
# break routine after June exams, semester 2 from about 2 Aug, December "Summer stretch").
PHASES = [
    {"id": "summer-1", "name": "Summer break", "routine": "break", "weeks": [1, 13]},
    {"id": "sem-1", "name": "Semester 1", "routine": "semester", "weeks": [14, 28]},
    {"id": "midyear", "name": "Mid-year break", "routine": "break", "weeks": [29, 35]},
    {"id": "sem-2", "name": "Semester 2", "routine": "semester", "weeks": [36, 44], "months": ["2027-10", "2027-11"]},
    {"id": "summer-2", "name": "Summer stretch", "routine": "break", "months": ["2027-12"]},
]
HOURS = {"break": 14, "semester": 8}
MONTHS = {"December 2026": "2026-12", "January 2027": "2027-01", "February 2027": "2027-02", "March 2027": "2027-03",
          "April 2027": "2027-04", "May 2027": "2027-05", "June 2027": "2027-06", "July 2027": "2027-07",
          "August 2027": "2027-08", "September 2027": "2027-09"}
BLOCK = {"October": "2027-10", "November": "2027-11", "December": "2027-12"}

# Project stages: tasks that build each project. "Project 1"/"Project 2" in the text, plus two tasks that
# belong to a project by their week (Week 24 "Write it up" is Project 1's README; Week 34 builds Project 2's core).
EXTRA_PROJECT = {("w24", 1): "p1", ("w34", 2): "p2"}
NOT_A_STAGE = re.compile(r"^(Do a mock interview|Resume v1)")

# Skills: the doc has no skills list, so each skill is named from the doc's own tasks and keeps the weeks
# that teach it. Kyle approved deriving them (2026-11-26). Edit freely: re-runs only touch name/group/weeks.
SKILLS = {
    "programming": ("Programming", [
        ("py-collections", "Lists, dicts and sets: mutability, references, time cost", [2]),
        ("py-reading", "Reading other people's Python and explaining it", [2]),
        ("py-decorators", "Decorators", [3]), ("py-generators", "Generators", [3]),
        ("py-context", "Context managers", [3]), ("py-types", "Type hints", [3]), ("py-async", "async/await", [3]),
        ("py-noai", "Writing a 150-line program with no AI", [5])]),
    "dsa": ("DSA", [
        ("big-o", "Big O", [2]), ("arrays", "Arrays", [2, 7]), ("hash-maps", "Hash maps", [3, 7]),
        ("two-pointers", "Two pointers", [6]), ("sliding-window", "Sliding window", [8]), ("stacks", "Stacks", [10]),
        ("binary-search", "Binary search", [12]), ("linked-lists", "Linked lists", [16]), ("trees", "Trees", [20, 30]),
        ("graphs", "Graphs (BFS/DFS)", [32]), ("heaps", "Heaps", [34])]),
    "maths": ("Maths", [
        ("vectors", "Vectors", [4, 6]), ("matrix-mult", "Matrix multiplication", [6]),
        ("mean-variance", "Mean and variance", [8]), ("distributions", "Distributions and the normal distribution", [8]),
        ("bayes", "Bayes' rule", [8]), ("derivatives", "Derivatives", [9]), ("gradient-descent", "Gradient descent", [9, 11])]),
    "data": ("Data", [
        ("numpy", "NumPy: arrays, indexing, vector maths", [6]), ("pandas", "pandas: load, clean and group a dataset", [7]),
        ("matplotlib", "matplotlib charts", [7])]),
    "ml": ("Machine learning", [
        ("linear-regression", "Linear regression", [10]), ("multiple-regression", "Multiple regression", [11]),
        ("logistic-regression", "Logistic regression", [12]), ("overfitting", "Overfitting", [12]),
        ("neural-networks", "Neural networks", [15]), ("training-nn", "Training neural networks", [16]),
        ("applying-ml", "Advice for applying ML", [17]), ("decision-trees", "Decision trees", [19]),
        ("clustering", "Clustering", [25]), ("recommenders", "Recommender systems", [30]),
        ("pytorch", "PyTorch: tensors and training a classifier", [32])]),
    "ai": ("AI engineering", [
        ("tokens", "Tokens and context windows", [11]), ("temperature", "Temperature", [11]),
        ("hallucination", "Why models make things up", [11]), ("embeddings", "Embeddings and cosine similarity", [15]),
        ("vector-db", "Chunking and a vector database (Chroma)", [16]), ("rag", "RAG: retrieve, prompt, cite the source", [17]),
        ("evals", "Test sets: accuracy and refusals", [20, 35]), ("tool-calling", "How tool calling works", [33]),
        ("agent-loop", "An agent loop that handles tool failures", [33]),
        ("legal-retrieval", "Retrieval over legislation by section and amendment date", [34])]),
    "build": ("Build and deploy", [
        ("fastapi", "FastAPI request flow", [12]), ("llm-endpoint", "A hand-written LLM endpoint", [13]),
        ("sql", "Chat history in SQL", [19]), ("docker", "Docker and the Dockerfile", [21, 38]),
        ("aws", "Deploying to AWS (free tier, billing alert)", [23, 38]), ("readme", "README write-up and demo", [24, 39]),
        ("external-api", "Using the Federal Register API", [34]), ("logging", "Logging", [35]),
        ("auth-audit", "Accounts, permissions and audit logs", [37])]),
    "career": ("Career", [
        ("placement-reg", "Placement registration", [1, 36]), ("resume", "Resume", [21, 31, 41]),
        ("star", "STAR stories", [39]), ("employers", "Talking to employers", [40]),
        ("applications", "Tailored applications and cover letters", [42]),
        ("mock-interviews", "Mock interviews", [43, 44]), ("explain-project", "Explaining a project in 2 minutes", [43])]),
}

CONTENT_FIELDS = {  # the only fields a seed re-run may change
    "meta": ["schemaVersion", "seedVersion", "sourceDoc", "timezone", "weekStart", "planStart", "contentFields", "claudeGuide", "collections"],
    "profile": ["goals", "routineTable", "workDays", "rules", "phases", "hoursPlan", "uniTarget", "flagships"],
    "months": ["order", "heading", "name", "theme", "goal", "block", "phase", "routine", "dsaTarget", "dsaApprox", "ifNoOffer", "weekIds"],
    "weeks": ["number", "order", "heading", "title", "dates", "start", "end", "monthId", "phase", "routine", "hoursTarget"],
    "tasks": ["text", "weekId", "monthId", "order", "project", "dsa"],
    "checkpoints": ["text", "monthId", "order", "dsaTarget", "dsaApprox"],
    "projects": ["title", "heading", "from", "name", "intro", "fields", "metrics", "order"],
    "guardrails": ["label", "text", "sources", "order"],
    "skills": ["group", "groupName", "groupOrder", "name", "weekIds", "order"],
}

GUIDE = """Placement Roadmap data (schemaVersion 1). Times are Australia/Melbourne; weeks start Monday.
READ: profile/kyle (goals, phases, hours plan, 70% uni target, the doc's rules). Current week = the weeks doc with start <= today <= end (before 2026-11-30 it is w01; from 2027-10-04 use the months doc for today's month, whose tasks have weekId null). Its tasks: tasks where weekId == <week id>, ordered by order. Progress: tasks.status ('todo'|'done') with doneAt (YYYY-MM-DD); checkpoints.status per month; logs (kind 'hours' with date, hours, dsa; kind 'mark' with unit, assessment, mark); metrics (project, metric, value, date); skills.status ('not-started'|'learning'|'can-explain'|'proven'). Latest report: reports ordered by generatedAt desc, limit 1 (field text is the plain-text report).
WRITE (as Claude): set by:'claude' and updatedAt (ISO 8601 with offset) on the doc you change, then add one activity doc {at, by:'claude', action, path, summary}. Examples: tick a task = update tasks/<id> {status:'done', doneAt, by, updatedAt}; untick = {status:'todo', doneAt:null}. Never edit doc-wording fields (meta.contentFields): only the seed re-run changes them, and it never changes progress fields."""


def text(el):
    return re.sub(r"\s+", " ", "".join(el.itertext())).strip()


def parse(xml):
    root = ET.fromstring(xml)
    out = []  # (kind, level, text, element)

    def walk(el):
        for c in el:
            if c.tag == "paragraph":
                h = c.get("heading")
                out.append(("h" if h else "p", int(h) if h else 0, text(c), c))
            elif c.tag == "list":
                for li in c:
                    ps = [p for p in li if p.tag == "paragraph"]
                    if ps:
                        out.append(("li" if c.get("kind") != "check" else "task", 0, text(ps[0]), ps[0]))
            elif c.tag == "table":
                out.append(("table", 0, "", c))
    walk(root)
    return out


def phase_for_week(n):
    for p in PHASES:
        if "weeks" in p and p["weeks"][0] <= n <= p["weeks"][1]:
            return p
    raise ValueError(n)


def phase_for_month(mid):
    for p in PHASES:
        if mid in p.get("months", []):
            return p
    return None


def build(xml):
    items = parse(xml)
    docs = {}
    put = lambda path, content, progress=None: docs.__setitem__(path, {"content": content, "progress": progress or {}})

    # Intro: goals, routine table, rules
    intro = next(t for k, _, t, _ in items if k == "p" and t.startswith("Long-term goal:"))
    m = re.match(r"Long-term goal: (.+?\.) This plan covers the first step: (.+)$", intro)
    goals = {"longTerm": m.group(1), "placement2028": m.group(2), "sentence": intro}
    table = next(e for k, _, _, e in items if k == "table")
    rows = [[text(cell) for cell in r] for r in table]
    routine = [dict(zip(["period", "mon", "tue", "thu", "sat", "sun", "total"], r)) for r in rows[1:]]
    work = next(t for k, _, t, _ in items if k == "p" and t.startswith("Wed, Fri"))
    i_rules = next(i for i, (k, _, t, _) in enumerate(items) if k == "p" and t == "Rules:")
    rules = []
    for k, _, t, _ in items[i_rules + 1:]:
        if k != "li":
            break
        rules.append(t)

    # Flagships and guardrails
    i_fl = next(i for i, (k, l, t, _) in enumerate(items) if k == "h" and t == "The two flagships")
    flag_intro = items[i_fl + 1][2]
    projects, cur = {}, None
    for k, l, t, e in items[i_fl + 2:]:
        if k == "h":
            break
        if k == "p" and t.startswith("Project "):
            pid = "p" + t[8]
            mm = re.match(r"(Project \d) \(from (.+?)\): (.+)$", t)
            cur = projects[pid] = {"title": mm.group(1), "heading": t, "from": mm.group(2), "name": mm.group(3), "fields": []}
        elif k == "li" and cur is not None:
            label, _, rest = t.partition(": ")
            cur["fields"].append({"label": label, "text": rest})
    i_gr = next(i for i, (k, l, t, _) in enumerate(items) if k == "h" and t.startswith("Legal guardrails"))
    gi = 0
    for k, l, t, e in items[i_gr + 1:]:
        if k != "li":
            break
        gi += 1
        label, _, rest = t.partition(": ")
        srcs = [{"text": text(a), "url": a.get("href")} for a in e.iter("link") if (a.get("href") or "").startswith("https://")]
        put(f"guardrails/g{gi}", {"label": label, "text": rest, "sources": srcs, "order": gi},
            {"checks": {"p1": {"done": False}, "p2": {"done": False}}, "by": None, "updatedAt": None})

    # Months, weeks, tasks, checkpoints
    month = week = None
    morder = 0
    block_heading = block_goal = None
    checkpoints = {}
    for idx, (k, l, t, e) in enumerate(items):
        if k == "h" and l == 2:
            name = t.split(":")[0]
            if name in MONTHS:
                morder += 1
                mid = MONTHS[name]
                month = {"id": mid, "order": morder, "heading": t, "name": name, "theme": t.split(": ", 1)[1], "weekIds": []}
                docs[f"months/{mid}"] = {"content": month, "progress": {}}
                week = None
            elif t.startswith("October – December 2027"):
                block_heading = t
                month = week = None
            else:
                month = week = None
        elif k == "p" and t.startswith("Month goal: ") and month:
            month["goal"] = t[len("Month goal: "):]
        elif k == "p" and t.startswith("Goal: ") and block_heading:
            block_goal = t[len("Goal: "):]
        elif k == "h" and l == 3:
            mw = re.match(r"Week (\d+) \((.+?)\): (.+)$", t)
            mb = re.match(r"(October|November|December): (.+)$", t)
            if mw and month:
                n = int(mw.group(1))
                start = PLAN_START + dt.timedelta(days=7 * (n - 1))
                ph = phase_for_week(n)
                wid = f"w{n:02d}"
                week = {"id": wid, "number": n, "order": n, "heading": t, "title": mw.group(3), "dates": mw.group(2),
                        "start": start.isoformat(), "end": (start + dt.timedelta(days=6)).isoformat(), "monthId": month["id"],
                        "phase": ph["id"], "routine": ph["routine"], "hoursTarget": HOURS[ph["routine"]], "tasks": 0}
                docs[f"weeks/{wid}"] = {"content": week, "progress": {"note": "", "noteBy": None, "noteAt": None}}
                month["weekIds"].append(wid)
            elif mb and block_heading:
                mid = BLOCK[mb.group(1)]
                ph = phase_for_month(mid)
                morder += 1
                month = {"id": mid, "order": morder, "heading": t, "name": f"{mb.group(1)} 2027", "theme": mb.group(2),
                         "block": {"heading": block_heading, "goal": block_goal}, "weekIds": [],
                         "phase": ph["id"], "routine": ph["routine"], "tasks": 0}
                docs[f"months/{mid}"] = {"content": month, "progress": {}}
                week = None
        elif k == "task":
            owner = week or month
            owner["tasks"] = owner.get("tasks", 0) + 1
            n = owner["tasks"]
            tid = f"{week['id']}-{n}" if week else f"m{month['id']}-{n}"
            proj = "p1" if "Project 1" in t else "p2" if "Project 2" in t else None
            if week and (week["id"], n) in EXTRA_PROJECT:
                proj = EXTRA_PROJECT[(week["id"], n)]
            if NOT_A_STAGE.match(t):
                proj = None
            dsa = None
            md = re.match(r"DSA: .*?(\d+) [A-Za-z\- ]*?problems?", t)
            if md:
                dsa = int(md.group(1))
            put(f"tasks/{tid}", {"text": t, "weekId": week["id"] if week else None, "monthId": month["id"],
                                 "order": n, "project": proj, "dsa": dsa},
                {"status": "todo", "doneAt": None, "by": None, "updatedAt": None})
        elif k == "p" and t.startswith("Checkpoint: ") and month:
            ct = t[len("Checkpoint: "):]
            md = re.search(r"(about )?(\d+) DSA problems", ct, re.I)
            month["dsaTarget"] = int(md.group(2))
            month["dsaApprox"] = bool(md.group(1))
            checkpoints[month["id"]] = 1
            put(f"checkpoints/{month['id']}", {"text": ct, "monthId": month["id"], "order": month["order"],
                                                "dsaTarget": month["dsaTarget"], "dsaApprox": month["dsaApprox"]},
                {"status": "todo", "doneAt": None, "by": None, "updatedAt": None})
        elif k == "p" and t.startswith("If you don't get an offer: "):
            docs["months/2027-12"]["content"]["ifNoOffer"] = t[len("If you don't get an offer: "):]

    # Month phase = phase of its first week (Dec 2026 to Sep 2027)
    for path, d in docs.items():
        c = d["content"]
        if path.startswith("months/") and "phase" not in c:
            w = docs[f"weeks/{c['weekIds'][0]}"]["content"]
            c["phase"], c["routine"] = w["phase"], w["routine"]
        c.pop("id", None)
        c.pop("tasks", None)

    # Projects
    doc_text = " ".join(t for _, _, t, _ in items)
    metric_defs = {
        "p1": [("accuracy", "Test accuracy", "%", "85%+ by May 2027 and 90%+ by the end of 2027"),
               ("refusal", "Refusal rate", "%", "95%+ of the questions it shouldn't answer"),
               ("vi-match", "Vietnamese answers match the English source", "%", "90%+"),
               ("questions", "Test questions", "", "100 real questions in both languages with checked answers"),
               ("users", "Users", "", "10–20 student testers by May 2027 and 100+ users by the end of 2027")],
        "p2": [("accuracy", "Retrieval accuracy", "%", "the right section in the top 5 results for 80%+ of the test questions"),
               ("refusal", "Refusal rate", "%", "95%+ of the questions it shouldn't answer"),
               ("questions", "Test questions", "", "50 test questions checked against the Acts"), ("users", "Users", "", None)],
    }
    for o, (pid, p) in enumerate(sorted(projects.items()), 1):
        p["order"] = o
        p["intro"] = flag_intro
        p["metrics"] = [{"key": a, "label": b, "unit": u, "target": tg} for a, b, u, tg in metric_defs[pid]]
        for m in p["metrics"]:  # targets are copied from the doc's wording, never retyped
            assert m["target"] is None or m["target"] in doc_text, (pid, m["key"], "target not in the doc")
        put(f"projects/{pid}", p, {})

    # Skills
    order = 0
    for gi, (gid, (gname, skills)) in enumerate(SKILLS.items(), 1):
        for sid, name, weeks in skills:
            order += 1
            put(f"skills/{sid}", {"group": gid, "groupName": gname, "groupOrder": gi, "name": name,
                                  "weekIds": [f"w{w:02d}" for w in weeks], "order": order},
                {"status": "not-started", "statusDate": None, "evidence": {"url": "", "note": ""}, "by": None, "updatedAt": None})

    put("profile/kyle", {"goals": goals, "routineTable": routine, "workDays": work, "rules": rules,
                         "phases": PHASES, "hoursPlan": HOURS, "uniTarget": 70, "flagships": flag_intro}, {})
    put("meta/app", {"schemaVersion": SCHEMA_VERSION, "seedVersion": SEED_VERSION, "sourceDoc": DOC,
                     "timezone": "Australia/Melbourne", "weekStart": "monday", "planStart": PLAN_START.isoformat(),
                     "contentFields": CONTENT_FIELDS, "claudeGuide": GUIDE,
                     "collections": ["meta", "profile", "months", "weeks", "tasks", "checkpoints", "projects", "guardrails",
                                     "skills", "metrics", "logs", "reports", "activity"]},
        {"seededAt": None})
    return docs


def ops(docs, existing, now):
    out = []
    for path in sorted(docs, key=lambda p: (p.split("/")[0] != "meta", p)):
        d = docs[path]
        col = path.split("/")[0]
        content = {k: v for k, v in d["content"].items() if k in CONTENT_FIELDS[col]}
        if path in existing:
            out.append({"op": "merge", "path": path, "ifVersion": existing[path],
                        "data": {**content, "seedUpdatedAt": now}})
        else:
            data = {**content, **d["progress"], "seedUpdatedAt": now}
            if path == "meta/app":
                data["seededAt"] = now
            out.append({"op": "set", "path": path, "data": data})
    return out


if __name__ == "__main__":
    xml = open(sys.argv[1]).read()
    outdir = sys.argv[2]
    existing = json.load(open(sys.argv[3])) if len(sys.argv) > 3 else {}
    docs = build(xml)
    for path, d in docs.items():  # every content field must be declared, so re-runs keep it in sync
        extra = set(d["content"]) - set(CONTENT_FIELDS[path.split("/")[0]])
        assert not extra, (path, extra)
    now = dt.datetime.now(dt.timezone(dt.timedelta(hours=11))).isoformat(timespec="seconds")
    json.dump(docs, open(f"{outdir}/seed.json", "w"), ensure_ascii=False, indent=1)
    allops = ops(docs, existing, now)
    for i in range(0, len(allops), 50):
        json.dump(allops[i:i + 50], open(f"{outdir}/ops-{i // 50 + 1}.json", "w"), ensure_ascii=False, separators=(",", ":"))
    counts = {}
    for p in docs:
        counts[p.split("/")[0]] = counts.get(p.split("/")[0], 0) + 1
    print(json.dumps(counts), "ops:", len(allops), "batches:", (len(allops) + 49) // 50)
