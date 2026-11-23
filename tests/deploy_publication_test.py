import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('verification', Path(__file__).parents[1] / 'scripts/verify-publication.py')
verification = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verification)


class PublicationVerificationTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / 'assets').mkdir()
        self.html = b'<html><script src="/assets/index-12345678.js"></script><link href="/assets/index-12345678.css"></html>'
        (self.root / 'index.html').write_bytes(self.html)
        self.js = b'console.log("public build");'
        self.css = b'body{color: red}'
        (self.root / 'assets/index-12345678.js').write_bytes(self.js)
        (self.root / 'assets/index-12345678.css').write_bytes(self.css)

    def request(self, url):
        path = url.split('https://example.test', 1)[1].split('?', 1)[0]
        self.assertIn('advent_publication=', url)
        if '__advent_missing-' in path:
            return 404, {}, b''
        if path.endswith('.js'):
            return 200, {'Content-Type': 'text/javascript', 'Cache-Control': 'public, immutable'}, self.js
        if path.endswith('.css'):
            return 200, {'Content-Type': 'text/css', 'Cache-Control': 'public, immutable'}, self.css
        return 200, {'Content-Type': 'text/html', 'Cache-Control': 'no-store'}, self.html

    def test_uploaded_build_is_actually_public(self):
        self.assertEqual(len(verification.verify(self.root, 'https://example.test', self.request)), 16)

    def test_wrong_document_root_serves_old_html(self):
        def request(url):
            status, headers, body = self.request(url)
            return status, headers, b'<html>old build</html>' if body == self.html else body
        with self.assertRaisesRegex(verification.PublicationError, 'document root'):
            verification.verify(self.root, 'https://example.test', request)

    def test_missing_asset_must_not_return_html_200(self):
        def request(url):
            if url.split('?', 1)[0].endswith('.js'):
                return 200, {'Content-Type': 'text/html'}, self.html
            return self.request(url)
        with self.assertRaisesRegex(verification.PublicationError, 'MIME'):
            verification.verify(self.root, 'https://example.test', request)

    def test_deep_route_must_serve_the_same_build(self):
        def request(url):
            if '/task/4?' in url:
                return 404, {'Content-Type': 'text/html'}, b'not found'
            return self.request(url)
        with self.assertRaisesRegex(verification.PublicationError, 'history route'):
            verification.verify(self.root, 'https://example.test', request)

    def test_missing_static_file_must_be_true_404(self):
        def request(url):
            if '__advent_missing-' in url:
                return 200, {'Content-Type': 'text/html'}, self.html
            return self.request(url)
        with self.assertRaisesRegex(verification.PublicationError, 'must return 404'):
            verification.verify(self.root, 'https://example.test', request)

    def test_html_must_not_keep_old_cache_policy(self):
        def request(url):
            status, headers, body = self.request(url)
            return status, {key: value for key, value in headers.items() if key != 'Cache-Control'}, body
        with self.assertRaisesRegex(verification.PublicationError, 'no-store'):
            verification.verify(self.root, 'https://example.test', request)

    def test_assets_must_match_uploaded_bytes(self):
        def request(url):
            status, headers, body = self.request(url)
            return status, headers, b'old JS' if body == self.js else body
        with self.assertRaisesRegex(verification.PublicationError, 'asset differs'):
            verification.verify(self.root, 'https://example.test', request)
