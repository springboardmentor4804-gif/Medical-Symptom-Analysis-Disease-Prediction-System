import secrets
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = secrets.token_hex(32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day

    database_url: str = "sqlite:///./medassist.db"

    cors_origins: str = "http://localhost:8501,http://127.0.0.1:8501,http://localhost:5173,http://127.0.0.1:5173"

    login_rate_limit_attempts: int = 10
    login_rate_limit_window_seconds: int = 60

    # If both are set and no admin user exists yet, one is created on startup.
    bootstrap_admin_email: Optional[str] = None
    bootstrap_admin_password: Optional[str] = None

    # Whether the treatment panel may show drugs belonging to a LOWER-ranked
    # condition when the top prediction has no treatment data.
    #
    # Off by default, deliberately. Borrowing across the differential raises
    # the fill rate but the drugs then belong to a different disease: a
    # suspected ileus was being shown mesalamine and infliximab, which are IBD
    # immunosuppressants, because ulcerative colitis sat at #2 with 15%
    # confidence. The label said so, but a wrong-class drug beside a diagnosis
    # is a clinical hazard however it is captioned.
    #
    # Set TREATMENT_ALLOW_ALTERNATES=true to restore the previous behaviour.
    treatment_allow_alternates: bool = False

    # When alternates ARE allowed, how close a lower-ranked condition must be
    # to the top prediction before its drugs may be shown, as a fraction of
    # the top prediction's probability.
    #
    # 1.0 blocks everything; 0.0 restores "first hit anywhere in the top 5".
    # The point of a middle value is that borrowing is defensible when the
    # model is genuinely torn between two near-equal candidates, and is not
    # defensible when it is 37.7% vs 15% - which is the ileus/ulcerative
    # colitis case that showed IBD drugs for a bowel obstruction.
    treatment_alternate_min_ratio: float = 0.8

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
