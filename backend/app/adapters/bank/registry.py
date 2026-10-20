from app.adapters.bank.base import BankVerifier
from app.adapters.bank.mock_bank import MockBankVerifier

_default_verifier = MockBankVerifier()


def get_bank_verifier(bank_id: str) -> BankVerifier:
    """Returns the verifier adapter corresponding to the bank."""
    return _default_verifier
