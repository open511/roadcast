A Javascript browsing and editing interface for an Open511 Events API. Try it out at [demo.open511.org](http://demo.open511.org/).

# Installation

Our build process uses [Grunt](http://gruntjs.com). If your system doesn't already have Grunt installed, first install [Node.JS](http://nodejs.org/) (0.8 or greater), and then run `sudo npm install -g grunt-cli`.

Then go to the root folder of this repository, run `npm install` to download build dependencies, and then run `grunt` to build the application.

This should give you a folder called `dist`. You should be able to open `example.html` in that folder and see a working example.

# Python wrapper

This repository also includes an optional Django application wrapper that takes care of compiling and serving the JavaScript application. You can install it by running `python setup.py install` from within a copy of this repository, or running `pip install -e git+https://github.com/opennorth/open511-ui.git#egg=django_open511_ui` to download and install. You still need to have [Node.JS](http://nodejs.org/) 0.8 or greater installed for this to work, and setup.py will complain if you don't.

Once the package is installed, just add `url(r'^map/', include('django_open511_ui.urls')),` to `urls.py` in an existing Django project. You can also use [opennorth/open511_site](https://www.github.com/opennorth/open511_site) as a project template -- just install it, and this UI is included.
