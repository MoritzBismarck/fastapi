from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import psycopg2
from psycopg2.extras import RealDictCursor
import time
from .config import settings
# from urllib.parse import quote_plus

# encoded_password = quote_plus(settings.database_password)

# print("DEBUG: Environment Variables:")
# print(f"DATABASE_HOSTNAME: '{settings.database_hostname}'")
# print(f"DATABASE_PORT: '{settings.database_port}'")
# print(f"DATABASE_USERNAME: '{settings.database_username}'")
# print(f"DATABASE_NAME: '{settings.database_name}'")

SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.database_username}:{settings.database_password}@{settings.database_hostname}:{settings.database_port}/{settings.database_name}" #'postgresqu://<username>:<password>@<ip-adress of host/hostname>:<port>/<database_name>'
# print(f"DEBUG: Connection string: {SQLALCHEMY_DATABASE_URL}")

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# while True:
#     try:
#         conn = psycopg2.connect(
#             host= 'localhost', 
#             database= 'fastapi', 
#             user='postgres', 
#             password='awdiojhaw3992qk1', 
#             cursor_factory=RealDictCursor
#         )
#         cursor = conn.cursor()
#         print("Connected to the database")
#         break
#     except Exception as error:
#         print("Connection to database failed")
#         print("Error: ", error)
#         time.sleep(6)

