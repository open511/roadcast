# Requires that 'po2json' be installed and in $PATH
# http://search.cpan.org/~getty/Locale-Simple-0.011/bin/po2json

from glob import glob
import os
import re
import subprocess

JS_TEMPLATE = """window.O5 = window.O5 || {};

O5.i18n = new Jed({
    locale_data: {
        messages: %s
    }
});
O5._t = function(s) { return O5.i18n.gettext(s); };
"""

I18N_DIR = os.path.dirname(os.path.realpath(__file__))

for po_filename in glob(I18N_DIR + "/*.po"):
    json = subprocess.check_output(["po2json", po_filename])
    with open(re.sub(r'\.po$', '.js', po_filename), 'w') as f:
        f.write(JS_TEMPLATE % json)
