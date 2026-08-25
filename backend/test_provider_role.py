import pytest
from pydantic import ValidationError

from app.schemas import UserCreate


def test_provider_role_is_allowed():
    user = UserCreate(
        full_name='Dr Test',
        email='provider@example.com',
        password='StrongPass123!',
        role='provider',
        phone='1234567890',
    )
    assert user.role == 'provider'


def test_doctor_role_is_allowed():
    user = UserCreate(
        full_name='Dr Test',
        email='doctor@example.com',
        password='StrongPass123!',
        role='doctor',
        phone='1234567890',
    )
    assert user.role == 'doctor'
