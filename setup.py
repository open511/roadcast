import os
import subprocess

from setuptools.command.install import install as DistInstall
from setuptools.command.develop import develop as DistDevelop
from setuptools import setup, find_packages

cwd = os.path.dirname(os.path.realpath(__file__))

def check_version(v):
    bits = [int(x) for x in v.decode('ascii').lstrip('v').strip().split('.')]
    return (bits[0] > 0 or bits[1] >= 8)

def run_grunt_build():
    proc = subprocess.Popen(['node', '-v'], stdout=subprocess.PIPE)
    if proc.wait() != 0 or not check_version(proc.stdout.read()):
        raise Exception("Building this package requires Node.JS 0.8 or greater.")

    proc = subprocess.Popen(['npm', 'install'], cwd=cwd)
    proc.communicate()
    if proc.returncode != 0:
        raise Exception("Couldn't run npm install. Please see any error messages above, and ensure that npm (the Node.JS package manager) is installed and in your path.")

    proc = subprocess.Popen([
            os.path.join(cwd, 'node_modules', 'grunt-cli', 'bin', 'grunt'),
            '--target=python'
        ], cwd=cwd)
    proc.communicate()
    if proc.returncode != 0:
        raise Exception("Error running the grunt build process.")

class CustomInstall(DistInstall):
    def run(self):
        run_grunt_build()
        DistInstall.run(self)

class CustomDevelop(DistDevelop):
    def run(self):
        run_grunt_build()
        DistDevelop.run(self)

setup(
    name = "roadcast",
    version = "0.1",
    url='',
    license = "",
    packages = find_packages(),
    include_package_data = True,
    install_requires = [
        'django-appconf==1.0.1',
    ],
    cmdclass = {
        'install': CustomInstall,
        'develop': CustomDevelop
    },
)
