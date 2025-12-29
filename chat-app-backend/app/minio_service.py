# minio_client 
import boto3
from botocore.client import Config
from datetime import timedelta
from .settings import settings
import io

class MinioClient:
    def __init__(self):
        # Allow fully qualified URLs in MINIO_ENDPOINT (needed for Supabase)
        endpoint = settings.MINIO_ENDPOINT
        # Ensure scheme is present for boto3 if not provided
        if not endpoint.startswith("http"):
            scheme = "https" if settings.MINIO_SECURE else "http"
            endpoint = f"{scheme}://{endpoint}"

        self.s3_client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
            config=Config(signature_version="s3v4"),
            region_name="auto" # Supabase implies region in endpoint usually
        )
        self.bucket_name = settings.MINIO_BUCKET

    def initialize_bucket(self):
        """
        Creates the bucket if it doesn't already exist.
        """
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            print(f"✅ Bucket '{self.bucket_name}' exists.")
        except Exception:
            # Try creating
            try:
                self.s3_client.create_bucket(Bucket=self.bucket_name)
                print(f"✅ Bucket '{self.bucket_name}' created.")
            except Exception as e:
                print(f"⚠️ Warning: Could not verify/create bucket '{self.bucket_name}': {e}")
                print("   (This is expected if using Supabase with restricted permissions. Proceeding...)")

    def upload_file(self, file_name: str, file_data: bytes) -> dict:
        """
        Uploads a file to S3/MinIO and returns file_name + presigned URL.
        """
        try:
            file_stream = io.BytesIO(file_data)
            self.s3_client.upload_fileobj(
                file_stream,
                self.bucket_name,
                file_name
            )
            # Generate presigned URL (valid 1 hr)
            file_url = self.generate_presigned_url(file_name)
            return {"file_name": file_name, "file_url": file_url}
        except Exception as exc:
            print("Error uploading file to S3:", exc)
            raise

    def generate_presigned_url(self, file_name: str, expiry_hours: int = 1) -> str:
        """
        Generate a new presigned URL for an existing file.
        """
        try:
            return self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket_name, 'Key': file_name},
                ExpiresIn=expiry_hours * 3600
            )
        except Exception as exc:
            print("Error generating presigned URL:", exc)
            raise

minio_client = MinioClient()
