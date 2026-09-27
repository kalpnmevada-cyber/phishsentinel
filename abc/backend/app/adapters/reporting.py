import abc
import random
import datetime
import httpx
from typing import Dict, Any, Tuple
from backend.app.core.config import settings

class ReportingAdapter(abc.ABC):
    @abc.abstractmethod
    async def submit_report(self, report_payload: Dict[str, Any]) -> Tuple[bool, str, str]:
        """
        Returns: (success: bool, ack_id: str, message: str)
        """
        pass

class DemoReportingAdapter(ReportingAdapter):
    """
    Simulates official cybercrime portal dispatch for hackathon demos.
    Returns a realistic National Cyber Crime Reporting Portal (NCRP) reference token.
    """
    async def submit_report(self, report_payload: Dict[str, Any]) -> Tuple[bool, str, str]:
        year = datetime.datetime.now().year
        random_digits = random.randint(100000, 999999)
        ack_id = f"NCRP-{year}-{random_digits}"
        message = (
            f"[DEMO ADAPTER] Incident report successfully submitted to simulated Cyber Crime Portal. "
            f"Official Incident Docket #{ack_id} generated for tracking with LEA (Law Enforcement Agency)."
        )
        return True, ack_id, message

class LiveReportingAdapter(ReportingAdapter):
    """
    Connects to the official or staging National Cyber Crime Reporting Portal API
    when credentials and endpoints are provided via environment variables.
    """
    async def submit_report(self, report_payload: Dict[str, Any]) -> Tuple[bool, str, str]:
        if not settings.CYBERCRIME_PORTAL_ENABLED or not settings.CYBERCRIME_PORTAL_API_KEY:
            return False, "", "Live cybercrime portal integration is disabled or missing API key."

        headers = {
            "Authorization": f"Bearer {settings.CYBERCRIME_PORTAL_API_KEY}",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    settings.CYBERCRIME_PORTAL_ENDPOINT,
                    json=report_payload,
                    headers=headers
                )
                if resp.status_code in (200, 201):
                    data = resp.json()
                    ack_id = data.get("acknowledgement_number", f"NCRP-LIVE-{random.randint(100000,999999)}")
                    return True, ack_id, "Report successfully transmitted to live Cyber Crime Portal."
                else:
                    return False, "", f"Portal returned error {resp.status_code}: {resp.text}"
        except Exception as e:
            return False, "", f"Failed to transmit to portal: {str(e)}"

def get_reporting_adapter() -> Tuple[str, ReportingAdapter]:
    if settings.CYBERCRIME_PORTAL_ENABLED and settings.CYBERCRIME_PORTAL_API_KEY:
        return "LiveReportingAdapter", LiveReportingAdapter()
    return "DemoReportingAdapter", DemoReportingAdapter()
