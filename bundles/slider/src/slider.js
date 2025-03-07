// src/slider.js
import sliderTemplate from './slider.html';
import './slider.scss';

export function registerSlider(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('carouselController', () => ({
        config: config,
        currentIndex: 0,
        autoplayInterval: null,
        images: [], // Image list
        transitionType: 'slide', // Transition type
        autoplayEnabled: true, // Autoplay enabled
        interval: 5, // Play interval (seconds)
        transitionDuration: 1.2, // Transition time (seconds)
        imagePosition: 'center', // Image position
        showIndicators: true, // Show indicators
        showControl: false, // Show options panel

        init() {
            if (this.config) {
                Object.entries(this.config).forEach(([key, value]) => {
                    if (key in this) { this[key] = value; }
                });
            }

            if (this.autoplayEnabled) { this.startAutoplay(); }

            // Pause autoplay when mouse pointer on carousel
            const container = this.$el.querySelector('.carousel-container');
            if (container) {
                container.addEventListener('mouseenter', () => { if (this.autoplayEnabled) this.stopAutoplay(); });
                container.addEventListener('mouseleave', () => { if (this.autoplayEnabled) this.startAutoplay(); });
            }

            this.$watch('transitionType', () => { });

            this.$watch('autoplayEnabled', (value) => {
                if (value) {
                    this.startAutoplay();
                } else {
                    this.stopAutoplay();
                }
            });

            this.$watch('interval', () => {
                if (this.autoplayEnabled) {
                    this.stopAutoplay();
                    this.startAutoplay();
                }
            });

            this.$watch('transitionDuration', () => { this.updateStyles(); });
        },

        updateStyles() { },

        getItemStyle() {
            // Transition and animation styles
            if (this.transitionType == 'fade') {
                return {
                    transition: `opacity ${this.transitionDuration}s ease`,
                    animation: `fadeIn ${this.transitionDuration}s ease`
                };
            }
            return {};
        },

        next() { this.currentIndex = (this.currentIndex + 1) % this.images.length; },
        prev() { this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length; },
        goToSlide(index) { this.currentIndex = index; },

        startAutoplay() {
            this.stopAutoplay();
            this.autoplayInterval = setInterval(() => { this.next(); }, this.interval * 1000);
        },
        stopAutoplay() { clearInterval(this.autoplayInterval); }
    }));

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = sliderTemplate;
                // window.Alpine.nextTick(() => { window.Alpine.initTree(el); })
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() { return sliderTemplate; }
    };

    return controller;
}

window.SliderComponent = { registerSlider };