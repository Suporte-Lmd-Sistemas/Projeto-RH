from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timedelta


@dataclass
class DateRange:
    start: date
    end: date


class BaseDashboardService:
    def _resolve_period(
        self,
        period: str,
        start: str | None,
        end: str | None,
    ) -> DateRange:
        today = date.today()

        if period == "today":
            return DateRange(start=today, end=today)

        if period == "yesterday":
            previous_day = today - timedelta(days=1)
            return DateRange(start=previous_day, end=previous_day)

        if period == "week":
            week_start = today - timedelta(days=today.weekday())
            return DateRange(start=week_start, end=today)

        if period == "month":
            month_start = today.replace(day=1)
            return DateRange(start=month_start, end=today)

        if period == "previousMonth":
            first_day_current_month = today.replace(day=1)
            last_day_previous_month = first_day_current_month - timedelta(days=1)
            first_day_previous_month = last_day_previous_month.replace(day=1)
            return DateRange(start=first_day_previous_month, end=last_day_previous_month)

        if period == "year":
            year_start = today.replace(month=1, day=1)
            return DateRange(start=year_start, end=today)

        if period == "custom" and start and end:
            return DateRange(
                start=datetime.strptime(start, "%Y-%m-%d").date(),
                end=datetime.strptime(end, "%Y-%m-%d").date(),
            )

        month_start = today.replace(day=1)
        return DateRange(start=month_start, end=today)

    def _previous_period(self, date_range: DateRange) -> DateRange:
        total_days = (date_range.end - date_range.start).days + 1
        previous_end = date_range.start - timedelta(days=1)
        previous_start = previous_end - timedelta(days=total_days - 1)
        return DateRange(start=previous_start, end=previous_end)

    def _format_variation(self, current_value: float, previous_value: float) -> str:
        if previous_value <= 0:
            return "Sem base anterior"

        variation = ((current_value - previous_value) / previous_value) * 100
        prefix = "+" if variation >= 0 else ""
        value = f"{variation:.1f}".replace(".", ",")
        return f"{prefix}{value}% frente ao periodo anterior"