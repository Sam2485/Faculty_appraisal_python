import pytest
from src.api.v1.remarks import _extract_numeric_score


def test_plain_int():
    assert _extract_numeric_score(45, "hod") == 45.0


def test_plain_float():
    assert _extract_numeric_score(3.5, "hod") == 3.5


def test_numeric_string():
    assert _extract_numeric_score("42", "hod") == 42.0


def test_invalid_string_returns_zero():
    assert _extract_numeric_score("not-a-number", "hod") == 0.0


def test_empty_string_returns_zero():
    assert _extract_numeric_score("", "hod") == 0.0


def test_none_returns_zero():
    assert _extract_numeric_score(None, "hod") == 0.0


def test_dict_with_role_key():
    assert _extract_numeric_score({"hod": "43", "score": "10"}, "hod") == 43.0


def test_dict_zero_role_key_falls_back_to_score():
    # 0 is falsy, so the `or` chain falls through to score
    assert _extract_numeric_score({"hod": 0, "score": "99"}, "hod") == 99.0


def test_dict_with_score_fallback():
    assert _extract_numeric_score({"score": "15"}, "hod") == 15.0


def test_dict_missing_all_keys_returns_zero():
    assert _extract_numeric_score({"other_key": "10"}, "hod") == 0.0


def test_dict_with_director_role():
    assert _extract_numeric_score({"director": "28"}, "director") == 28.0


def test_list_of_dicts_sums_role_key():
    raw = [{"hod": "10"}, {"hod": "5"}, {"hod": "3"}]
    assert _extract_numeric_score(raw, "hod") == 18.0


def test_list_of_dicts_skips_non_numeric():
    raw = [{"hod": "10"}, {"hod": "bad"}, {"hod": "5"}]
    assert _extract_numeric_score(raw, "hod") == 15.0


def test_list_falls_back_to_score_key():
    raw = [{"score": "12"}, {"score": "8"}]
    assert _extract_numeric_score(raw, "hod") == 20.0


def test_empty_list_returns_zero():
    assert _extract_numeric_score([], "hod") == 0.0


def test_list_with_non_dict_items_ignored():
    raw = [{"hod": "10"}, "not-a-dict", 42]
    assert _extract_numeric_score(raw, "hod") == 10.0
