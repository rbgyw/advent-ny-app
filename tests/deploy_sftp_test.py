import errno
import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).parents[1] / 'scripts/deploy-sftp.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class Sftp:
    def __init__(self, fail=None):
        self.files = {'/site/index.html': b'old index', '/site/assets/old-12345678.js': b'old module'}
        self.published = []
        self.fail = fail

    def stat(self, path):
        raise FileNotFoundError(errno.ENOENT, 'missing')

    def mkdir(self, path):
        pass

    def put(self, local, remote, confirm):
        if Path(local).name == self.fail:
            raise OSError('interrupted transfer')
        self.files[remote] = Path(local).read_bytes()

    def posix_rename(self, source, destination):
        if self.fail == 'rename':
            raise OSError('extension unsupported')
        self.files[destination] = self.files.pop(source)
        self.published.append(destination)

    def remove(self, remote):
        self.files.pop(remote, None)


class PublicationTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        for name, text in {'assets/new-87654321.js': 'new module', 'collections/videos.json': '[]',
                           '.htaccess': 'rewrite', 'index.html': 'new index'}.items():
            path = self.root / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(text)

    def test_assets_first_atomic_index_last_and_old_tabs_still_work(self):
        sftp = Sftp()
        deploy.publish(sftp, self.root, '/site')
        self.assertEqual(sftp.published, ['/site/assets/new-87654321.js', '/site/collections/videos.json', '/site/.htaccess', '/site/index.html'])
        self.assertEqual(sftp.files['/site/assets/old-12345678.js'], b'old module')
        self.assertEqual(sftp.files['/site/index.html'], b'new index')
        self.assertFalse(any('.upload-' in path for path in sftp.files))

    def test_failed_transfer_keeps_old_index(self):
        sftp = Sftp(fail='new-87654321.js')
        with self.assertRaises(OSError):
            deploy.publish(sftp, self.root, '/site')
        self.assertEqual(sftp.files['/site/index.html'], b'old index')
        self.assertFalse(any('.upload-' in path for path in sftp.files))

    def test_no_unsafe_delete_then_rename_fallback(self):
        sftp = Sftp(fail='rename')
        with self.assertRaises(OSError):
            deploy.publish(sftp, self.root, '/site')
        self.assertEqual(sftp.files['/site/index.html'], b'old index')
        self.assertEqual(sftp.files['/site/assets/old-12345678.js'], b'old module')
