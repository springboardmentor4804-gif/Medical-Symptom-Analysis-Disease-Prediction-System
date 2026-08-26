"""
Read-only schema comparison: existing PostgreSQL database vs this project's models.

Answers one question - can the new project safely share a database that already
holds another project's tables?

    python inspect_postgres_schema.py --url postgresql+psycopg2://user:pass@localhost:5432/medassist

STRICTLY READ-ONLY. It issues SELECTs against the system catalogues and nothing
else: no CREATE, no ALTER, no create_all(). Safe to point at production data.

The interesting cases are not "which tables are missing" - create_all() would
add those. They are:

  COLLISIONS   a table name this project owns that already exists with a
               different shape. This is the dangerous case: the ORM would map
               onto someone else's table and read the wrong columns.
  TYPE DRIFT   same table, same column, incompatible type.
  MISSING FK   the existing table lacks a foreign key this project relies on.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from sqlalchemy import create_engine, inspect                        # noqa: E402
from sqlalchemy.exc import SQLAlchemyError                           # noqa: E402

from database import Base                                            # noqa: E402


def _model_schema() -> dict:
    """What this project's models declare, from SQLAlchemy metadata."""
    out = {}
    for table in Base.metadata.sorted_tables:
        out[table.name] = {
            "columns": {
                c.name: {
                    "type": str(c.type),
                    "nullable": c.nullable,
                    "primary_key": c.primary_key,
                    "unique": bool(c.unique),
                }
                for c in table.columns
            },
            "foreign_keys": sorted(
                f"{fk.parent.name} -> {fk.column.table.name}.{fk.column.name}"
                for fk in table.foreign_keys
            ),
        }
    return out


def _live_schema(engine) -> dict:
    """What the database actually contains."""
    insp = inspect(engine)
    out = {}
    for name in sorted(insp.get_table_names()):
        pk = set((insp.get_pk_constraint(name) or {}).get(
            "constrained_columns") or [])
        uniques = set()
        for uc in insp.get_unique_constraints(name) or []:
            uniques.update(uc.get("column_names") or [])
        out[name] = {
            "columns": {
                c["name"]: {
                    "type": str(c["type"]),
                    "nullable": c["nullable"],
                    "primary_key": c["name"] in pk,
                    "unique": c["name"] in uniques,
                }
                for c in insp.get_columns(name)
            },
            "foreign_keys": sorted(
                f"{col} -> {fk['referred_table']}.{ref}"
                for fk in (insp.get_foreign_keys(name) or [])
                for col, ref in zip(fk.get("constrained_columns") or [],
                                    fk.get("referred_columns") or [])
            ),
            "row_count": None,
        }
    return out


def _row_counts(engine, tables) -> dict:
    """Row counts, so 'has data' is a fact rather than an assumption."""
    from sqlalchemy import text
    counts = {}
    with engine.connect() as conn:
        for name in tables:
            try:
                counts[name] = conn.execute(
                    text(f'SELECT COUNT(*) FROM "{name}"')).scalar()
            except SQLAlchemyError:
                counts[name] = None
    return counts


# Types that mean the same thing across the two dialects. A SQLite-authored
# model says VARCHAR where Postgres reports VARCHAR too, but JSON/JSONB and the
# integer widths need an explicit allowance.
COMPATIBLE = [
    {"VARCHAR", "TEXT", "CHARACTER VARYING"},
    {"INTEGER", "BIGINT", "SMALLINT", "SERIAL", "BIGSERIAL"},
    {"JSON", "JSONB"},
    {"DATETIME", "TIMESTAMP", "TIMESTAMP WITHOUT TIME ZONE",
     "TIMESTAMP WITH TIME ZONE"},
    {"BOOLEAN", "BOOL"},
    {"FLOAT", "DOUBLE PRECISION", "REAL", "NUMERIC"},
]


def _types_compatible(a: str, b: str) -> bool:
    a_u, b_u = a.upper().split("(")[0].strip(), b.upper().split("(")[0].strip()
    if a_u == b_u:
        return True
    return any(a_u in group and b_u in group for group in COMPATIBLE)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--url", help="PostgreSQL URL (overrides DATABASE_URL)")
    args = parser.parse_args()

    url = args.url
    if not url:
        from config import settings
        url = settings.database_url
    if url.startswith("sqlite"):
        sys.exit("Pass a PostgreSQL URL with --url; DATABASE_URL is SQLite.")

    safe = url.split("@")[-1]
    print("=" * 68)
    print("Read-only schema comparison")
    print("=" * 68)
    print(f"target: {safe}\n")

    try:
        engine = create_engine(url)
        live = _live_schema(engine)
    except SQLAlchemyError as e:
        print(f"Could not connect or read the schema:\n  {type(e).__name__}: {e}")
        return 1

    counts = _row_counts(engine, live.keys())
    for name in live:
        live[name]["row_count"] = counts.get(name)

    model = _model_schema()
    ours, theirs = set(model), set(live)

    # ---- inventory --------------------------------------------------------
    print(f"EXISTING DATABASE: {len(theirs)} table(s)")
    for name in sorted(theirs):
        n = live[name]["row_count"]
        marker = "  <-- this project owns this name" if name in ours else ""
        print(f"  {name:28} {str(n) + ' rows' if n is not None else '?':>12}{marker}")

    print(f"\nTHIS PROJECT DECLARES: {len(ours)} table(s)")
    for name in sorted(ours):
        print(f"  {name:28} {'EXISTS' if name in theirs else 'would be created'}")

    # ---- the safe part ----------------------------------------------------
    only_theirs = sorted(theirs - ours)
    only_ours = sorted(ours - theirs)
    shared = sorted(ours & theirs)

    print(f"\n{'-' * 68}\nUNRELATED TABLES (previous project, untouched): "
          f"{len(only_theirs)}")
    for name in only_theirs:
        print(f"  {name}")
    print("  (none)" if not only_theirs else
          "\n  These share no name with anything this project maps, so the ORM\n"
          "  never reads or writes them. create_all() leaves them alone.")

    print(f"\nWOULD BE CREATED: {len(only_ours)}")
    for name in only_ours:
        print(f"  {name}")
    print("  (none)" if not only_ours else "")

    # ---- the dangerous part ----------------------------------------------
    print(f"\n{'=' * 68}\nNAME COLLISIONS: {len(shared)}")
    if not shared:
        print("  None. No existing table shares a name with this project's\n"
              "  models, so nothing can be silently mis-mapped.")
    problems = 0
    for name in shared:
        m_cols = model[name]["columns"]
        l_cols = live[name]["columns"]
        missing = sorted(set(m_cols) - set(l_cols))
        extra = sorted(set(l_cols) - set(m_cols))
        drift = [
            (c, m_cols[c]["type"], l_cols[c]["type"])
            for c in sorted(set(m_cols) & set(l_cols))
            if not _types_compatible(m_cols[c]["type"], l_cols[c]["type"])
        ]
        null_drift = [
            (c, m_cols[c]["nullable"], l_cols[c]["nullable"])
            for c in sorted(set(m_cols) & set(l_cols))
            if m_cols[c]["nullable"] is False and l_cols[c]["nullable"] is True
        ]
        fk_missing = sorted(set(model[name]["foreign_keys"])
                            - set(live[name]["foreign_keys"]))

        clean = not (missing or drift or null_drift or fk_missing)
        print(f"\n  {name}  ({live[name]['row_count']} existing rows)"
              f"{'  [compatible]' if clean else '  [NEEDS ATTENTION]'}")
        if missing:
            problems += 1
            print("    columns this project needs but the table lacks:")
            for c in missing:
                print(f"      - {c}  ({m_cols[c]['type']}, "
                      f"{'NULL ok' if m_cols[c]['nullable'] else 'NOT NULL'})")
        if drift:
            problems += 1
            print("    type mismatches:")
            for c, want, got in drift:
                print(f"      - {c}: project wants {want}, database has {got}")
        if null_drift:
            print("    nullability: project expects NOT NULL, database allows NULL:")
            for c, _, _ in null_drift:
                print(f"      - {c}")
        if fk_missing:
            print("    foreign keys the project expects but the table lacks:")
            for fk in fk_missing:
                print(f"      - {fk}")
        if extra:
            print(f"    extra columns the ORM will ignore: {', '.join(extra)}")

    # ---- verdict ---------------------------------------------------------
    print(f"\n{'=' * 68}\nVERDICT")
    if not shared:
        print("  SAFE to share this database. No table-name overlap, so the new\n"
              "  project's create_all() adds its own tables beside the existing\n"
              "  ones without reading or altering them.")
    elif problems:
        print("  DO NOT point the app at this database yet. The collisions above\n"
              "  mean the ORM would map onto an existing table with the wrong\n"
              "  shape - reads would fail or return the wrong columns, and\n"
              "  create_all() will NOT fix it (it never alters existing tables).")
    else:
        print("  Shared table names exist but their shapes are compatible.\n"
              "  Review the row counts above: the app would treat that existing\n"
              "  data as its own.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
