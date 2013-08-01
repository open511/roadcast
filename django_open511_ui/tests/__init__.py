from __future__ import unicode_literals

import datetime
import time

from django_open511_ui.conf import settings
from django_open511_ui.test_utils import BrowserTestCase


class IntegrationTests(BrowserTestCase):

    fixtures = ['o5ui_base']

    maxDiff = None
    
    # Smoke tests
    def test_page_load(self):
        self.go_home()
        self.css('.infopane .blurb')

    def test_js_injection(self):
        self.go_home()
        self.assert_js('return window.browser_testing;', 'indeed')
        if settings.OPEN511_UI_TEST_BROWSER == 'phantomjs':
            # https://github.com/ariya/phantomjs/issues/11384
            self.assert_js('return Backbone.emulateHTTP;', True)

    def _fill_in_event(self, headline='xxx'):
        self.css('[data-fieldname="headline"] textarea').send_keys(headline)
        self.css('[data-fieldname="severity"] select option:last-child').click()
        self.css('[data-fieldname="geography"] .draw-point').click()
        self.css('.mappane').click()
        self.css('li[data-tab=schedule] a').click()
        time.sleep(0.2)
        self.css('[data-fieldname="schedule/start_date"] input').click()
        self.css('.datepicker .active').click()
        self.css('li[data-tab=basics] a').click()

    def test_create_event(self):
        self.assertEquals(len(self.get_all_events()['content']), 0)
        self.go_home()
        self.log_in('testuser', 'testuser')
        self.css('.create-new-event').click()
        self._fill_in_event(headline='Head Line')
        self.css('.save-button').click()
        time.sleep(1)
        all_events = self.get_all_events()['content']
        self.assertEquals(len(all_events), 1)
        event = all_events[0]
        event.pop('geography') # these will vary, don't test their contents
        event.pop('created')
        event.pop('updated')
        assert event.pop('id').startswith('test.open511.org/')
        assert event.pop('url')
        self.assertEquals(event, {
            'headline': 'Head Line',
            'event_type': 'CONSTRUCTION',
            'severity': 'UNKNOWN',
            'status': 'ACTIVE',
            'jurisdiction_url': 'http://test/api/jurisdictions/test.open511.org/',
            'schedule': {'start_date': unicode(datetime.date.today())}
        })

    def test_published(self):
        self.assertEquals(len(self.get_all_events()['content']), 0)
        self.go_home()
        self.log_in('testuser', 'testuser')
        self.css('.create-new-event').click()
        self._fill_in_event()
        self.css('[data-fieldname="!publish_on"] input[type="checkbox"]').click()
        self.css('.save-button').click()
        time.sleep(0.7)
        self.assertEquals(len(self.get_all_events()['content']), 0)
        self.css('.event-detail .unpublished')
        self.css('.edit-event').click()
        self.css('.publish-now').click()
        self.css('.save-button').click()
        time.sleep(0.7)
        self.assertEquals(len(self.get_all_events()['content']), 1)
        self.assert_not_css('.event-detail .unpublished')
