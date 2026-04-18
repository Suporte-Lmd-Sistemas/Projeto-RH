from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, decode_access_token
from app.database.erp_connection import get_erp_db
from app.services.auth_service import autenticar_usuario_erp

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/login")
def login(payload: dict, db: Session = Depends(get_erp_db)):
    login_value = str(payload.get("login", "")).strip()
    senha_value = str(payload.get("senha", "")).strip()

    if not login_value or not senha_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Login e senha são obrigatórios"
        )

    user = autenticar_usuario_erp(db, login_value, senha_value)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha inválidos"
        )

    access_token = create_access_token({
        "sub": str(user["id"]),
        "login": user["login"],
        "nome": user["nome"],
        "perfil": user["perfil"],
    })

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me")
def me(authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token não informado"
        )

    token = authorization.replace("Bearer ", "").strip()
    payload = decode_access_token(token)

    return {
        "id": int(payload["sub"]),
        "login": payload["login"],
        "nome": payload["nome"],
        "perfil": payload["perfil"],
    }