# First, run the Grunt build process
import os
import subprocess

cwd = os.path.dirname(os.path.realpath(__file__))

def check_version(v):
    bits = v.lstrip('v').strip().split('.')
    return (bits[0] > 0 or bits[1] >= 8)

proc = subprocess.Popen(['node', '-v'], stdout=subprocess.PIPE)
if proc.wait() != 0 or not check_version(proc.stdout.read()):
    raise Exception("Building this package requires Node.JS 0.8 or greater.")

proc = subprocess.Popen(['npm', 'install'], cwd=cwd)
proc.communicate()
if proc.returncode != 0:
    raise Exception("Couldn't run npm install. Please see any error messages above, and ensure that npm (the Node.JS package manager) is installed and in your path.")

proc = subprocess.Popen([
        os.path.join(cwd, 'node_modules', 'grunt-cli', 'bin', 'grunt'),
        'python-build'
    ], cwd=cwd)
proc.communicate()
if proc.returncode != 0:
    raise Exception("Error running the grunt build process.")


from setuptools import setup
setup(
    name = "open511_ui",
    version = "0.1",
    url='',
    license = "",
    packages = [
        'open511_ui',
    ],
    install_requires = [
        'webassets>=0.7.1',
        'django-appconf==0.5',
    ]
)
