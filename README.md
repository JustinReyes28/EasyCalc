# EasyCalc

[Live demo](https://justinreyes28.github.io/EasyCalc/)

Six browser-based calculators built with HTML, CSS, and JavaScript. No build step, external libraries, fonts, or analytics. Calculations run on your device.

## Calculators

- **Arithmetic:** addition, subtraction, multiplication, division, parentheses, and reusable answers.
- **Scientific:** powers, roots, factorials, constants, logarithms, exponentials, and nested trigonometry in degrees or radians.
- **Unit conversion:** length, weight, temperature, volume, and time.
- **General weighted average:** course grades and units, saved drafts, and the last 10 calculations.
- **Health:** BMI, body fat estimates, ideal weight, and basal metabolic rate.
- **Date & time:** date differences, ages, countdowns, adding days, time intervals, and current times across time zones.

## Getting started

Open `index.html` in your browser and choose a calculator. The landing page uses ordinary links and works with JavaScript disabled; calculations need JavaScript enabled. All assets are included in this repository, so a local copy works without an internet connection.

Arithmetic and scientific calculators accept keyboard input and pasted expressions. Press **Enter** or **=** to calculate, **Escape** to clear, or **Backspace** to edit. The keypad inserts at the cursor, and **Copy result** copies a calculated answer (or selects it if clipboard access is unavailable).

A number starts a new calculation after a result; an operator continues with that result. Use **Ans** to reuse the last answer. Clear resets the expression and keeps Ans available for the current visit.

Scientific examples:

```text
sin(30)           = 0.5       (DEG, the default)
sin(pi/2)         = 1         (RAD)
sin(cos(0)*30)    = 0.5       (DEG)
(2+3)!            = 120
2^3^2             = 512
log(100) + ln(e)  = 3
```

`log` is base 10; `ln` is the natural logarithm. Powers use `^` (`**` is also accepted). Factorials require whole numbers from 0 to 170. The parser accepts only supported math expressions and never executes input as JavaScript. Expressions are limited to 256 characters and results display up to 12 significant digits.

GWA drafts and history are stored in your browser's local storage. Calculations remain usable if that storage is unavailable. Body-fat inputs use centimetres and are converted to inches for the circumference equations; height has its own field in the body-fat card. The equation constants and inch units are documented in the [Army body-fat worksheet](https://api.army.mil/e2/c/downloads/566092.pdf).

## Development and checks

There are no production dependencies to install. Serve the files with any static server, or open them directly.

Run the dependency-free math and body-fat regression tests with an installed Node.js:

```sh
node --test tests/calculator-engine.test.cjs
```

The optional browser regression script uses an **already installed** Python Playwright package and Google Chrome. It does not install or download either. It loads local files and blocks external requests.

```sh
python tests/browser-smoke.py
python tests/browser-smoke.py --screenshots path/to/local/screenshots
```

Browser checks cover keyboard and caret editing, error recovery, scientific functions, angle modes, mobile layouts and touch targets, GWA restoration, body-fat units, and date handling in Singapore and Los Angeles.

## License

[MIT](LICENSE)
