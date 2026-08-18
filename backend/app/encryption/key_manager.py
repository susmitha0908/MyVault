import os
import base64
import logging
import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)

class KeyManager:
    def __init__(self):
        self.kms_key_id = os.getenv("AWS_KMS_KEY_ID")
        self.aws_region = os.getenv("AWS_REGION", "us-east-1")
        self.local_kek = os.getenv("LOCAL_MASTER_KEK")
        
        # Verify presence of KEK configuration
        if not self.kms_key_id and not self.local_kek:
            # Fallback default for development (warn in logs, but ensure bootstrap works)
            logger.warning("No AWS_KMS_KEY_ID or LOCAL_MASTER_KEK found! Using insecure fallback KEK for startup.")
            self.local_kek = "eDRkd2V5c2ZkZ3NkaGZnaHdhZXJ0eXVpb3A4NzY1NDM=" # 32-byte fallback
            
        self.kms_client = None
        if self.kms_key_id:
            try:
                self.kms_client = boto3.client("kms", region_name=self.aws_region)
                logger.info("AWS KMS client initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize AWS KMS client: {e}. Falling back to local KEK.")
                self.kms_client = None

    def wrap_key(self, dek: bytes) -> str:
        """Wraps (encrypts) the DEK using the KEK (AWS KMS or Local)."""
        if self.kms_client and self.kms_key_id:
            try:
                response = self.kms_client.encrypt(
                    KeyId=self.kms_key_id,
                    Plaintext=dek
                )
                wrapped_key = response["CiphertextBlob"]
                return base64.b64encode(wrapped_key).decode("utf-8")
            except ClientError as e:
                logger.error(f"KMS wrap_key failure: {e}")
                raise RuntimeError("KMS Key wrapping failed")
        else:
            # Local AES KEK encryption (simulation)
            # For simulation, we can encrypt the DEK with the local KEK using simple XOR or AES-ECB/CBC.
            # Let's use AES-ECB for simplicity of key wrapping since the DEK is 32-byte random bytes.
            from Crypto.Cipher import AES
            kek_bytes = base64.b64decode(self.local_kek)
            cipher = AES.new(kek_bytes, AES.MODE_ECB)
            wrapped_key = cipher.encrypt(dek)
            return base64.b64encode(wrapped_key).decode("utf-8")

    def unwrap_key(self, wrapped_dek_str: str) -> bytes:
        """Unwraps (decrypts) the wrapped DEK using the KEK (AWS KMS or Local)."""
        wrapped_key = base64.b64decode(wrapped_dek_str)
        if self.kms_client and self.kms_key_id:
            try:
                response = self.kms_client.decrypt(
                    CiphertextBlob=wrapped_key
                )
                return response["Plaintext"]
            except ClientError as e:
                logger.error(f"KMS unwrap_key failure: {e}")
                raise RuntimeError("KMS Key unwrapping failed")
        else:
            # Local AES KEK decryption
            from Crypto.Cipher import AES
            kek_bytes = base64.b64decode(self.local_kek)
            cipher = AES.new(kek_bytes, AES.MODE_ECB)
            return cipher.decrypt(wrapped_key)

# Global instance
key_manager = KeyManager()
