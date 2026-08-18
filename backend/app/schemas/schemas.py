from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any

# ==========================================
# USER & AUTH SCHEMAS
# ==========================================

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="User password must be at least 8 characters long")

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    mfa_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SessionResponse(BaseModel):
    id: UUID
    device_info: Optional[str] = None
    browser_info: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime
    last_active: datetime
    expires_at: datetime
    is_active: bool

    class Config:
        from_attributes = True

# ==========================================
# TAG SCHEMAS
# ==========================================

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: UUID

    class Config:
        from_attributes = True

# ==========================================
# ENVIRONMENT SCHEMAS
# ==========================================

class EnvironmentBase(BaseModel):
    name: str

class EnvironmentCreate(EnvironmentBase):
    project_id: UUID

class EnvironmentResponse(EnvironmentBase):
    id: UUID
    project_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ==========================================
# PROJECT SCHEMAS
# ==========================================

class ProjectBase(BaseModel):
    name: str  # Plaintext in API payloads, encrypted at rest
    description: Optional[str] = None
    is_favorite: bool = False

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_favorite: Optional[bool] = None

class ProjectResponse(ProjectBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    environments: List[EnvironmentResponse] = []
    
    # Counts calculated dynamically
    credentials_count: int = 0
    emails_count: int = 0
    notes_count: int = 0

    class Config:
        from_attributes = True

# ==========================================
# CREDENTIAL SCHEMAS
# ==========================================

class CredentialBase(BaseModel):
    app_name: str
    username: str
    category: str = "Other"
    url: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: bool = False
    project_id: Optional[UUID] = None
    environment_id: Optional[UUID] = None

class CredentialCreate(CredentialBase):
    password: str
    api_key: Optional[str] = None
    token: Optional[str] = None
    tags: List[str] = []

class CredentialUpdate(BaseModel):
    app_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    api_key: Optional[str] = None
    token: Optional[str] = None
    category: Optional[str] = None
    url: Optional[str] = None
    notes: Optional[str] = None
    is_favorite: Optional[bool] = None
    project_id: Optional[UUID] = None
    environment_id: Optional[UUID] = None
    tags: Optional[List[str]] = None

class CredentialResponse(CredentialBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    last_accessed: Optional[datetime] = None
    tags: List[TagResponse] = []
    
    # In secure index/list APIs, password, api_key and token are masked.
    # Frontend must call specific detail endpoint to reveal decrypted data (or it can request decrypt).
    password_masked: bool = True 

    class Config:
        from_attributes = True

class CredentialDetailResponse(CredentialResponse):
    password: str
    api_key: Optional[str] = None
    token: Optional[str] = None

# ==========================================
# EMAIL SCHEMAS
# ==========================================

class EmailBase(BaseModel):
    subject: str
    sender: str
    sent_date: Optional[datetime] = None
    category: str = "Other"
    notes: Optional[str] = None
    is_favorite: bool = False
    project_id: Optional[UUID] = None
    environment_id: Optional[UUID] = None

class EmailCreate(EmailBase):
    body: str
    tags: List[str] = []

class EmailResponse(EmailBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []
    body_masked: bool = True

    class Config:
        from_attributes = True

class EmailDetailResponse(EmailResponse):
    body: str

# ==========================================
# SECURE NOTE SCHEMAS
# ==========================================

class NoteBase(BaseModel):
    title: str
    is_favorite: bool = False
    project_id: Optional[UUID] = None
    environment_id: Optional[UUID] = None

class NoteCreate(NoteBase):
    content: str
    tags: List[str] = []

class NoteResponse(NoteBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []
    content_masked: bool = True

    class Config:
        from_attributes = True

class NoteDetailResponse(NoteResponse):
    content: str

# ==========================================
# ATTACHMENT SCHEMAS
# ==========================================

class AttachmentResponse(BaseModel):
    id: UUID
    parent_type: str
    parent_id: UUID
    filename: str
    file_size: int
    mime_type: str
    created_at: datetime
    download_url: Optional[str] = None

    class Config:
        from_attributes = True

# ==========================================
# AUDIT LOG, SEARCH & BACKUP SCHEMAS
# ==========================================

class AuditLogResponse(BaseModel):
    id: UUID
    action: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class SearchResultItem(BaseModel):
    id: UUID
    type: str # 'project', 'credential', 'email', 'note'
    title: str
    subtitle: Optional[str] = None
    project_name: Optional[str] = None
    environment_name: Optional[str] = None
    is_favorite: bool = False
    tags: List[str] = []

class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]

class BackupRecordResponse(BaseModel):
    id: UUID
    backup_type: str
    status: str
    file_size: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RecoveryStatusResponse(BaseModel):
    database_backup_enabled: bool
    s3_backup_enabled: bool
    encrypted_export_available: bool
    last_backup_time: Optional[datetime] = None
    last_recovery_test_time: Optional[datetime] = None
    recovery_readiness: str
    history: List[BackupRecordResponse] = []

class SecurityCenterResponse(BaseModel):
    security_score: int
    checks: Dict[str, bool]
    warnings: List[str]
    recommendations: List[str]
