document.addEventListener('DOMContentLoaded', () => {

    const backToTopButton = document.getElementById('backToTopBtn');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });

        backToTopButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
                // e.preventDefault(); 
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    e.preventDefault(); 
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (mobileNavToggle && navMenu) {
        mobileNavToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                
                const isDropdownParent = link.parentElement.classList.contains('nav-item-dropdown');
                if (window.innerWidth <= 992 && !isDropdownParent) {
                    if (navMenu.classList.contains('active')) {
                        navMenu.classList.remove('active');
                    }
                }
                
            });
        });
    }

    const zaloButton = document.getElementById('zaloFabButton');
    const zaloPopup = document.getElementById('zaloPopup'); 
    const zaloCloseButton = document.getElementById('zaloPopupClose');

    if (zaloButton && zaloPopup && zaloCloseButton) {
        
        zaloButton.addEventListener('click', (e) => {
            e.preventDefault(); 
            zaloPopup.classList.add('show');
        });

        zaloCloseButton.addEventListener('click', () => {
            zaloPopup.classList.remove('show');
        });

        zaloPopup.addEventListener('click', (e) => {
            if (e.target === zaloPopup) { 
                zaloPopup.classList.remove('show');
            }
        });
    }

    const dropdownLinks = document.querySelectorAll('.nav-menu .nav-item-dropdown > a');

    dropdownLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault(); 
                
                const subMenu = this.nextElementSibling;
                this.classList.toggle('submenu-active-link');
                if (subMenu) {
                    subMenu.classList.toggle('submenu-active');
                }
            }
        });
    });

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
            }
        });
    }, observerOptions);

    const serviceCards = document.querySelectorAll('.service-card');
    serviceCards.forEach(card => observer.observe(card));

    const footerColumns = document.querySelectorAll('.footer-column');
    footerColumns.forEach(col => {
        observer.observe(col);
    });

});