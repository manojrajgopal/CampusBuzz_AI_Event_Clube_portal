import numpy as np
from routes.auth_routes import cosine_similarity_list, encrypt_bytes, decrypt_bytes, FERNET


def test_cosine_similarity_same():
    a = [1.0, 0.0, 0.0]
    b = [1.0, 0.0, 0.0]
    assert abs(cosine_similarity_list(a, b) - 1.0) < 1e-6


def test_cosine_similarity_orthogonal():
    a = [1.0, 0.0, 0.0]
    b = [0.0, 1.0, 0.0]
    assert abs(cosine_similarity_list(a, b)) < 1e-6


def test_encrypt_decrypt_roundtrip():
    data = b"hello face"
    enc = encrypt_bytes(data)
    dec = decrypt_bytes(enc)
    assert dec == data
