from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_hostname: str
    database_port: int
    database_password: str
    database_name: str
    database_username: str
    secret_key: str
    algorithm: str
    access_token_expire_minutes: int
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    SPACES_REGION: str
    SPACES_BUCKET: str
    SPACES_ENDPOINT: str
    SPACES_KEY: str
    SPACES_SECRET: str

    class Config:
        env_file = ".env"

settings = Settings()