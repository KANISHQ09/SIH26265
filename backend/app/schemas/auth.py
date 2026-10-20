from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.enums import UserRole


class LoginRequest(BaseModel):
    email: str
    password: str


class MFAVerifyRequest(BaseModel):
    user_id: str
    code: str


class MFASetupResponse(BaseModel):
    secret: str
    otpauth_url: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserResponse"


from pydantic import BaseModel, ConfigDict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    institution_id: Optional[str] = None
    mfa_enabled: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class RefreshTokenRequest(BaseModel):
    refresh_token: str
