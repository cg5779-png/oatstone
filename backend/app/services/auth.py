from datetime import datetime, timedelta, timezone

import hmac
import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import ADMIN_PASSWORD, ADMIN_USERNAME, JWT_EXPIRE_HOURS, JWT_SECRET

bearer = HTTPBearer(auto_error=False)


def verify_credentials(username: str, password: str) -> bool:
    if not ADMIN_PASSWORD or not JWT_SECRET:
        return False
    user_ok = hmac.compare_digest(username, ADMIN_USERNAME)
    pass_ok = hmac.compare_digest(password, ADMIN_PASSWORD)
    return user_ok and pass_ok


def create_access_token(username: str) -> str:
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="관리자 인증이 설정되지 않았습니다. backend/.env에 JWT_SECRET을 입력해 주세요.")
    payload = {
        "sub": username,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


def decode_access_token(token: str) -> str:
    if not JWT_SECRET:
        raise HTTPException(status_code=503, detail="관리자 인증이 설정되지 않았습니다. backend/.env에 JWT_SECRET을 입력해 주세요.")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.") from exc

    username = payload.get("sub")
    if not username or not hmac.compare_digest(str(username), ADMIN_USERNAME):
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return str(username)


def get_current_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="로그인이 필요합니다.")
    return decode_access_token(credentials.credentials)
