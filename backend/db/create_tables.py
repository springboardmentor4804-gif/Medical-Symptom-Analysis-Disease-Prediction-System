"""Create any missing tables from SQLAlchemy models (development helper).
"""
import os
import sys
HERE = os.path.dirname(os.path.dirname(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

from app.models import Base
from db.connection import engine


def create_all():
    print('Creating tables from SQLAlchemy models...')
    Base.metadata.create_all(bind=engine)
    print('Done')


if __name__ == '__main__':
    create_all()
