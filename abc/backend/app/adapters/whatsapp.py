import abc
import logging
import httpx
from typing import Dict, Any, Tuple
from backend.app.core.config import settings

logger = logging.getLogger(__name__)

class WhatsAppAdapter(abc.ABC):
    @abc.abstractmethod
    async def send_message(self, to_number: str, text: str) -> bool:
        pass

class DemoWhatsAppAdapter(WhatsAppAdapter):
    """
    Simulates sending WhatsApp messages for interactive browser demo.
    """
    async def send_message(self, to_number: str, text: str) -> bool:
        logger.info(f"[DEMO WHATSAPP] Sent to {to_number}: {text}")
        return True

class MetaWhatsAppAdapter(WhatsAppAdapter):
    """
    Real Meta Cloud API WhatsApp sender.
    """
    async def send_message(self, to_number: str, text: str) -> bool:
        if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_PHONE_NUMBER_ID:
            logger.warning("WhatsApp API credentials not configured.")
            return False

        url = f"https://graph.facebook.com/v20.0/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
        headers = {
            "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
            "Content-Type": "application/json"
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to_number,
            "type": "text",
            "text": {"body": text}
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                return res.status_code == 200
        except Exception as e:
            logger.error(f"WhatsApp Meta API send error: {e}")
            return False

def get_whatsapp_adapter() -> WhatsAppAdapter:
    if settings.WHATSAPP_API_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID:
        return MetaWhatsAppAdapter()
    return DemoWhatsAppAdapter()
