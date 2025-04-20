import boto3
import json
from botocore.client import Config
from config import settings

SPACES_REGION = settings.SPACES_REGION
SPACES_BUCKET = settings.SPACES_BUCKET
SPACES_ENDPOINT = settings.SPACES_ENDPOINT
SPACES_KEY = settings.SPACES_KEY
SPACES_SECRET = settings.SPACES_SECRET


client = boto3.client(
    "s3",
    region_name=SPACES_REGION,
    endpoint_url=SPACES_ENDPOINT,  # Ensure you include the HTTPS scheme
    aws_access_key_id=SPACES_KEY,
    aws_secret_access_key=SPACES_SECRET,
    config=Config(signature_version="s3v4")  # Use S3v4 for signing requests
)

# Define the policy - this allows public read access
try:
    policy = client.get_bucket_policy(Bucket=SPACES_BUCKET)
    print(f"Current bucket policy: {policy['Policy']}")
except Exception as e:
    print(f"Error getting bucket policy: {e}")