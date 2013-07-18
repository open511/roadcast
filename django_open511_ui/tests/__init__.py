from __future__ import unicode_literals

import datetime
import time

from django_open511_ui.test_utils import BrowserTestCase


class IntegrationTests(BrowserTestCase):

    fixtures = ['o5ui_base']
    
    # Smoke tests
    def test_page_load(self):
        self.go_home()
        self.css('.infopane .blurb')

    def test_js_injection(self):
        self.go_home()
        self.assertEquals(self.js('return window.browser_testing;'), 'indeed')

    def test_create_event(self):
        self.assertEquals(len(self.get_all_events()['content']), 0)
        self.go_home()
        self.log_in('testuser', 'testuser')
        self.css('.create-new-event').click()
        self.css('[data-fieldname="headline"] textarea').send_keys('Head Line')
        self.css('[data-fieldname="severity"] select option:last-child').click()
        self.css('[data-fieldname="geography"] .draw-point').click()
        self.css('.mappane').click()
        self.css('li[data-tab=schedule] a').click()
        self.css('[data-fieldname="schedule/start_date"] input').click()
        time.sleep(0.1)
        self.css('.datepicker .active').click()
        self.css('.save-button').click()
        time.sleep(1)
        all_events = self.get_all_events()['content']
        self.assertEquals(len(all_events), 1)
        event = all_events[0]
        event.pop('geography') # these will all change
        event.pop('created')
        event.pop('updated')
        self.maxDiff = 1000 # better error reporting if the next assert fails
        self.assertEquals(all_events[0], {
            'id': 'test.open511.org/1',
            'headline': 'Head Line',
            'event_type': 'CONSTRUCTION',
            'severity': '9',
            'status': 'ACTIVE',
            'url': '/api/events/test.open511.org/1/',
            'jurisdiction_url': 'http://test/api/jurisdictions/test.open511.org/',
            'schedule': {'start_date': unicode(datetime.date.today())}
        })
