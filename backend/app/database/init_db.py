import logging
from sqlalchemy.orm import Session
from app.database.session import Base, engine, SessionLocal
from app.models.models import User

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Basic dummy credentials (never used in production)
DEMO_EMAIL = "demo@vaultops.io"
# In Phase 1 we can store this hashed or plain as a stub, but let's hash it properly in Phase 2
DEMO_PASSWORD_HASH = "$argon2id$v=19$m=65536,t=3,p=4$42L1z6xYyTETp63L7jZ0rA$9Qc0VwXn0t3W6w5Pq1T8Z/k6eX6o7L9p0t0" # Argon2 hash of 'password123'

def init_db():
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created.")

    # Create dummy user if it doesn't exist
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if not user:
            logger.info("Creating default developer user demo@vaultops.io...")
            user = User(
                email=DEMO_EMAIL,
                hashed_password=DEMO_PASSWORD_HASH,
                mfa_enabled=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Default user created with ID: {user.id}")
        else:
            logger.info("Default developer user already exists.")
    except Exception as e:
        logger.error(f"Error initializing default user: {e}")
        db.rollback()
    finally:
        db.close()
