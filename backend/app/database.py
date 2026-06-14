import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables from backend/.env
dotenv_path = Path(__file__).resolve().parent.parent / '.env'
load_dotenv(dotenv_path)

DATABASE_URL = os.getenv("DATABASE_URL")

# Clean up in case there is a malformed "DATABASE_URL=DATABASE_URL=..." in .env
if DATABASE_URL:
    if DATABASE_URL.startswith("DATABASE_URL="):
        DATABASE_URL = DATABASE_URL.replace("DATABASE_URL=", "", 1)
else:
    # Fallback to standard local DB URL
    DATABASE_URL = "mysql+pymysql://wakhar:wakhar123@localhost/wakharwms"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
