from __future__ import annotations

from typing import ClassVar

from arq import cron
from arq.connections import RedisSettings

from backend.config import get_backend_settings
from backend.workers.jobs import run_analysis_job, run_cross_review
from backend.workers.runtime_identity import refresh_worker_identity


def redis_settings() -> RedisSettings:
    settings = get_backend_settings()
    return RedisSettings.from_dsn(settings.redis_url)


class WorkerSettings:
    functions: ClassVar = [run_analysis_job, run_cross_review]
    on_startup = refresh_worker_identity
    cron_jobs: ClassVar = [
        cron(
            refresh_worker_identity,
            second={0, 10, 20, 30, 40, 50},
            run_at_startup=False,
        )
    ]
    redis_settings = redis_settings()
    max_jobs: int = 1
    job_timeout: int = 600  # 10 分钟，防止 GPT 慢时被 ARQ 直接杀掉


__all__ = ["WorkerSettings"]
