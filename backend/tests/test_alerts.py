from datetime import date, timedelta
from app.utils.alerts import alert_for_date


TODAY = date(2026, 4, 17)


def test_none_returns_none():
    assert alert_for_date(None, TODAY) is None


def test_past_date_returns_expired():
    assert alert_for_date(TODAY - timedelta(days=1), TODAY) == "expired"


def test_today_returns_expires_in_0():
    assert alert_for_date(TODAY, TODAY) == "expires_in_0"


def test_within_window_returns_expires_in_n():
    assert alert_for_date(TODAY + timedelta(days=5), TODAY) == "expires_in_5"


def test_at_window_boundary_returns_expires_in_n():
    assert alert_for_date(TODAY + timedelta(days=30), TODAY, alert_days=30) == "expires_in_30"


def test_beyond_window_returns_none():
    assert alert_for_date(TODAY + timedelta(days=31), TODAY, alert_days=30) is None


def test_custom_alert_days():
    assert alert_for_date(TODAY + timedelta(days=10), TODAY, alert_days=7) is None
    assert alert_for_date(TODAY + timedelta(days=5), TODAY, alert_days=7) == "expires_in_5"
