# Requires that 'po2json' be installed and in $PATH
# https://github.com/Getty/p5-locale-simple/blob/master/bin/po2json

from glob import glob
import os
import re
import subprocess

JS_TEMPLATE = """window.O5 = window.O5 || {};

O5.i18n = new SimpleI18N({
    locale_data: {
        messages: %s
    }
});
O5.language = "%s";
"""

I18N_DIR = os.path.dirname(os.path.realpath(__file__))

for po_filename in glob(I18N_DIR + "/*.po"):
    json = subprocess.check_output(["po2json", po_filename])
    lang = os.path.basename(po_filename).split('.')[0]
    with open(lang + '.js', 'w') as f:
        f.write(JS_TEMPLATE % (json, lang))
