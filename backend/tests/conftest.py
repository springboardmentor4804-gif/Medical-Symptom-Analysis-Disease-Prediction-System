import os
import sys
import tempfile

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("SECRET_KEY", "test-secret-key")


@pytest.fixture()
def client():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["DATABASE_URL"] = f"sqlite:///{path}"
    os.environ["BOOTSTRAP_ADMIN_EMAIL"] = "admin@example.com"
    os.environ["BOOTSTRAP_ADMIN_PASSWORD"] = "adminpass123"

    # Reload modules that cache settings/engine at import time so the test DB takes effect.
    # EVERY module that binds `database` (or anything derived from it) at
    # import time must be dropped here, or it keeps a SQLAlchemy engine
    # pointing at a previous test's deleted temp file and every query fails
    # with "no such table: users". routers.prescription_routes was missing
    # from this list and only surfaced once it started querying the ORM.
    for mod in ["config", "database", "auth", "services", "rate_limit",
                "report_builder", "roles",
                # services.analytics binds `database` at import time, and
                # dropping the "services" package alone leaves the already
                # imported submodule in sys.modules holding a stale engine.
                "services.analytics",
                "routers.auth_routes", "routers.report_routes",
                "routers.patient_routes", "routers.admin_routes",
                "routers.prescription_routes", "routers.analytics_routes",
                "main"]:
        sys.modules.pop(mod, None)

    from fastapi.testclient import TestClient
    import main as main_module
    import database as database_module

    with TestClient(main_module.app) as c:
        yield c

    database_module.engine.dispose()
    os.remove(path)
