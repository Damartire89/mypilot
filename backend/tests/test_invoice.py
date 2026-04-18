"""Tests pour le helper format_invoice_reference."""
from app.utils.invoice import format_invoice_reference


def test_format_default_prefix_none():
    assert format_invoice_reference(None, 2026, 1) == "C-2026-0001"


def test_format_default_prefix_empty():
    assert format_invoice_reference("", 2026, 1) == "C-2026-0001"


def test_format_default_prefix_whitespace():
    assert format_invoice_reference("   ", 2026, 1) == "C-2026-0001"


def test_format_custom_prefix():
    assert format_invoice_reference("FA", 2026, 42) == "FA-2026-0042"


def test_format_prefix_trimmed():
    assert format_invoice_reference("  INV  ", 2026, 7) == "INV-2026-0007"


def test_format_zero_padding_4_digits():
    assert format_invoice_reference("C", 2026, 7) == "C-2026-0007"
    assert format_invoice_reference("C", 2026, 99) == "C-2026-0099"
    assert format_invoice_reference("C", 2026, 999) == "C-2026-0999"


def test_format_large_number_no_truncation():
    assert format_invoice_reference("C", 2026, 12345) == "C-2026-12345"


def test_format_number_min_clamped_to_1():
    assert format_invoice_reference("C", 2026, 0) == "C-2026-0001"
    assert format_invoice_reference("C", 2026, -5) == "C-2026-0001"


def test_format_year_is_not_padded():
    assert format_invoice_reference("C", 2000, 1) == "C-2000-0001"


def test_format_different_years():
    assert format_invoice_reference("FA", 2025, 1) == "FA-2025-0001"
    assert format_invoice_reference("FA", 2026, 1) == "FA-2026-0001"
