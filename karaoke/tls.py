"""TLS trust-store setup.

The Python shipped by python.org (the usual way to get Python 3 on a Mac that
has no Xcode tools) does not read the macOS keychain. Until its bundled
"Install Certificates.command" is run, its trust store is empty and every HTTPS
request fails with CERTIFICATE_VERIFY_FAILED. Rather than make that Apple's
problem to explain, we ship certifi and point Python at it when the system store
comes up empty.
"""

from __future__ import annotations

import os
import ssl


def system_ca_count() -> int:
    """How many CA certificates Python's default trust store holds."""
    try:
        return ssl.create_default_context().cert_store_stats().get("x509_ca", 0)
    except Exception:
        return 0


def ensure_ca_bundle() -> str | None:
    """Fall back to certifi's bundle when the system store is empty.

    Returns the bundle that was installed, or ``None`` when the system store is
    already usable (Linux, and macOS with Apple's own Python). Must run before
    the first HTTPS request: OpenSSL reads ``SSL_CERT_FILE`` when a context is
    built, so setting it later has no effect on contexts already created.
    """
    if system_ca_count() > 0:
        return None

    try:
        import certifi
    except ImportError:
        return None

    bundle = certifi.where()
    os.environ.setdefault("SSL_CERT_FILE", bundle)
    os.environ.setdefault("REQUESTS_CA_BUNDLE", bundle)
    return bundle
