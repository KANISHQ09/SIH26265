from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import date
from typing import Optional, Dict, Any


@dataclass
class BankVerificationResult:
    status: str # MATCH | MISMATCH | NOT_FOUND | UNAVAILABLE | TIMEOUT
    confirmed_amount: Optional[float] = None
    confirmed_maturity: Optional[date] = None
    lien_in_favour_of_aicte: Optional[bool] = None
    bank_reference: Optional[str] = None
    raw: Optional[Dict[str, Any]] = None


class BankVerifier(ABC):
    @abstractmethod
    async def verify(
        self, 
        bank_name: str, 
        reference_number: str, 
        amount: float, 
        issue_date: date,
        maturity_date: date,
        simulation_scenario: Optional[str] = None,
    ) -> BankVerificationResult:
        """Verifies instrument with bank API or simulated service."""
        pass
