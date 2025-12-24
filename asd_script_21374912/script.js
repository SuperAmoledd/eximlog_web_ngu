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

    const toggleBtn = document.querySelector('.mobile-nav-toggle');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('overlay');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    if (toggleBtn && navMenu && overlay) {
        const icon = toggleBtn.querySelector('i');

        // 1. Hàm đóng/mở menu
        function toggleMenu() {
            navMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            
            // Đổi icon hamburger <-> x
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark'); 
                document.body.style.overflow = 'hidden'; // Chặn cuộn trang
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
                document.body.style.overflow = '';
            }
        }

        toggleBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);

        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 992) {
                    e.preventDefault(); // Ngăn chuyển trang
                    const parent = this.parentElement;
                    parent.classList.toggle('active'); // Thêm class active để CSS hiển thị menu con
                }
            });
        });

        // 3. Đóng menu khi click vào link bên trong (trừ link Báo giá)
        const navLinks = navMenu.querySelectorAll('a:not(.dropdown-toggle)');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    toggleMenu();
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

    const statsSection = document.getElementById('stats-counter');
    const counters = document.querySelectorAll('.stat-number');
    let started = false; 

    if (statsSection && counters.length > 0) {
        const statsObserver = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !started) {
                started = true;
                
                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target'); 
                    const duration = 3000; 
                    const increment = target / (duration / 16); 
                    
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current).toLocaleString('vi-VN'); 
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target.toLocaleString('vi-VN');
                        }
                    };
                    
                    updateCounter();
                });
            }
        }, { threshold: 0.5 });

        statsObserver.observe(statsSection);
    }


    const contactForm = document.querySelector('.contact-form'); 

    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); 

            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                message: document.getElementById('message').value
            };

            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Đang gửi...';
            submitBtn.disabled = true;

            fetch('https://dashboard.eximlog.vn/api/contact', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(formData) 
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(data.message); 
                    contactForm.reset(); 
                } else {
                    alert('Lỗi: ' + data.message); 
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi kết nối server!');
            })
            .finally(() => {
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
            });
        });
    }


    const track = document.getElementById('newsTrack');
    
    if (track) {
        const slides = Array.from(track.children);
        const nextButton = document.getElementById('newsNextBtn');
        const prevButton = document.getElementById('newsPrevBtn');
        const dotsNav = document.getElementById('newsDots');

        let currentIndex = 0;
        let slideInterval; 

        function getSlidesPerView() {
            if (window.innerWidth < 576) return 1;
            if (window.innerWidth < 992) return 2;
            return 3;
        }

        function createDots() {
            const currentSlidesPerView = getSlidesPerView();
            const totalSlides = slides.length;
            const maxIndex = totalSlides - currentSlidesPerView;
            
            dotsNav.innerHTML = ''; 

            for (let i = 0; i <= maxIndex; i++) {
                const dot = document.createElement('button');
                dot.classList.add('news-dot');
                if (i === 0) dot.classList.add('active-dot');
                dotsNav.appendChild(dot);
                
                dot.addEventListener('click', () => {
                    currentIndex = i;
                    updateSlidePosition();
                    resetTimer(); 
                });
            }
        }
        
        createDots();

        function updateSlidePosition() {
            const slideWidth = slides[0].getBoundingClientRect().width;
            track.style.transition = 'transform 0.3s ease-out';
            track.style.transform = 'translateX(-' + (slideWidth * currentIndex) + 'px)';
            
            const dots = Array.from(dotsNav.children);
            dots.forEach(d => d.classList.remove('active-dot'));
            
            if(dots[currentIndex]) {
                dots[currentIndex].classList.add('active-dot');
            } else if (dots.length > 0) {
                 dots[dots.length - 1].classList.add('active-dot');
            }
        }

        function moveToNextSlide() {
            const currentSlidesPerView = getSlidesPerView();
            const maxIndex = slides.length - currentSlidesPerView;

            if (currentIndex >= maxIndex) {
                currentIndex = 0; 
            } else {
                currentIndex++;
            }
            updateSlidePosition();
        }

        nextButton.addEventListener('click', () => {
            moveToNextSlide();
            resetTimer();
        });

        prevButton.addEventListener('click', () => {
            const currentSlidesPerView = getSlidesPerView();
            const maxIndex = slides.length - currentSlidesPerView;

            if (currentIndex <= 0) {
                currentIndex = maxIndex; 
            } else {
                currentIndex--;
            }
            updateSlidePosition();
            resetTimer(); 
        });

        
        function startAutoPlay() {
            slideInterval = setInterval(moveToNextSlide, 3000);
        }

        function stopAutoPlay() {
            clearInterval(slideInterval);
        }

        function resetTimer() {
            stopAutoPlay();
            startAutoPlay();
        }

        window.addEventListener('resize', () => {
            createDots(); 
            updateSlidePosition(); 
        });
        
        updateSlidePosition();
        startAutoPlay(); 
    }
});
