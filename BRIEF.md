# BRIEF.md — pointer

This is a **monorepo root**. It holds several unrelated projects
(`aigency-film-festival`, `product-studio`, `roblox-vfx-forge`, `wayout-quest`,
and `wadeh-ai`). There is no single brief for all of them.

**wadehAI's brief is at [`wadeh-ai/BRIEF.md`](wadeh-ai/BRIEF.md).** That is the
one canonical copy — read it there, edit it nowhere else.

This pointer exists because a session was told "read BRIEF.md at the repo root",
found nothing here, and stalled. If you are that session: the file you want is
one directory down, alongside `wadeh-ai/CLAUDE.md`, `wadeh-ai/MAINTENANCE.md`
and `wadeh-ai/docs/`.

## Why the copy you may have seen on `wadehai-standalone` is not canonical

`wadehai-standalone` is a **generated deploy mirror** — the `wadeh-ai/` subtree
projected to repository root by `git subtree split --prefix=wadeh-ai`. Its root
`BRIEF.md` is therefore the same file as `wadeh-ai/BRIEF.md`, reproduced by the
split, not a second original.

**Editing BRIEF.md on `wadehai-standalone` will be silently destroyed** by the
next split. Edit `wadeh-ai/BRIEF.md` on
`claude/wadeh-ai-bilingual-platform-prfqm8` and let the mirror inherit it.
