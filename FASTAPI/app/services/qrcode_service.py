# FASTAPI/app/services/qrcode_service.py
import qrcode
import io
import base64
from typing import Optional

class QRCodeService:
    @staticmethod
    def generate_qr_code(data: str, size: int = 10) -> bytes:
        """Generate a QR code from the given data."""
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert image to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        return img_byte_arr
    
    @staticmethod
    def generate_qr_code_base64(data: str, size: int = 10) -> str:
        """Generate a QR code and return as base64 string for embedding in HTML."""
        qr_bytes = QRCodeService.generate_qr_code(data, size)
        base64_encoded = base64.b64encode(qr_bytes).decode('ascii')
        return f"data:image/png;base64,{base64_encoded}"