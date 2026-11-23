#!/usr/bin/env python3
"""Publish assets before HTML; retain old chunks and atomically replace each file.

Requires the OpenSSH posix-rename extension. An unsupported server fails closed,
leaving the previous index.html in place. Never removes existing remote assets.
"""
import os
from pathlib import Path, PurePosixPath
import sys
import uuid

def deployment_root():
    destination = os.environ.get('SFTP_REMOTE_ROOT', '').rstrip('/')
    path = PurePosixPath(destination)
    if not destination or not path.is_absolute() or '..' in path.parts or destination == '/':
        raise ValueError('Set SFTP_REMOTE_ROOT to the domain document root in the workflow')
    return destination


def publish(sftp, source, destination):
    source = Path(source)
    files = [path for path in source.rglob('*') if path.is_file()]
    if not (source / 'index.html').is_file() or not (source / '.htaccess').is_file():
        raise ValueError('Build is incomplete')
    if any(path.is_symlink() for path in source.rglob('*')):
        raise ValueError('Build contains symlinks')

    def priority(path):
        relative = path.relative_to(source).as_posix()
        if relative == 'index.html':
            return (3, relative)
        if relative == '.htaccess':
            return (2, relative)
        return (0 if relative.startswith('assets/') else 1, relative)

    directories = {destination}
    for path in sorted(files, key=priority):
        remote = str(PurePosixPath(destination) / path.relative_to(source).as_posix())
        parents = list(PurePosixPath(remote).parent.parents)[::-1] + [PurePosixPath(remote).parent]
        for parent in parents:
            directory = str(parent)
            if directory in directories or not directory.startswith(destination + '/'):
                continue
            try:
                sftp.stat(directory)
            except OSError as error:
                if error.errno != 2:
                    raise
                sftp.mkdir(directory)
            directories.add(directory)
        temporary = remote + '.upload-' + uuid.uuid4().hex
        try:
            sftp.put(str(path), temporary, confirm=True)
            # SFTP v3 rename cannot replace an existing file atomically. Do not
            # implement this as remove(index) + rename: that creates an outage.
            sftp.posix_rename(temporary, remote)
        except Exception:
            try:
                sftp.remove(temporary)
            except OSError:
                pass
            raise
    print('Published build; previous fingerprinted assets retained.')


def main():
    destination = deployment_root()
    import paramiko
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    # Same trust-on-first-use policy as the previous accept-new SSH workflow.
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(os.environ['SFTP_HOST'], port=int(os.environ.get('SFTP_PORT') or 22),
                       username=os.environ['SFTP_USER'], password=os.environ['SFTP_PASSWORD'],
                       timeout=30, banner_timeout=30, auth_timeout=30,
                       allow_agent=False, look_for_keys=False)
        with client.open_sftp() as sftp:
            sftp.get_channel().settimeout(60)
            publish(sftp, Path('dist'), destination)
    finally:
        client.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Exceptions from SSH may contain connection details. Do not log them.
        print('SFTP publication failed (' + type(error).__name__ + '); index is only published after all assets.', file=sys.stderr)
        sys.exit(1)
