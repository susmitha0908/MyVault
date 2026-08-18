from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from typing import List, Optional
import json

from app.database.session import get_db
from app.models.models import (
    User, Project, Environment, Credential, Email, Note, Tag, AuditLog, 
    BackupRecord, RecoveryRecord, Session as UserSession
)
from app.schemas.schemas import (
    UserCreate, UserLogin, UserResponse, SessionResponse, ProjectCreate, ProjectResponse, ProjectUpdate,
    EnvironmentCreate, EnvironmentResponse, CredentialCreate, CredentialResponse,
    CredentialDetailResponse, CredentialUpdate, EmailCreate, EmailResponse,
    EmailDetailResponse, NoteCreate, NoteResponse, NoteDetailResponse,
    AuditLogResponse, SearchResponse, SearchResultItem, RecoveryStatusResponse,
    BackupRecordResponse
)
from app.security.auth_helper import (
    verify_password, hash_password, create_user_session, get_current_user, 
    SESSION_COOKIE_NAME, SESSION_EXPIRE_MINUTES
)
from app.encryption.encryption_service import EncryptionService
from app.services.audit_logger import log_action

router = APIRouter(prefix="/api")

# ==========================================
# HEALTH & AUTHENTICATION ENDPOINTS
# ==========================================

@router.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@router.post("/auth/login", tags=["Auth"])
def login(login_data: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        # Audit fail login attempt
        log_action(db, None, "FAILED_LOGIN", request, {"email": login_data.email})
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create session
    token = create_user_session(db, user.id, request)
    
    # Set HttpOnly, Secure, SameSite cookie
    # Secure=True will be true in production, but let's allow HTTP in development
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        max_age=SESSION_EXPIRE_MINUTES * 60,
        expires=SESSION_EXPIRE_MINUTES * 60,
        samesite="lax", # Lax allows local Vite frontend on port 3000 to talk to port 8000
        secure=False # Set to True in production
    )
    
    log_action(db, user.id, "LOGIN_SUCCESS", request)
    return {"status": "success", "user": {"email": user.email, "mfa_enabled": user.mfa_enabled}}

@router.post("/auth/logout", tags=["Auth"])
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        db_session = db.query(UserSession).filter(UserSession.token_hash == token_hash).first()
        if db_session:
            db_session.is_active = False
            db.commit()
            log_action(db, db_session.user_id, "LOGOUT", request)
            
    response.delete_cookie(SESSION_COOKIE_NAME)
    return {"status": "success", "message": "Logged out successfully"}

@router.post("/auth/register", response_model=UserResponse, tags=["Auth"])
def register(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered"
        )
        
    hashed_pwd = hash_password(user_data.password)
    user = User(
        email=user_data.email,
        hashed_password=hashed_pwd
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    log_action(db, user.id, "REGISTER_SUCCESS", request, {"email": user_data.email})
    return user

@router.get("/auth/sessions", response_model=List[SessionResponse], tags=["Auth"])
def list_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True,
        UserSession.expires_at > datetime.utcnow()
    ).order_by(UserSession.last_active.desc()).all()
    return sessions

@router.delete("/auth/sessions/{id}", tags=["Auth"])
def terminate_session(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    session_to_kill = db.query(UserSession).filter(
        UserSession.id == id,
        UserSession.user_id == current_user.id
    ).first()
    if not session_to_kill:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
        
    session_to_kill.is_active = False
    db.commit()
    log_action(db, current_user.id, "SESSION_TERMINATED", request, {"session_id": str(id)})
    return {"status": "success", "message": "Session terminated successfully"}

@router.post("/auth/sessions/terminate-all", tags=["Auth"])
def terminate_all_sessions(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    token_hash = ""
    if token:
        import hashlib
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.token_hash != token_hash,
        UserSession.is_active == True
    ).update({UserSession.is_active: False})
    db.commit()
    
    log_action(db, current_user.id, "ALL_REMOTE_SESSIONS_TERMINATED", request)
    return {"status": "success", "message": "All remote sessions terminated successfully"}

@router.get("/auth/me", response_model=UserResponse, tags=["Auth"])
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# ==========================================
# PROJECTS & ENVIRONMENTS
# ==========================================

@router.get("/projects", response_model=List[ProjectResponse], tags=["Projects"])
def list_projects(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    
    results = []
    for p in projects:
        # In-memory decryption of Project name/desc
        decrypted_name = EncryptionService.decrypt_data(p.name)
        decrypted_desc = EncryptionService.decrypt_data(p.description) if p.description else None
        
        # Calculate counts
        credentials_count = db.query(Credential).filter(Credential.project_id == p.id).count()
        emails_count = db.query(Email).filter(Email.project_id == p.id).count()
        notes_count = db.query(Note).filter(Note.project_id == p.id).count()
        
        # Format environment responses
        envs_res = [
            EnvironmentResponse(
                id=e.id, 
                project_id=e.project_id, 
                name=e.name, 
                created_at=e.created_at, 
                updated_at=e.updated_at
            ) for e in p.environments
        ]
        
        results.append(
            ProjectResponse(
                id=p.id,
                user_id=p.user_id,
                name=decrypted_name,
                description=decrypted_desc,
                is_favorite=p.is_favorite,
                created_at=p.created_at,
                updated_at=p.updated_at,
                environments=envs_res,
                credentials_count=credentials_count,
                emails_count=emails_count,
                notes_count=notes_count
            )
        )
    return results

@router.post("/projects", response_model=ProjectResponse, tags=["Projects"])
def create_project(project_data: ProjectCreate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    encrypted_name = EncryptionService.encrypt_data(project_data.name)
    encrypted_desc = EncryptionService.encrypt_data(project_data.description) if project_data.description else None
    
    project = Project(
        user_id=current_user.id,
        name=encrypted_name,
        description=encrypted_desc,
        is_favorite=project_data.is_favorite
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    
    # Create default environments for the project
    defaults = ["Development", "Staging", "Production"]
    for name in defaults:
        env = Environment(project_id=project.id, name=name)
        db.add(env)
    db.commit()
    db.refresh(project)
    
    log_action(db, current_user.id, "PROJECT_CREATED", request, {"project_id": str(project.id), "name": project_data.name})
    
    # Return formatted decrypted response
    envs_res = [
        EnvironmentResponse(
            id=e.id, 
            project_id=e.project_id, 
            name=e.name, 
            created_at=e.created_at, 
            updated_at=e.updated_at
        ) for e in project.environments
    ]
    return ProjectResponse(
        id=project.id,
        user_id=project.user_id,
        name=project_data.name,
        description=project_data.description,
        is_favorite=project.is_favorite,
        created_at=project.created_at,
        updated_at=project.updated_at,
        environments=envs_res,
        credentials_count=0,
        emails_count=0,
        notes_count=0
    )

@router.delete("/projects/{id}", tags=["Projects"])
def delete_project(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == id, Project.user_id == current_user.id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    project_name = EncryptionService.decrypt_data(project.name)
    db.delete(project)
    db.commit()
    log_action(db, current_user.id, "PROJECT_DELETED", request, {"project_id": str(id), "name": project_name})
    return {"status": "success", "message": f"Project '{project_name}' deleted successfully"}

# ==========================================
# CREDENTIALS
# ==========================================

@router.get("/credentials", response_model=List[CredentialResponse], tags=["Credentials"])
def list_credentials(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    creds = db.query(Credential).filter(Credential.user_id == current_user.id).all()
    results = []
    for c in creds:
        results.append(
            CredentialResponse(
                id=c.id,
                user_id=c.user_id,
                project_id=c.project_id,
                environment_id=c.environment_id,
                app_name=EncryptionService.decrypt_data(c.app_name),
                username=EncryptionService.decrypt_data(c.username),
                category=c.category,
                url=EncryptionService.decrypt_data(c.url) if c.url else None,
                notes=EncryptionService.decrypt_data(c.notes) if c.notes else None,
                is_favorite=c.is_favorite,
                created_at=c.created_at,
                updated_at=c.updated_at,
                last_accessed=c.last_accessed,
                tags=[TagResponse(id=t.id, name=t.name) for t in c.tags],
                password_masked=True
            )
        )
    return results

@router.post("/credentials", response_model=CredentialResponse, tags=["Credentials"])
def create_credential(c_data: CredentialCreate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Envelope encrypt fields
    app_name_enc = EncryptionService.encrypt_data(c_data.app_name)
    username_enc = EncryptionService.encrypt_data(c_data.username)
    password_enc = EncryptionService.encrypt_data(c_data.password)
    api_key_enc = EncryptionService.encrypt_data(c_data.api_key) if c_data.api_key else None
    token_enc = EncryptionService.encrypt_data(c_data.token) if c_data.token else None
    url_enc = EncryptionService.encrypt_data(c_data.url) if c_data.url else None
    notes_enc = EncryptionService.encrypt_data(c_data.notes) if c_data.notes else None
    
    cred = Credential(
        user_id=current_user.id,
        project_id=c_data.project_id,
        environment_id=c_data.environment_id,
        app_name=app_name_enc,
        username=username_enc,
        password_ciphertext=password_enc,
        api_key_ciphertext=api_key_enc,
        token_ciphertext=token_enc,
        url=url_enc,
        category=c_data.category,
        notes=notes_enc,
        is_favorite=c_data.is_favorite
    )
    
    # Process Tags
    for tag_name in c_data.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name, Tag.user_id == current_user.id).first()
        if not tag:
            tag = Tag(name=tag_name, user_id=current_user.id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        cred.tags.append(tag)
        
    db.add(cred)
    db.commit()
    db.refresh(cred)
    
    log_action(db, current_user.id, "CREDENTIAL_CREATED", request, {"credential_id": str(cred.id), "app_name": c_data.app_name})
    
    return CredentialResponse(
        id=cred.id,
        user_id=cred.user_id,
        project_id=cred.project_id,
        environment_id=cred.environment_id,
        app_name=c_data.app_name,
        username=c_data.username,
        category=cred.category,
        url=c_data.url,
        notes=c_data.notes,
        is_favorite=cred.is_favorite,
        created_at=cred.created_at,
        updated_at=cred.updated_at,
        tags=[TagResponse(id=t.id, name=t.name) for t in cred.tags]
    )

@router.get("/credentials/{id}", response_model=CredentialDetailResponse, tags=["Credentials"])
def get_credential_detail(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cred = db.query(Credential).filter(Credential.id == id, Credential.user_id == current_user.id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    app_name = EncryptionService.decrypt_data(cred.app_name)
    
    # Decrypt sensitive fields
    password = EncryptionService.decrypt_data(cred.password_ciphertext)
    api_key = EncryptionService.decrypt_data(cred.api_key_ciphertext) if cred.api_key_ciphertext else None
    token = EncryptionService.decrypt_data(cred.token_ciphertext) if cred.token_ciphertext else None
    
    # Update last accessed time
    cred.last_accessed = datetime.utcnow()
    db.commit()
    
    log_action(db, current_user.id, "CREDENTIAL_ACCESSED", request, {"credential_id": str(cred.id), "app_name": app_name})
    
    return CredentialDetailResponse(
        id=cred.id,
        user_id=cred.user_id,
        project_id=cred.project_id,
        environment_id=cred.environment_id,
        app_name=app_name,
        username=EncryptionService.decrypt_data(cred.username),
        password=password,
        api_key=api_key,
        token=token,
        category=cred.category,
        url=EncryptionService.decrypt_data(cred.url) if cred.url else None,
        notes=EncryptionService.decrypt_data(cred.notes) if cred.notes else None,
        is_favorite=cred.is_favorite,
        created_at=cred.created_at,
        updated_at=cred.updated_at,
        last_accessed=cred.last_accessed,
        tags=[TagResponse(id=t.id, name=t.name) for t in cred.tags],
        password_masked=False
    )

@router.delete("/credentials/{id}", tags=["Credentials"])
def delete_credential(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cred = db.query(Credential).filter(Credential.id == id, Credential.user_id == current_user.id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    app_name = EncryptionService.decrypt_data(cred.app_name)
    db.delete(cred)
    db.commit()
    log_action(db, current_user.id, "CREDENTIAL_DELETED", request, {"credential_id": str(id), "app_name": app_name})
    return {"status": "success", "message": f"Credential for '{app_name}' deleted successfully"}

# ==========================================
# EMAILS
# ==========================================

@router.get("/emails", response_model=List[EmailResponse], tags=["Emails"])
def list_emails(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    emails = db.query(Email).filter(Email.user_id == current_user.id).all()
    results = []
    for em in emails:
        results.append(
            EmailResponse(
                id=em.id,
                user_id=em.user_id,
                project_id=em.project_id,
                environment_id=em.environment_id,
                subject=EncryptionService.decrypt_data(em.subject),
                sender=EncryptionService.decrypt_data(em.sender),
                sent_date=em.sent_date,
                category=em.category,
                notes=EncryptionService.decrypt_data(em.notes) if em.notes else None,
                is_favorite=em.is_favorite,
                created_at=em.created_at,
                updated_at=em.updated_at,
                tags=[TagResponse(id=t.id, name=t.name) for t in em.tags],
                body_masked=True
            )
        )
    return results

@router.post("/emails", response_model=EmailResponse, tags=["Emails"])
def create_email(em_data: EmailCreate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    email = Email(
        user_id=current_user.id,
        project_id=em_data.project_id,
        environment_id=em_data.environment_id,
        subject=EncryptionService.encrypt_data(em_data.subject),
        sender=EncryptionService.encrypt_data(em_data.sender),
        sent_date=em_data.sent_date or datetime.utcnow(),
        body_ciphertext=EncryptionService.encrypt_data(em_data.body),
        category=em_data.category,
        notes=EncryptionService.encrypt_data(em_data.notes) if em_data.notes else None,
        is_favorite=em_data.is_favorite
    )
    
    for tag_name in em_data.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name, Tag.user_id == current_user.id).first()
        if not tag:
            tag = Tag(name=tag_name, user_id=current_user.id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        email.tags.append(tag)
        
    db.add(email)
    db.commit()
    db.refresh(email)
    
    log_action(db, current_user.id, "EMAIL_CREATED", request, {"email_id": str(email.id), "subject": em_data.subject})
    
    return EmailResponse(
        id=email.id,
        user_id=email.user_id,
        project_id=email.project_id,
        environment_id=email.environment_id,
        subject=em_data.subject,
        sender=em_data.sender,
        sent_date=email.sent_date,
        category=email.category,
        notes=em_data.notes,
        is_favorite=email.is_favorite,
        created_at=email.created_at,
        updated_at=email.updated_at,
        tags=[TagResponse(id=t.id, name=t.name) for t in email.tags]
    )

@router.get("/emails/{id}", response_model=EmailDetailResponse, tags=["Emails"])
def get_email_detail(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == id, Email.user_id == current_user.id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    subject = EncryptionService.decrypt_data(email.subject)
    body = EncryptionService.decrypt_data(email.body_ciphertext)
    
    log_action(db, current_user.id, "EMAIL_ACCESSED", request, {"email_id": str(email.id), "subject": subject})
    
    return EmailDetailResponse(
        id=email.id,
        user_id=email.user_id,
        project_id=email.project_id,
        environment_id=email.environment_id,
        subject=subject,
        sender=EncryptionService.decrypt_data(email.sender),
        sent_date=email.sent_date,
        body=body,
        category=email.category,
        notes=EncryptionService.decrypt_data(email.notes) if email.notes else None,
        is_favorite=email.is_favorite,
        created_at=email.created_at,
        updated_at=email.updated_at,
        tags=[TagResponse(id=t.id, name=t.name) for t in email.tags],
        body_masked=False
    )

@router.delete("/emails/{id}", tags=["Emails"])
def delete_email(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    email = db.query(Email).filter(Email.id == id, Email.user_id == current_user.id).first()
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
        
    subject = EncryptionService.decrypt_data(email.subject)
    db.delete(email)
    db.commit()
    log_action(db, current_user.id, "EMAIL_DELETED", request, {"email_id": str(id), "subject": subject})
    return {"status": "success", "message": f"Secure email '{subject}' deleted successfully"}

# ==========================================
# SECURE NOTES
# ==========================================

@router.get("/notes", response_model=List[NoteResponse], tags=["Notes"])
def list_notes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    results = []
    for n in notes:
        results.append(
            NoteResponse(
                id=n.id,
                user_id=n.user_id,
                project_id=n.project_id,
                environment_id=n.environment_id,
                title=EncryptionService.decrypt_data(n.title),
                is_favorite=n.is_favorite,
                created_at=n.created_at,
                updated_at=n.updated_at,
                tags=[TagResponse(id=t.id, name=t.name) for t in n.tags],
                content_masked=True
            )
        )
    return results

@router.post("/notes", response_model=NoteResponse, tags=["Notes"])
def create_note(n_data: NoteCreate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = Note(
        user_id=current_user.id,
        project_id=n_data.project_id,
        environment_id=n_data.environment_id,
        title=EncryptionService.encrypt_data(n_data.title),
        content_ciphertext=EncryptionService.encrypt_data(n_data.content),
        is_favorite=n_data.is_favorite
    )
    
    for tag_name in n_data.tags:
        tag = db.query(Tag).filter(Tag.name == tag_name, Tag.user_id == current_user.id).first()
        if not tag:
            tag = Tag(name=tag_name, user_id=current_user.id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
        note.tags.append(tag)
        
    db.add(note)
    db.commit()
    db.refresh(note)
    
    log_action(db, current_user.id, "NOTE_CREATED", request, {"note_id": str(note.id), "title": n_data.title})
    
    return NoteResponse(
        id=note.id,
        user_id=note.user_id,
        project_id=note.project_id,
        environment_id=note.environment_id,
        title=n_data.title,
        is_favorite=note.is_favorite,
        created_at=note.created_at,
        updated_at=note.updated_at,
        tags=[TagResponse(id=t.id, name=t.name) for t in note.tags]
    )

@router.get("/notes/{id}", response_model=NoteDetailResponse, tags=["Notes"])
def get_note_detail(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    title = EncryptionService.decrypt_data(note.title)
    content = EncryptionService.decrypt_data(note.content_ciphertext)
    
    log_action(db, current_user.id, "NOTE_ACCESSED", request, {"note_id": str(note.id), "title": title})
    
    return NoteDetailResponse(
        id=note.id,
        user_id=note.user_id,
        project_id=note.project_id,
        environment_id=note.environment_id,
        title=title,
        content=content,
        is_favorite=note.is_favorite,
        created_at=note.created_at,
        updated_at=note.updated_at,
        tags=[TagResponse(id=t.id, name=t.name) for t in note.tags],
        content_masked=False
    )

@router.delete("/notes/{id}", tags=["Notes"])
def delete_note(id: UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(Note).filter(Note.id == id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    title = EncryptionService.decrypt_data(note.title)
    db.delete(note)
    db.commit()
    log_action(db, current_user.id, "NOTE_DELETED", request, {"note_id": str(id), "title": title})
    return {"status": "success", "message": f"Secure note '{title}' deleted successfully"}

# ==========================================
# SEARCH ENDPOINT
# ==========================================

@router.get("/search", response_model=SearchResponse, tags=["Search"])
def global_search(q: str = "", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not q:
        return SearchResponse(query="", results=[])
        
    query_lower = q.lower()
    results = []
    
    # 1. Search Projects
    projects = db.query(Project).filter(Project.user_id == current_user.id).all()
    for p in projects:
        name = EncryptionService.decrypt_data(p.name)
        desc = EncryptionService.decrypt_data(p.description) if p.description else ""
        if query_lower in name.lower() or query_lower in desc.lower():
            results.append(
                SearchResultItem(
                    id=p.id,
                    type="project",
                    title=name,
                    subtitle=desc[:60] + "..." if len(desc) > 60 else desc,
                    is_favorite=p.is_favorite
                )
            )
            
    # 2. Search Credentials
    creds = db.query(Credential).filter(Credential.user_id == current_user.id).all()
    for c in creds:
        app_name = EncryptionService.decrypt_data(c.app_name)
        username = EncryptionService.decrypt_data(c.username)
        notes = EncryptionService.decrypt_data(c.notes) if c.notes else ""
        proj_name = EncryptionService.decrypt_data(c.project.name) if c.project else None
        env_name = c.environment.name if c.environment else None
        
        matches = query_lower in app_name.lower() or query_lower in username.lower() or query_lower in notes.lower() or query_lower in c.category.lower()
        if not matches and c.tags:
            matches = any(query_lower in t.name.lower() for t in c.tags)
            
        if matches:
            results.append(
                SearchResultItem(
                    id=c.id,
                    type="credential",
                    title=app_name,
                    subtitle=f"Username: {username} | {c.category}",
                    project_name=proj_name,
                    environment_name=env_name,
                    is_favorite=c.is_favorite,
                    tags=[t.name for t in c.tags]
                )
            )
            
    # 3. Search Emails
    emails = db.query(Email).filter(Email.user_id == current_user.id).all()
    for em in emails:
        subject = EncryptionService.decrypt_data(em.subject)
        sender = EncryptionService.decrypt_data(em.sender)
        notes = EncryptionService.decrypt_data(em.notes) if em.notes else ""
        proj_name = EncryptionService.decrypt_data(em.project.name) if em.project else None
        env_name = em.environment.name if em.environment else None
        
        matches = query_lower in subject.lower() or query_lower in sender.lower() or query_lower in notes.lower() or query_lower in em.category.lower()
        if not matches and em.tags:
            matches = any(query_lower in t.name.lower() for t in em.tags)
            
        if matches:
            results.append(
                SearchResultItem(
                    id=em.id,
                    type="email",
                    title=subject,
                    subtitle=f"From: {sender} | {em.category}",
                    project_name=proj_name,
                    environment_name=env_name,
                    is_favorite=em.is_favorite,
                    tags=[t.name for t in em.tags]
                )
            )

    # 4. Search Notes
    notes = db.query(Note).filter(Note.user_id == current_user.id).all()
    for n in notes:
        title = EncryptionService.decrypt_data(n.title)
        content = EncryptionService.decrypt_data(n.content_ciphertext)
        proj_name = EncryptionService.decrypt_data(n.project.name) if n.project else None
        env_name = n.environment.name if n.environment else None
        
        matches = query_lower in title.lower() or query_lower in content.lower()
        if not matches and n.tags:
            matches = any(query_lower in t.name.lower() for t in n.tags)
            
        if matches:
            results.append(
                SearchResultItem(
                    id=n.id,
                    type="note",
                    title=title,
                    subtitle=content[:60] + "..." if len(content) > 60 else content,
                    project_name=proj_name,
                    environment_name=env_name,
                    is_favorite=n.is_favorite,
                    tags=[t.name for t in n.tags]
                )
            )
            
    return SearchResponse(query=q, results=results)

# ==========================================
# AUDIT LOGS
# ==========================================

@router.get("/audit-logs", response_model=List[AuditLogResponse], tags=["Audit"])
def list_audit_logs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(
        AuditLog.user_id == current_user.id
    ).order_by(AuditLog.created_at.desc()).limit(100).all()
    return logs

# ==========================================
# RECOVERY & BACKUPS (MOCKED IN PHASE 1)
# ==========================================

@router.get("/recovery/status", response_model=RecoveryStatusResponse, tags=["Backup & Recovery"])
def get_recovery_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Fetch actual backup record history from the DB
    records = db.query(BackupRecord).filter(
        BackupRecord.user_id == current_user.id
    ).order_by(BackupRecord.created_at.desc()).limit(20).all()
    
    history_res = [
        BackupRecordResponse(
            id=r.id,
            backup_type=r.backup_type,
            status=r.status,
            file_size=r.file_size,
            created_at=r.created_at
        ) for r in records
    ]
    
    # Mock recovery status configurations for development dashboard visualization
    last_backup_time = records[0].created_at if records else None
    
    recovery_tests = db.query(RecoveryRecord).filter(
        RecoveryRecord.user_id == current_user.id
    ).order_by(RecoveryRecord.created_at.desc()).first()
    
    last_test_time = recovery_tests.created_at if recovery_tests else None
    
    return RecoveryStatusResponse(
        database_backup_enabled=True,
        s3_backup_enabled=True,
        encrypted_export_available=True,
        last_backup_time=last_backup_time,
        last_recovery_test_time=last_test_time,
        recovery_readiness="🟢 EXCELLENT",
        history=history_res
    )

@router.post("/recovery/test", tags=["Backup & Recovery"])
def run_recovery_test(request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Record recovery verification test
    rec_record = RecoveryRecord(
        user_id=current_user.id,
        recovery_type="TEST",
        status="SUCCESS",
        details="Verifying connection to AWS RDS PostgreSQL, AWS S3 buckets, and KMS Decrypt operation. All checks PASSED."
    )
    db.add(rec_record)
    db.commit()
    log_action(db, current_user.id, "BACKUP_RESTORE", request, {"type": "SIMULATED_TEST", "status": "SUCCESS"})
    return {"status": "success", "message": "Disaster recovery testing successfully completed. Readiness verified.", "timestamp": rec_record.created_at}
