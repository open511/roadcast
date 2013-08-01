import json
from urlparse import urljoin

from django_open511_ui.conf import settings
from django.core import urlresolvers
from django.test import LiveServerTestCase
from django.test.utils import override_settings
from django.utils.safestring import mark_safe


def get_driver():
    if settings.OPEN511_UI_TEST_BROWSER == 'phantomjs':
        from selenium.webdriver.phantomjs.webdriver import WebDriver
    else:
        from selenium.webdriver.firefox.webdriver import WebDriver

    driver = WebDriver()
    driver.implicitly_wait(5)
    driver.set_window_size(1000, 700)
    return driver

@override_settings(STATICFILES_STORAGE='django.contrib.staticfiles.storage.StaticFilesStorage',
    OPEN511_BASE_URL='http://test',
    OPEN511_UI_SHOW_LOGIN_BUTTON=True,
    LANGUAGE_CODE='en',
    TEMPLATE_CONTEXT_PROCESSORS=settings.TEMPLATE_CONTEXT_PROCESSORS + (
    'django_open511_ui.test_utils.context_processor',))
class BrowserTestCase(LiveServerTestCase):

    @classmethod
    def setUpClass(cls):
        cls.br = get_driver()
        super(BrowserTestCase, cls).setUpClass()

    @classmethod
    def tearDownClass(cls):
        cls.br.quit()
        super(BrowserTestCase, cls).tearDownClass()

    def tearDown(self):
        self.assert_no_js_errors()
        super(BrowserTestCase, self).tearDown()

    def go(self, relative_url):
        return self.br.get(urljoin(self.live_server_url, relative_url))

    def go_home(self):
        return self.go(urlresolvers.reverse('o5ui_home'))

    def css(self, selector):
        return self.br.find_element_by_css_selector(selector)

    def js(self, script):
        return self.br.execute_script(script)

    def assert_js(self, script, returns):
        self.assertEquals(self.js(script), returns)

    def assert_no_js_errors(self):
        self.assert_js('return window.jsErrors;', [])

    def assert_not_css(self, css):
        self.assert_js("return $('" + css + "').length", 0)

    def log_in(self, username, password):
        self.css('.auth .log-in').click()
        self.css('#id_username').send_keys(username)
        p = self.css('#id_password')
        p.send_keys(password)
        p.submit()
        self.css('.auth .log-out')

    def get_all_events(self):
        url = urlresolvers.reverse('open511_roadevent_list')
        resp = self.client.get(url, {'format': 'json'})
        return json.loads(resp.content)


def context_processor(request):
    script_body = """
        window.browser_testing = 'indeed';
        window.jsErrors = [];
        window.onerror = function(msg) {
            window.jsErrors.push(msg);
        };"""
    if settings.OPEN511_UI_TEST_BROWSER == 'phantomjs':
        # https://github.com/ariya/phantomjs/issues/11384
        script_body += "window.onload = function() { Backbone.emulateHTTP = true; };"
    return {
        'inject_for_testing': mark_safe(
            "<script>%s</script>" % script_body)
    }
