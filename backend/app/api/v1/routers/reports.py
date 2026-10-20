import io
import csv
from datetime import date, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.deps import get_current_user, require_roles
from app.models.enums import InstrumentStatus, DiscrepancyStatus, UserRole
from app.models.entities import Instrument, Discrepancy, User
from app.services.reminder_service import get_current_system_date

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/{report_type}")
async def generate_report(
    report_type: str,
    format: str = Query("json", pattern="^(json|csv)$"),
    current_user: User = Depends(require_roles(
        UserRole.SCRUTINY_OFFICER, 
        UserRole.SECTION_HEAD, 
        UserRole.FINANCE_OFFICER, 
        UserRole.COMPETENT_AUTHORITY, 
        UserRole.AUDITOR, 
        UserRole.ADMIN
    )),
    db: AsyncSession = Depends(get_db),
):
    current_date = get_current_system_date()
    rows = []

    if report_type == "upcoming-maturity":
        ninety_days = current_date + timedelta(days=90)
        stmt = (
            select(Instrument)
            .options(selectinload(Instrument.institution), selectinload(Instrument.bank))
            .where(
                and_(
                    Instrument.maturity_date <= ninety_days,
                    Instrument.maturity_date >= current_date,
                    Instrument.status.in_([InstrumentStatus.ACTIVE, InstrumentStatus.EXPIRING])
                )
            )
            .order_by(Instrument.maturity_date.asc())
        )
        instruments = (await db.execute(stmt)).scalars().all()
        for i in instruments:
            days_left = (i.maturity_date - current_date).days
            rows.append({
                "Reference Number": i.reference_number,
                "Institution": i.institution.name if i.institution else "",
                "AICTE ID": i.institution.aicte_id if i.institution else "",
                "Bank": i.bank.name if i.bank else "",
                "Amount (INR)": f"{i.amount:,.2f}",
                "Maturity Date": i.maturity_date.isoformat(),
                "Days Left": days_left,
                "Status": i.status.value,
                "Trust Level": i.overall_trust.value,
            })

    elif report_type == "pending-verification":
        stmt = (
            select(Instrument)
            .options(selectinload(Instrument.institution), selectinload(Instrument.bank))
            .where(Instrument.status.in_([InstrumentStatus.SUBMITTED, InstrumentStatus.UNDER_SCRUTINY, InstrumentStatus.DISCREPANCY_FLAGGED]))
            .order_by(Instrument.created_at.asc())
        )
        instruments = (await db.execute(stmt)).scalars().all()
        for i in instruments:
            rows.append({
                "Reference Number": i.reference_number,
                "Institution": i.institution.name if i.institution else "",
                "Bank": i.bank.name if i.bank else "",
                "Amount (INR)": f"{i.amount:,.2f}",
                "Status": i.status.value,
                "Submission Date": i.created_at.strftime("%Y-%m-%d"),
                "Trust Level": i.overall_trust.value,
            })

    elif report_type == "discrepancies":
        stmt = (
            select(Discrepancy)
            .options(selectinload(Discrepancy.instrument))
            .where(Discrepancy.status == DiscrepancyStatus.OPEN)
            .order_by(desc(Discrepancy.created_at))
        )
        discs = (await db.execute(stmt)).scalars().all()
        for d in discs:
            rows.append({
                "Discrepancy ID": d.id,
                "Instrument Reference": d.instrument.reference_number if d.instrument else "",
                "Rule Code": d.rule_code,
                "Severity": d.severity.value,
                "Message": d.message,
                "Detected By": d.detected_by,
                "Detected Date": d.created_at.strftime("%Y-%m-%d"),
            })

    elif report_type == "overdue":
        stmt = (
            select(Instrument)
            .options(selectinload(Instrument.institution), selectinload(Instrument.bank))
            .where(Instrument.status == InstrumentStatus.OVERDUE)
            .order_by(Instrument.maturity_date.asc())
        )
        instruments = (await db.execute(stmt)).scalars().all()
        for i in instruments:
            days_overdue = (current_date - i.maturity_date).days
            rows.append({
                "Reference Number": i.reference_number,
                "Institution": i.institution.name if i.institution else "",
                "Bank": i.bank.name if i.bank else "",
                "Amount (INR)": f"{i.amount:,.2f}",
                "Maturity Date": i.maturity_date.isoformat(),
                "Days Overdue": days_overdue,
                "Status": i.status.value,
            })

    elif report_type == "released":
        stmt = (
            select(Instrument)
            .options(selectinload(Instrument.institution), selectinload(Instrument.bank))
            .where(Instrument.status == InstrumentStatus.RELEASED)
            .order_by(desc(Instrument.updated_at))
        )
        instruments = (await db.execute(stmt)).scalars().all()
        for i in instruments:
            rows.append({
                "Reference Number": i.reference_number,
                "Institution": i.institution.name if i.institution else "",
                "Bank": i.bank.name if i.bank else "",
                "Amount (INR)": f"{i.amount:,.2f}",
                "Discharge Date": i.updated_at.strftime("%Y-%m-%d"),
                "Status": i.status.value,
            })
    else:
        raise HTTPException(status_code=400, detail=f"Unknown report type: {report_type}")

    if format == "csv":
        output = io.StringIO()
        if rows:
            writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
            writer.writeheader()
            writer.writerows(rows)
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="zetsu_{report_type}_{current_date.isoformat()}.csv"'}
        )

    return {
        "report_type": report_type,
        "generated_on": current_date.isoformat(),
        "total_records": len(rows),
        "data": rows
    }
