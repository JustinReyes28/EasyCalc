<<<<<<< HEAD
﻿# EasyCalc

[Live demo](https://justinreyes28.github.io/EasyCalc/)

Six browser-based calculators built with HTML, CSS, and JavaScript. No build step, external libraries, fonts, or analytics. Calculations run on your device.
=======
# EasyCalc

### Live Demo
Experience EasyCalc live: [https://justinreyes28.github.io/EasyCalc/](https://justinreyes28.github.io/EasyCalc/)

A simple, user-friendly calculator built with HTML, CSS, and JavaScript.
>>>>>>> origin/main

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

<<<<<<< HEAD
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
=======
Open `index.html` in your browser. You will see a menu or set of tabs that let you choose among the available tools. Select the tool you want, then follow its workflow.

### Arithmetic Calculator
1. Enter numbers using the number buttons.
2. Choose an operator such as +, -, *, or /.
3. Press "=" to compute the result.
4. Use "C" to clear the display.

### Scientific Calculator
1. Input a value using the keypad.
2. Select scientific functions like sin, cos, tan, log, exponent, or roots.
3. Press "=" to view the output.
4. Clear the current entry with the reset button.

### Unit Conversion
1. Pick a category such as length, weight, temperature, or volume.
2. Enter a value and select the units to convert from and to.
3. View the converted result instantly.

### GWA Calculator
1. Enter each subject, its unit value, and the corresponding grade.
2. Add all entries to the table.
3. Click the calculate button to generate your General Weighted Average.

### Health Tools
1. Choose a tool such as BMI calculator or calorie estimator.
2. Provide the required inputs like height, weight, or activity details.
3. Review the calculated health metrics.

### Date Tools
1. Select a function like date difference, age computation, or day finder.
2. Enter the date values needed.
3. Read the computed output immediately.


## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Your Name - JustinReyes28@proton.me
>>>>>>> origin/main
