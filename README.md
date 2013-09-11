A Javascript browsing and editing interface for an Open511 Events API. Try it out at [demo.open511.org](http://demo.open511.org/).

[![Build Status](https://travis-ci.org/opennorth/open511-ui.png)](https://travis-ci.org/opennorth/open511-ui)

# Installation

Our build process uses [Grunt](http://gruntjs.com). If your system doesn't already have Grunt installed, first install [Node.JS](http://nodejs.org/) (0.8 or greater), and then run `sudo npm install -g grunt-cli`.

Then go to the root folder of this repository, run `npm install` to download build dependencies, and then run `grunt` to build the application.

This should give you a folder called `dist`. You should be able to open `example.html` in that folder and see a working example.

# Python wrapper

This repository also includes an optional Django application wrapper that takes care of compiling and serving the JavaScript application. You can install it by running `python setup.py install` from within a copy of this repository, or running `pip install -e git+https://github.com/opennorth/open511-ui.git#egg=django_open511_ui` to download and install. You still need to have [Node.JS](http://nodejs.org/) 0.8 or greater installed for this to work, and setup.py will complain if you don't.

Once the package is installed, just add `url(r'^map/', include('django_open511_ui.urls')),` to `urls.py` in an existing Django project. You can also use [opennorth/open511_site](https://www.github.com/opennorth/open511_site) as a project template -- just install it, and this UI is included.

# License

Copyright (C) 2013 Open North

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see http://www.gnu.org/licenses/
