// API Configuration
const API_BASE = 'http://localhost:3000/api';

// Load available clock sizes and options
async function loadClockData() {
    try {
        const response = await fetch(`${API_BASE}/clocks`);
        const data = await response.json();
        
        if (data.success && data.clocks && data.clocks.length > 0) {
            const clocks = data.clocks.filter(clock => clock.available);
            displaySizes(clocks);
            displayOptionsPreview(clocks);
        } else {
            displayError();
        }
    } catch (error) {
        console.error('Error loading clock data:', error);
        displayError();
    }
}

// Display clock sizes in hero section
function displaySizes(clocks) {
    const heroSizesGrid = document.getElementById('heroSizesGrid');
    
    if (clocks.length === 0) {
        heroSizesGrid.innerHTML = '<p class="loading">No clock sizes available</p>';
        return;
    }
    
    // Sort by diameter
    clocks.sort((a, b) => a.diameter - b.diameter);
    
    heroSizesGrid.innerHTML = clocks.map(clock => `
        <div class="hero-size-card">
            <div class="hero-size-dimension">${clock.diameter}" Ø</div>
            <div class="hero-size-price">From $${clock.price.toFixed(2)}</div>
        </div>
    `).join('');
}

// Display options preview (hands and frames summary)
function displayOptionsPreview(clocks) {
    const previewContainer = document.getElementById('clockOptionsPreview');
    
    // Get all unique hands and frames across all clocks
    const allHands = new Set();
    const allFrames = new Set();
    
    clocks.forEach(clock => {
        if (clock.hands) {
            clock.hands.forEach(hand => allHands.add(hand.name));
        }
        if (clock.frames) {
            clock.frames.forEach(frame => allFrames.add(frame.name));
        }
    });
    
    const handsCount = allHands.size;
    const framesCount = allFrames.size;
    
    previewContainer.innerHTML = `
        <div class="options-preview-grid">
            <div class="option-preview-card">
                <div class="option-preview-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <div class="option-preview-content">
                    <h4>Clock Hands</h4>
                    <p>${handsCount} ${handsCount === 1 ? 'style' : 'styles'} available</p>
                </div>
            </div>
            
            <div class="option-preview-card">
                <div class="option-preview-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                    </svg>
                </div>
                <div class="option-preview-content">
                    <h4>Frame Options</h4>
                    <p>${framesCount} ${framesCount === 1 ? 'option' : 'options'} available</p>
                </div>
            </div>
        </div>
        <p class="options-preview-note">Customize your clock with your choice of hands and frames when you create your order.</p>
    `;
}

// Display error message
function displayError() {
    const heroSizesGrid = document.getElementById('heroSizesGrid');
    const previewContainer = document.getElementById('clockOptionsPreview');
    
    heroSizesGrid.innerHTML = '<p class="loading">Unable to load clock sizes. Please try again later.</p>';
    previewContainer.innerHTML = '<p class="loading">Unable to load options. Please try again later.</p>';
}

// Image Carousel
class Carousel {
    constructor() {
        this.currentSlide = 0;
        this.slides = document.querySelectorAll('.carousel-slide');
        this.indicators = document.querySelectorAll('.indicator');
        this.prevBtn = document.querySelector('.carousel-prev');
        this.nextBtn = document.querySelector('.carousel-next');
        
        this.init();
    }
    
    init() {
        // Button event listeners
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        
        // Indicator event listeners
        this.indicators.forEach((indicator, index) => {
            indicator.addEventListener('click', () => this.goToSlide(index));
        });
        
        // Touch/swipe support
        let touchStartX = 0;
        let touchEndX = 0;
        const carousel = document.querySelector('.carousel-container');
        
        carousel.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        carousel.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            this.handleSwipe();
        });
        
        this.handleSwipe = () => {
            if (touchStartX - touchEndX > 50) {
                this.nextSlide();
            }
            if (touchEndX - touchStartX > 50) {
                this.prevSlide();
            }
        };
        
        // Auto-play (every 5 seconds)
        setInterval(() => this.nextSlide(), 5000);
    }
    
    goToSlide(index) {
        this.slides[this.currentSlide].classList.remove('active');
        this.indicators[this.currentSlide].classList.remove('active');
        
        this.currentSlide = index;
        
        this.slides[this.currentSlide].classList.add('active');
        this.indicators[this.currentSlide].classList.add('active');
    }
    
    nextSlide() {
        let next = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(next);
    }
    
    prevSlide() {
        let prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prev);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    loadClockData();
    new Carousel();
});
