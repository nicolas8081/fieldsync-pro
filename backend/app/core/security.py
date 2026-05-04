import bcrypt

# bcrypt only uses the first 72 bytes of UTF-8 input
_BCRYPT_MAX = 72


def _password_bytes(plain: str) -> bytes:
    b = plain.encode("utf-8")
    if len(b) > _BCRYPT_MAX:
        return b[:_BCRYPT_MAX]
    return b


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_password_bytes(plain), bcrypt.gensalt()).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("ascii"))
    except (ValueError, TypeError):
        return False
