// JavaScript for handling calculator card clicks and redirection
document.addEventListener('DOMContentLoaded', function() {
    // Add fade-in effect after page load
    setTimeout(function() {
        // Hide the logo
        const logoContainer = document.querySelector('.logo-container');
        if (logoContainer) {
            logoContainer.style.opacity = '0';
            logoContainer.style.transition = 'opacity 0.5s ease-out';

            // After logo fades out, show the calculator cards
            setTimeout(function() {
                logoContainer.style.display = 'none';

                // Show the calculator cards
                const contentContainer = document.querySelector('.content-container');
                if (contentContainer) {
                    contentContainer.classList.remove('hidden');
                    contentContainer.classList.add('visible');
                }
            }, 500);
        }
    }, 500); // Show the logo for 500ms before starting fade-in

    // Get all calculator cards
    const calculatorCards = document.querySelectorAll('.calculator-card');

    // Add click event listeners to each card
    calculatorCards.forEach(card => {
        card.addEventListener('click', function() {
            const calculatorType = this.getAttribute('data-calculator');
            redirectToCalculator(calculatorType);
        });
    });

    // Add click event listeners to buttons as well (for accessibility)
    const cardButtons = document.querySelectorAll('.card-button');
    cardButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling

            // Find the parent card to get the calculator type
            const card = this.closest('.calculator-card');
            const calculatorType = card.getAttribute('data-calculator');
            redirectToCalculator(calculatorType);
        });
    });

    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Function to redirect to the appropriate calculator page
    function redirectToCalculator(calculatorType) {
        let pageUrl = '';

        switch(calculatorType) {
            case 'arithmetic':
                pageUrl = 'arithmetic.html';
                break;
            case 'scientific':
                pageUrl = 'scientific.html';
                break;
            case 'unit-conversion':
                pageUrl = 'unit-conversion.html';
                break;
            case 'gwa':
                pageUrl = 'gwa.html';
                break;
            default:
                console.error('Unknown calculator type:', calculatorType);
                return;
        }

        // Redirect to the calculator page
        window.location.href = pageUrl;
    }
});