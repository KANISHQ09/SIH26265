import asyncio
from datetime import date
from typing import Optional
from app.adapters.bank.base import BankVerifier, BankVerificationResult


class MockBankVerifier(BankVerifier):
    """
    Simulated CBS / SFMS bank verification gateway.
    Handles MATCH, MISMATCH, NOT_FOUND, and TIMEOUT scenarios for interactive demo testing.
    """

    async def verify(
        self,
        bank_name: str,
        reference_number: str,
        amount: float,
        issue_date: date,
        maturity_date: date,
        simulation_scenario: Optional[str] = None,
    ) -> BankVerificationResult:
        # Simulate slight network roundtrip to the Core Banking System
        await asyncio.sleep(0.5)

        scenario = (simulation_scenario or "").upper()
        ref_upper = reference_number.upper()

        if scenario == "TIMEOUT" or "TIMEOUT" in ref_upper:
            return BankVerificationResult(
                status="TIMEOUT",
                raw={"error": "Bank gateway connection timed out after 10000ms"}
            )

        if scenario == "NOT_FOUND" or "NOTFOUND" in ref_upper:
            return BankVerificationResult(
                status="NOT_FOUND",
                raw={"error": f"FDR number {reference_number} not found in {bank_name} CBS records."}
            )

        if scenario == "MISMATCH" or "MISMATCH" in ref_upper:
            # Bank reports a lesser amount or lien not marked
            return BankVerificationResult(
                status="MISMATCH",
                confirmed_amount=amount * 0.75, # 25% discrepancy
                confirmed_maturity=maturity_date,
                lien_in_favour_of_aicte=False, # Lien was omitted at branch!
                bank_reference=f"CBS-REF-{reference_number}-DISC",
                raw={
                    "bank_cbs_code": "200_DISCREPANT",
                    "cbs_balance": amount * 0.75,
                    "lien_holder": "NONE",
                    "remarks": "Lien not registered in favour of AICTE; Principal mismatch."
                }
            )

        # Default Happy Path: Full CBS Confirmation MATCH
        return BankVerificationResult(
            status="MATCH",
            confirmed_amount=amount,
            confirmed_maturity=maturity_date,
            lien_in_favour_of_aicte=True,
            bank_reference=f"CBS-CONF-{reference_number}",
            raw={
                "bank_cbs_code": "200_OK",
                "bank_name": bank_name,
                "verified_at": date.today().isoformat(),
                "lien_holder": "Member Secretary, AICTE New Delhi",
                "status": "ACTIVE_LIEN_CONFIRMED"
            }
        )
