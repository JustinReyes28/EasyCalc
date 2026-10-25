"""Offline history regression checks using installed Playwright and Chrome."""
from pathlib import Path
from mimetypes import guess_type
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright, expect

root = Path(__file__).resolve().parents[1]
key = 'easycalc.calculationHistory.v1'

with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True, args=['--disable-background-networking', '--disable-component-update'])
    context = browser.new_context(viewport={'width': 375, 'height': 812}, reduced_motion='reduce')
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

    def calculate(expression, expected):
        display = page.get_by_label('Expression', exact=True)
        display.fill(expression)
        display.press('Enter')
        expect(display).to_have_value(expected)

    for name in ['arithmetic.html', 'scientific.html']:
        visit(name)
        page.evaluate('localStorage.clear()')
        page.reload(wait_until='networkidle')
        summary = page.locator('#calculation-history summary')
        expect(page.locator('#calculation-history')).not_to_have_attribute('open', '')
        expect(page.locator('#history-count')).to_have_text('(0)')
        summary.focus()
        summary.press('Enter')
        expect(page.locator('#calculation-history')).to_have_attribute('open', '')
        expect(page.get_by_role('status')).to_have_text('')
        expect(page.locator('#history-empty')).to_be_visible()
        calculate('2+3', '5')
        calculate('ans*2', '10')
        calculate('100', '100')
        expect(page.locator('.history-entry')).to_have_count(3)
        row = page.locator('.history-entry').filter(has=page.locator('.history-expression', has_text='ans*2'))
        row.get_by_role('button').focus()
        row.get_by_role('button').press('Enter')
        display = page.get_by_label('Expression', exact=True)
        expect(display).to_have_value('10')
        expect(display).to_be_focused()
        expect(page.get_by_role('button', name='Copy result', exact=True)).to_be_enabled()
        expect(page.locator('.history-entry')).to_have_count(3)
        display.press('+')
        display.press('3')
        display.press('Enter')
        expect(display).to_have_value('13')
        calculate('ans+1', '14')
        before = page.locator('.history-entry').count()
        calculate('1/0', '1/0')
        expect(display).to_have_attribute('aria-invalid', 'true')
        expect(page.locator('.history-entry')).to_have_count(before)
        page.locator('.history-entry').first.get_by_role('button').click()
        expect(display).not_to_have_attribute('aria-invalid', 'true')
        expect(display).to_have_value('14')
        calculate('9+1', '10')
        page.reload(wait_until='networkidle')
        expect(page.locator('#history-count')).to_have_text('(6)')
        page.locator('#calculation-history summary').click()
        expect(page.locator('.history-entry').first.locator('.history-expression')).to_have_text('9+1')
        for i in range(25):
            calculate(f'{i}+1', str(i + 1))
        expect(page.locator('.history-entry')).to_have_count(20)
        expect(page.locator('.history-entry').last.locator('.history-expression')).to_have_text('5+1')
        page.reload(wait_until='networkidle')
        page.locator('#calculation-history summary').click()
        expect(page.locator('.history-entry')).to_have_count(20)
        for width, height in [(320, 740), (375, 812), (844, 390), (1280, 1000)]:
            page.set_viewport_size({'width': width, 'height': height})
            assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'History overflows viewport'
            assert page.locator('.history-button:visible').evaluate_all('(buttons) => buttons.every(b => b.getBoundingClientRect().height >= 44)')
        page.get_by_role('button', name='Clear history', exact=True).click()
        expect(page.locator('#history-count')).to_have_text('(0)')
        expect(page.locator('#calculation-history summary')).to_be_focused()
        page.reload(wait_until='networkidle')
        expect(page.locator('#history-count')).to_have_text('(0)')
        page.evaluate('(key) => localStorage.setItem(key, "{broken")', key)
        page.reload(wait_until='networkidle')
        expect(page.locator('#history-count')).to_have_text('(0)')
        calculate('8*8', '64')
        expect(page.locator('#history-count')).to_have_text('(1)')

    page.get_by_label('Angles').select_option('rad')
    calculate('sin(pi/2)', '1')
    page.locator('#calculation-history summary').click()
    expect(page.locator('.history-entry').first.locator('.history-mode')).to_have_text('RAD')
    page.get_by_label('Angles').select_option('deg')
    page.locator('.history-entry').first.get_by_role('button').click()
    expect(page.get_by_label('Expression', exact=True)).to_have_value('1')
    # Malicious stored expressions remain inert text in the history UI.
    page.evaluate('''(key) => localStorage.setItem(key, JSON.stringify({version: 1, entries: [{expression: '<img src=x onerror="window.historyInjected=true">', result: 9, mode: null}]}))''', key)
    page.reload(wait_until='networkidle')
    page.locator('#calculation-history summary').click()
    expect(page.locator('.history-expression')).to_contain_text('<img')
    expect(page.locator('#history-list img')).to_have_count(0)
    assert page.evaluate('window.historyInjected === undefined')

    # Serve the local files through Playwright routing under one synthetic origin.
    # No HTTP server, DNS lookup, or network response is used.
    shared = browser.new_context(viewport={'width': 375, 'height': 812})

    def local_app(route):
        url = route.request.url
        if url.startswith('https://easycalc.test/'):
            asset = root / urlsplit(url).path.lstrip('/')
            if asset.parent == root and asset.is_file():
                route.fulfill(path=str(asset), content_type=guess_type(asset.name)[0] or 'application/octet-stream')
            else:
                route.fulfill(status=404, body='')
        else:
            offline(route)

    shared.route('**/*', local_app)
    arithmetic = shared.new_page()
    scientific = shared.new_page()
    for tab in [arithmetic, scientific]:
        tab.on('pageerror', lambda error: errors.append(str(error)))
    arithmetic.goto('https://easycalc.test/arithmetic.html', wait_until='networkidle')
    scientific.goto('https://easycalc.test/scientific.html', wait_until='networkidle')

    def calculate_in(tab, expression, expected):
        field = tab.get_by_label('Expression', exact=True)
        field.fill(expression)
        field.press('Enter')
        expect(field).to_have_value(expected)

    calculate_in(arithmetic, '2+3', '5')
    expect(scientific.locator('#history-count')).to_have_text('(1)')
    calculate_in(scientific, 'sin(30)', '0.5')
    for tab in [arithmetic, scientific]:
        expect(tab.locator('#history-count')).to_have_text('(2)')
        expect(tab.locator('.history-expression')).to_have_text(['sin(30)', '2+3'])
    arithmetic.locator('#calculation-history summary').click()
    arithmetic.get_by_role('button', name='Clear history', exact=True).click()
    for tab in [arithmetic, scientific]:
        expect(tab.locator('#history-count')).to_have_text('(0)')
    calculate_in(scientific, 'sqrt(9)', '3')
    for tab in [arithmetic, scientific]:
        expect(tab.locator('#history-count')).to_have_text('(1)')
        expect(tab.locator('.history-expression')).to_have_text(['sqrt(9)'])
    # A local write does not notify its own tab; unrelated keys and sessionStorage
    # events must not refresh that tab's UI. The matching localStorage event does.
    arithmetic.evaluate("(key) => { localStorage.removeItem(key); window.dispatchEvent(new StorageEvent('storage', { key: 'other-key', storageArea: localStorage })); }", key)
    expect(arithmetic.locator('#history-count')).to_have_text('(1)')
    arithmetic.evaluate("(key) => window.dispatchEvent(new StorageEvent('storage', { key, storageArea: sessionStorage }))", key)
    expect(arithmetic.locator('#history-count')).to_have_text('(1)')
    arithmetic.evaluate("(key) => window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage }))", key)
    expect(arithmetic.locator('#history-count')).to_have_text('(0)')
    calculate_in(arithmetic, '4*4', '16')
    expect(scientific.locator('#history-count')).to_have_text('(1)')
    scientific.evaluate('localStorage.clear()')
    expect(arithmetic.locator('#history-count')).to_have_text('(0)')
    # Opening History and restoring from bfcache reconcile events a suspended page missed.
    scientific.locator('#calculation-history summary').click()
    expect(scientific.locator('#history-count')).to_have_text('(0)')
    calculate_in(scientific, '6*6', '36')
    scientific.evaluate('(key) => localStorage.removeItem(key)', key)
    expect(scientific.locator('#history-count')).to_have_text('(1)')
    scientific.evaluate("window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))")
    expect(scientific.locator('#history-count')).to_have_text('(0)')
    shared.close()

    blocked = browser.new_context(viewport={'width': 375, 'height': 812})
    blocked.route('**/*', offline)
    blocked.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });")
    blocked_page = blocked.new_page()
    blocked_page.on('pageerror', lambda error: errors.append(str(error)))
    blocked_page.goto((root / 'arithmetic.html').as_uri())
    display = blocked_page.get_by_label('Expression', exact=True)
    display.fill('6*7')
    display.press('Enter')
    expect(display).to_have_value('42')
    expect(blocked_page.locator('#history-count')).to_have_text('(1)')
    blocked_page.locator('#calculation-history summary').click()
    blocked_page.get_by_role('button', name='Clear history', exact=True).click()
    expect(blocked_page.locator('#history-count')).to_have_text('(0)')
    blocked.close()
    assert not errors, errors
    assert not external_requests, external_requests
    browser.close()
    print('PASS: cross-tab append/clear/storage events, guarded refresh and bfcache recovery; history persistence, 20-entry bound, malformed/blocked storage, error exclusion, Ans restoration, copy readiness, angle context, keyboard access, inert stored text, and responsive layout. Zero external requests or page errors.')
