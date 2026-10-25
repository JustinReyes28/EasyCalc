"""Offline browser regression checks. Requires an already installed Playwright and Chrome."""
from pathlib import Path
import argparse
from datetime import datetime
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--screenshots', type=Path, help='Optional local screenshot output folder')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
if args.screenshots:
    args.screenshots.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True, args=['--disable-background-networking', '--disable-component-update'])
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, timezone_id='Asia/Singapore', reduced_motion='reduce')
    external_requests = []
    errors = []

    def offline(route):
        if route.request.url.startswith(('file:', 'data:', 'about:')):
            route.continue_()
        else:
            external_requests.append(route.request.url)
            route.abort()

    context.route('**/*', offline)
    page = context.new_page()
    page.on('pageerror', lambda error: errors.append(str(error)))

    def visit(name):
        page.goto((root / name).as_uri())
        page.wait_for_load_state('networkidle')

    def screenshot(name):
        if args.screenshots:
            page.screenshot(path=str(args.screenshots / f'{name}.png'), full_page=True)

    def fits():
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Horizontal overflow'

    visit('index.html')
    expect(page.locator('.calculator-card')).to_have_count(6)
    screenshot('landing-desktop')
    for size in [(320, 740), (375, 812), (844, 390), (1280, 1000)]:
        page.set_viewport_size({'width': size[0], 'height': size[1]})
        fits()
    page.set_viewport_size({'width': 375, 'height': 812})
    screenshot('landing-mobile')
    page.get_by_role('link', name='Arithmetic', exact=True).click()
    expect(page).to_have_title('Arithmetic Calculator - EasyCalc')
    display = page.get_by_label('Expression', exact=True)
    display.fill('2+3*4')
    display.press('Enter')
    expect(display).to_have_value('14')
    display.press('4')
    expect(display).to_have_value('4')
    display.press('Escape')
    for name in ['2', 'Add', '3', 'Calculate result']:
        page.get_by_role('button', name=name, exact=True).click()
    expect(display).to_be_focused()
    display.press('7')
    expect(display).to_have_value('7')
    display.press('+')
    display.press('3')
    display.press('Enter')
    expect(display).to_have_value('10')
    display.fill('1/0')
    display.press('Enter')
    expect(display).to_have_value('1/0')
    expect(display).to_have_attribute('aria-invalid', 'true')
    expect(page.get_by_role('status')).to_contain_text('divide by zero')
    display.fill('9+1')
    page.wait_for_timeout(2100)  # An old delayed-error clear must never erase new input.
    expect(display).to_have_value('9+1')
    display.press('Enter')
    page.get_by_role('button', name='Previous answer').click()
    page.get_by_role('button', name='Multiply', exact=True).click()
    page.get_by_role('button', name='2', exact=True).click()
    page.get_by_role('button', name='Calculate result').click()
    expect(display).to_have_value('20')
    display.fill('12+34')
    display.evaluate('(input) => input.setSelectionRange(0, 2)')
    page.get_by_role('button', name='9', exact=True).click()
    expect(display).to_have_value('9+34')
    display.press('Enter')
    expect(display).to_have_value('43')
    screenshot('arithmetic-mobile')

    visit('scientific.html')
    display = page.get_by_label('Expression', exact=True)
    for expression, result in [('pi', '3.14159265359'), ('e', '2.71828182846'), ('sin(cos(0)*30)', '0.5'), ('(2+3)!', '120')]:
        display.fill(expression)
        display.press('Enter')
        expect(display).to_have_value(result)
    display.fill('2+3')
    page.get_by_role('button', name='Cube the expression').click()
    page.get_by_role('button', name='Calculate result').click()
    expect(display).to_have_value('125')
    display.fill('2+3')
    page.get_by_role('button', name='Square the expression').click()
    display.press('Enter')
    expect(display).to_have_value('25')
    page.get_by_label('Angles').select_option('rad')
    display.fill('sin(pi/2)')
    display.press('Enter')
    expect(display).to_have_value('1')
    for width, height in [(320, 740), (375, 812), (844, 390), (1280, 1000)]:
        page.set_viewport_size({'width': width, 'height': height})
        fits()
        assert page.locator('.btn').evaluate_all('(buttons) => buttons.every(b => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44)')
        if width in (375, 1280): screenshot(f'scientific-{width}')

    visit('gwa.html')
    page.evaluate('localStorage.clear()')
    page.reload(wait_until='networkidle')
    expect(page.locator('.course-row')).to_have_count(1)
    page.get_by_label('Grade for course 1', exact=True).fill('1.5')
    page.get_by_label('Units for course 1', exact=True).fill('3')
    page.get_by_role('button', name='Calculate GWA', exact=True).click()
    expect(page.locator('#gwa-result')).to_contain_text('1.50')
    page.get_by_role('button', name='Add Course', exact=True).click()
    page.get_by_label('Grade for course 2', exact=True).fill('2')
    page.reload(wait_until='networkidle')
    expect(page.locator('.course-row')).to_have_count(2)
    expect(page.get_by_label('Grade for course 2', exact=True)).to_have_value('2')
    page.get_by_label('Units for course 2', exact=True).fill('3')
    page.reload(wait_until='networkidle')
    expect(page.get_by_label('Units for course 2', exact=True)).to_have_value('3')
    page.get_by_role('button', name='Calculate GWA', exact=True).click()
    expect(page.locator('#gwa-result')).to_contain_text('1.75')
    page.evaluate("localStorage.setItem('gwaCalculatorData', '{broken'); localStorage.setItem('gwaCalculatorHistory', '{}')")
    page.reload(wait_until='networkidle')
    expect(page.locator('.course-row')).to_have_count(1)
    page.evaluate('localStorage.clear()')

    visit('health.html')
    page.locator('#waist').fill('88.9')
    page.locator('#neck').fill('38.1')
    page.locator('#height-bodyfat').fill('177.8')
    page.get_by_role('button', name='Calculate Body Fat', exact=True).click()
    expect(page.locator('#bodyfat-result')).to_have_text('Estimated Body Fat: 19.4%')
    page.locator('#gender').select_option('female')
    page.locator('#waist').fill('76.2')
    page.locator('#hip').fill('96.52')
    page.locator('#neck').fill('33.02')
    page.locator('#height-bodyfat').fill('165.1')
    page.get_by_role('button', name='Calculate Body Fat', exact=True).click()
    expect(page.locator('#bodyfat-result')).to_have_text('Estimated Body Fat: 28.6%')
    page.locator('#neck').fill('200')
    page.get_by_role('button', name='Calculate Body Fat', exact=True).click()
    expect(page.locator('#bodyfat-result')).to_contain_text('greater than zero')

    for zone in ['Asia/Singapore', 'America/Los_Angeles']:
        date_context = browser.new_context(timezone_id=zone)
        date_context.route('**/*', offline)
        date_page = date_context.new_page()
        date_page.on('pageerror', lambda error: errors.append(str(error)))
        date_page.clock.install(time=datetime.fromisoformat('2026-10-24T16:30:00+00:00'))
        date_page.goto((root / 'datetime.html').as_uri())
        date_page.wait_for_load_state('networkidle')
        today = '2026-10-25' if zone == 'Asia/Singapore' else '2026-10-24'
        yesterday = '2026-10-24' if zone == 'Asia/Singapore' else '2026-10-23'
        expect(date_page.locator('#anniversary-date')).to_have_value(today)
        date_page.get_by_role('button', name='Days Until Event', exact=True).click()
        expect(date_page.locator('#countdown-result')).to_have_text('Today is the event!')
        date_page.locator('#anniversary-date').fill(yesterday)
        date_page.get_by_role('button', name='Days Until Event', exact=True).click()
        expect(date_page.locator('#countdown-result')).to_contain_text('1 day(s) ago')
        expect(date_page.locator('#to-timezone')).to_have_value('UTC')
        date_page.get_by_role('button', name='Convert', exact=True).click()
        expect(date_page.locator('#timezone-result')).to_contain_text('UTC')
        birthday = '2000-10-25'
        date_page.locator('#birth-date').fill(birthday)
        date_page.get_by_role('button', name='Calculate Age', exact=True).click()
        expect(date_page.locator('#age-result')).to_have_text('You are 26 years old' if zone == 'Asia/Singapore' else 'You are 25 years old')
        date_context.close()

    no_js = browser.new_context(java_script_enabled=False)
    no_js.route('**/*', offline)
    no_js_page = no_js.new_page()
    no_js_page.goto((root / 'index.html').as_uri())
    expect(no_js_page.locator('.calculator-card')).to_have_count(6)
    expect(no_js_page.get_by_role('link', name='Scientific', exact=True)).to_be_visible()
    no_js.close()
    assert not errors, errors
    assert not external_requests, external_requests
    browser.close()
    print('PASS: landing, calculator keyboard/caret/errors/Ans, scientific math/angles, responsive touch targets, GWA persistence, body-fat units, and dates in two time zones. Zero external requests or page errors.')
