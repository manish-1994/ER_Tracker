from pydantic import BaseModel
from typing import List, Optional


class PermissionSchema(BaseModel):
    id: Optional[int]
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleSchema(BaseModel):
    id: Optional[int]
    name: str
    description: Optional[str] = None
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True


class UserCreateSchema(BaseModel):
    username: str
    password: str


class UserSchema(BaseModel):
    id: Optional[int]
    username: str
    is_active: bool
    roles: List[RoleSchema] = []

    class Config:
        from_attributes = True
