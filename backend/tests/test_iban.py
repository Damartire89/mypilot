from app.api.v1.settings import _validate_iban


def test_valid_fr_iban():
    assert _validate_iban("FR7630006000011234567890189") is True


def test_valid_fr_iban_with_spaces():
    assert _validate_iban("FR76 3000 6000 0112 3456 7890 189") is True


def test_valid_fr_iban_lowercase():
    assert _validate_iban("fr7630006000011234567890189") is True


def test_invalid_checksum():
    assert _validate_iban("FR7630006000011234567890188") is False


def test_valid_de_iban():
    assert _validate_iban("DE89370400440532013000") is True


def test_too_short():
    assert _validate_iban("FR76") is False


def test_non_alphanumeric():
    assert _validate_iban("FR76!BADCHAR#12345") is False


def test_country_code_not_letters():
    assert _validate_iban("1230006000011234567890189") is False


def test_empty_string():
    assert _validate_iban("") is False
