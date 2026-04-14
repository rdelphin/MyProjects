// Hamburger Menu Functionality
function initHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');
    
    if (!hamburger || !navLinks) return;
    
    // Toggle menu on hamburger click
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (navLinks.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    });
    
    // Close menu when clicking on a link
    const links = navLinks.querySelectorAll('a');
    links.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Update cart count on page load
function updateCartCount() {
    const cart = localStorage.getItem('modenloCart');
    const itemCount = cart ? JSON.parse(cart).length : 0;
    const cartCountElement = document.getElementById('cartCount');
    
    if (cartCountElement) {
        cartCountElement.textContent = itemCount;
        if (itemCount > 0) {
            cartCountElement.style.display = 'flex';
        } else {
            cartCountElement.style.display = 'none';
        }
    }
}

// Handle email signup
function handleEmailSignup(e) {
    e.preventDefault();
    const email = e.target.querySelector('input[type="email"]').value;
    
    // Store email (in a real app, this would send to a server)
    localStorage.setItem('modenloPromoEmail', email);
    
    // Show success message
    const form = e.target;
    const originalHTML = form.innerHTML;
    form.innerHTML = '<p style="color: white; font-size: 1.1rem; margin: 1rem 0;">✅ Thank you! Check your email for your 15% discount code.</p>';
    
    // Reset form after 5 seconds
    setTimeout(() => {
        form.innerHTML = originalHTML;
        setupEmailForm();
    }, 5000);
}

// Setup email form
function setupEmailForm() {
    const emailForm = document.getElementById('emailSignup');
    if (emailForm) {
        emailForm.addEventListener('submit', handleEmailSignup);
    }
}

// Load popular prices
async function loadPopularPrices() {
    const pricesGrid = document.getElementById('popularPricesGrid');
    if (!pricesGrid) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/frames');
        const data = await response.json();
        
        // Extract frames array from response
        const frames = data.frames || data;
        
        if (frames && frames.length > 0) {
            // Sort by price and take first 4
            const popularFrames = frames.sort((a, b) => a.price - b.price).slice(0, 4);
            
            pricesGrid.innerHTML = popularFrames.map(frame => `
                <div class="price-box">
                    <div class="price-box-size">${frame.size}"</div>
                    <div class="price-box-amount">$${frame.price.toFixed(2)}</div>
                </div>
            `).join('');
        } else {
            pricesGrid.innerHTML = '<div class="loading-prices">No pricing available</div>';
        }
    } catch (error) {
        console.error('Error loading prices:', error);
        pricesGrid.innerHTML = '<div class="loading-prices">Unable to load pricing</div>';
    }
}

// Load categories dynamically
async function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    try {
        const response = await fetch('http://localhost:3000/api/categories');
        const data = await response.json();
        
        const categories = data.categories || [];
        
        if (categories && categories.length > 0) {
            categoriesGrid.innerHTML = categories.map(category => `
                <a href="${category.link}" class="category-card-modern">
                    <div class="category-card-image">
                        <img src="${category.image}" alt="${category.name}" loading="lazy" />
                        <div class="category-card-overlay"></div>
                    </div>
                    <div class="category-card-body">
                        <h3 class="category-card-title">${category.name}</h3>
                        <p class="category-card-price">From ${category.startingPrice}</p>
                        <span class="category-card-link">
                            Explore
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                        </span>
                    </div>
                </a>
            `).join('');
        } else {
            categoriesGrid.innerHTML = '<div class="loading">No categories available</div>';
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        categoriesGrid.innerHTML = '<div class="loading">Unable to load categories</div>';
    }
}

// Mount Options Unified Slider Functionality
function initMountSlider() {
    const slides = document.querySelectorAll('.mount-slide');
    const dots = document.querySelectorAll('.mount-dot');
    const prevBtn = document.querySelector('.mount-slider-nav.prev');
    const nextBtn = document.querySelector('.mount-slider-nav.next');
    let currentSlideIndex = 0;
    let autoPlayInterval;
    
    if (!slides.length) return;
    
    function showSlide(index) {
        // Remove active class from all slides and dots
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        
        // Ensure index is within bounds
        if (index >= slides.length) {
            currentSlideIndex = 0;
        } else if (index < 0) {
            currentSlideIndex = slides.length - 1;
        } else {
            currentSlideIndex = index;
        }
        
        // Add active class to current slide and dot
        slides[currentSlideIndex].classList.add('active');
        dots[currentSlideIndex].classList.add('active');
    }
    
    function nextSlide() {
        showSlide(currentSlideIndex + 1);
    }
    
    function prevSlide() {
        showSlide(currentSlideIndex - 1);
    }
    
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextSlide, 5000);
    }
    
    function stopAutoPlay() {
        clearInterval(autoPlayInterval);
    }
    
    // Next button click
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }
    
    // Previous button click
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        });
    }
    
    // Dot click handlers
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopAutoPlay();
            startAutoPlay();
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            prevSlide();
            stopAutoPlay();
            startAutoPlay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            stopAutoPlay();
            startAutoPlay();
        }
    });
    
    // Touch/Swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const sliderWrapper = document.querySelector('.mount-slider-wrapper');
    
    if (sliderWrapper) {
        sliderWrapper.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        
        sliderWrapper.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                nextSlide();
                stopAutoPlay();
                startAutoPlay();
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                prevSlide();
                stopAutoPlay();
                startAutoPlay();
            }
        }
    }
    
    // Pause auto-play when slider is hovered
    const sliderContainer = document.querySelector('.mount-slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopAutoPlay);
        sliderContainer.addEventListener('mouseleave', startAutoPlay);
    }
    
    // Start auto-play
    startAutoPlay();
    
    // Initialize first slide
    showSlide(0);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initHamburgerMenu();
    updateCartCount();
    setupEmailForm();
    loadPopularPrices();
    loadCategories();
    initMountSlider();
});
