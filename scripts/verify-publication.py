#!/usr/bin/env python3
"""Read-only HTTP verification of the build actually served by the public domain."""
import argparse
import hashlib
from pathlib import Path
import re
import sys
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen


class PublicationError(Exception):
    pass


def fetch(url):
    request = Request(url, headers={'Cache-Control': 'no-cache', 'User-Agent': 'Advent-publication-check'})
    try:
        with urlopen(request, timeout=20) as response:
            return response.status, response.headers, response.read(2 * 1024 * 1024)
    except HTTPError as error:
        return error.code, error.headers, b''


def verify(source, origin, request=fetch):
    source = Path(source)
    expected = (source / 'index.html').read_bytes()
    fingerprint = hashlib.sha256(expected).hexdigest()[:16]
    origin = origin.rstrip('/')

    def get(path):
        return request(origin + path + '?advent_publication=' + fingerprint)

    for path in ['/', '/calendar', '/auth', '/task/4']:
        status, headers, actual = get(path)
        if status != 200 or 'text/html' not in headers.get('Content-Type', '').lower():
            raise PublicationError('Public HTML/history route unavailable: ' + path)
        if actual != expected:
            raise PublicationError('Public HTML differs from the uploaded build. Check the domain document root and cache; SFTP success does not confirm publication.')
        if 'no-store' not in headers.get('Cache-Control', '').lower():
            raise PublicationError('Public HTML is missing Cache-Control: no-store; check that the domain uses the uploaded .htaccess.')

    assets = set(re.findall(rb'(?:src|href)="(/assets/[\w.-]+\.(?:js|css))"', expected))
    if not assets:
        raise PublicationError('Build has no production JS/CSS references.')
    for asset in sorted(assets):
        path = asset.decode('ascii')
        status, headers, actual = get(path)
        allowed = ('javascript', 'ecmascript') if path.endswith('.js') else ('text/css',)
        if status != 200 or not any(mime in headers.get('Content-Type', '').lower() for mime in allowed):
            raise PublicationError('Public asset is unavailable or has the wrong MIME type: ' + path)
        if actual != (source / path.lstrip('/')).read_bytes():
            raise PublicationError('Public asset differs from the uploaded build: ' + path)
        if 'immutable' not in headers.get('Cache-Control', '').lower():
            raise PublicationError('Fingerprint asset cache headers are missing: ' + path)

    missing = '/assets/__advent_missing-' + fingerprint[:8] + '.js'
    status, _headers, _body = get(missing)
    if status != 404:
        raise PublicationError('Missing static files must return 404, not the SPA HTML.')
    return fingerprint


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dist', default='dist')
    parser.add_argument('--url', default='https://geropharm-advent.ru')
    args = parser.parse_args()
    for attempt in range(3):
        try:
            fingerprint = verify(args.dist, args.url)
            print('Verified public build ' + fingerprint + ': HTML, history routes, JS/CSS, cache headers and static 404.')
            return
        except Exception as error:
            if attempt == 2:
                # Our own exceptions contain only public static paths; network
                # errors may contain proxy/connection details and are redacted.
                message = str(error) if isinstance(error, PublicationError) else type(error).__name__
                print('Public publication verification failed: ' + message, file=sys.stderr)
                sys.exit(1)
            time.sleep(2)


if __name__ == '__main__':
    main()
