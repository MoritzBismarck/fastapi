import os
import boto3
from botocore.client import Config
from ..config import settings

SPACES_REGION = settings.SPACES_REGION
SPACES_BUCKET = settings.SPACES_BUCKET
SPACES_ENDPOINT = settings.SPACES_ENDPOINT
SPACES_KEY = settings.SPACES_KEY
SPACES_SECRET = settings.SPACES_SECRET

s3_client = boto3.client(
    "s3",
    region_name=SPACES_REGION,
    endpoint_url=SPACES_ENDPOINT,  # Ensure you include the HTTPS scheme
    aws_access_key_id=SPACES_KEY,
    aws_secret_access_key=SPACES_SECRET,
    config=Config(signature_version="s3v4")  # Use S3v4 for signing requests
)

# cors_configuration = {
#     "CORSRules": [
#         {
#             "AllowedOrigins": ["*"],
#             "AllowedMethods": ["GET", "PUT", "POST"],
#             "AllowedHeaders": ["*"],
#             "ExposeHeaders": ["ETag"],
#             "MaxAgeSeconds": 3000
#         }
#     ]
# }

# s3_client.put_bucket_cors(Bucket=settings.SPACES_BUCKET, CORSConfiguration=cors_configuration)

def upload_file(file_path: str, object_name: str) -> str:
    """
    Uploads a file to the specified DigitalOcean Spaces bucket.

    :param file_path: Local path to the file to be uploaded.
    :param object_name: Name of the file in the bucket.
    :return: Public URL to the uploaded file.
    """
    try:
        s3_client.upload_file(file_path, SPACES_BUCKET, object_name, ExtraArgs={"ACL": "public-read"})
        # Construct the public URL (if your bucket is set to public or using a CDN)
        file_url = f"https://{SPACES_BUCKET}.{SPACES_ENDPOINT}/{object_name}"
        return file_url
    except Exception as e:
        # Handle exceptions (logging, re-raising, custom error message, etc.)
        raise RuntimeError(f"File upload failed: {e}")
    
def upload_fileobj(file_obj, object_name: str) -> None:
    """
    Uploads a file-like object to the configured DigitalOcean Spaces bucket.
    
    :param file_obj: A file-like object (e.g., from FastAPI's UploadFile.file)
    :param object_name: The target file name in the Spaces bucket.
    """
    try:
        s3_client.upload_fileobj(file_obj, SPACES_BUCKET, object_name)
    except Exception as e:
        raise RuntimeError(f"File upload failed: {e}")

def delete_file(object_name: str) -> None:
    """
    Deletes a file from the specified DigitalOcean Spaces bucket.

    :param object_name: Name of the file in the bucket to delete.
    """
    try:
        s3_client.delete_object(Bucket=SPACES_BUCKET, Key=object_name, ExtraArgs={"ACL": "public-read"})
    except Exception as e:
        raise RuntimeError(f"File deletion failed: {e}")

def generate_file_url(object_name: str) -> str:
    """
    Generates a CDN URL for an object stored in DigitalOcean Spaces.

    :param object_name: Name of the file in the bucket.
    :return: CDN URL for the file.
    """
    return f"https://{SPACES_BUCKET}.{SPACES_REGION}.cdn.digitaloceanspaces.com/{SPACES_BUCKET}/{object_name}"