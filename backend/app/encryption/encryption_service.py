import base64
import json
import secrets
from Crypto.Cipher import AES
from app.encryption.key_manager import key_manager

class EncryptionService:
    @staticmethod
    def encrypt_data(plaintext: str) -> str:
        """Encrypts data using AES-256-GCM with a unique DEK, wrapping the DEK with the KEK."""
        if not plaintext:
            return ""
            
        # 1. Generate a cryptographically secure random 32-byte DEK
        dek = secrets.token_bytes(32)
        
        # 2. Setup GCM cipher with a secure 12-byte nonce
        nonce = secrets.token_bytes(12)
        cipher = AES.new(dek, AES.MODE_GCM, nonce=nonce)
        
        # 3. Encrypt payload
        ciphertext_bytes, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
        
        # 4. Wrap DEK using KEK
        wrapped_dek_str = key_manager.wrap_key(dek)
        
        # 5. Build envelope payload package
        envelope = {
            "nonce": base64.b64encode(nonce).decode("utf-8"),
            "tag": base64.b64encode(tag).decode("utf-8"),
            "wrapped_dek": wrapped_dek_str,
            "ciphertext": base64.b64encode(ciphertext_bytes).decode("utf-8")
        }
        
        # 6. Return as base64 encoded JSON string
        envelope_json = json.dumps(envelope)
        return base64.b64encode(envelope_json.encode("utf-8")).decode("utf-8")

    @staticmethod
    def decrypt_data(envelope_str: str) -> str:
        """Decrypts envelope-encrypted data, unwrapping the DEK using the KEK first."""
        if not envelope_str:
            return ""
            
        try:
            # 1. Decode envelope string
            envelope_json = base64.b64decode(envelope_str).decode("utf-8")
            envelope = json.loads(envelope_json)
            
            # 2. Extract components
            nonce = base64.b64decode(envelope["nonce"])
            tag = base64.b64decode(envelope["tag"])
            wrapped_dek = envelope["wrapped_dek"]
            ciphertext = base64.b64decode(envelope["ciphertext"])
            
            # 3. Unwrap DEK using KEK
            dek = key_manager.unwrap_key(wrapped_dek)
            
            # 4. Decrypt payload
            cipher = AES.new(dek, AES.MODE_GCM, nonce=nonce)
            plaintext_bytes = cipher.decrypt_and_verify(ciphertext, tag)
            
            return plaintext_bytes.decode("utf-8")
        except Exception as e:
            # Mask detailed cryptographical errors to avoid side-channel leaks
            raise ValueError(f"Decryption failed: Integrity check or key unwrapping error")
