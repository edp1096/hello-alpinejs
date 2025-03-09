// src/slider.js
import sliderTemplate from './slider.html';
import './slider.scss';

export function registerSlider(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // slider 커스텀 태그
    if (typeof customElements !== 'undefined' && !customElements.get('my-slider')) {
        class SliderElement extends HTMLElement {
            connectedCallback() {
                const configAttr = this.getAttribute('config');
                const imagesAttr = this.getAttribute('images');

                let localConfig = { ...config };

                // transition-type
                if (this.hasAttribute('transition-type')) {
                    localConfig.transitionType = this.getAttribute('transition-type');
                }

                // autoplay
                if (this.hasAttribute('autoplay')) {
                    localConfig.autoplayEnabled = this.getAttribute('autoplay') !== 'false';
                }

                // interval
                if (this.hasAttribute('interval')) {
                    localConfig.interval = parseFloat(this.getAttribute('interval')) || 5;
                }

                // duration
                if (this.hasAttribute('duration')) {
                    localConfig.transitionDuration = parseFloat(this.getAttribute('duration')) || 1.2;
                }

                // position
                if (this.hasAttribute('image-position')) {
                    localConfig.imagePosition = this.getAttribute('image-position');
                }

                // indicators
                if (this.hasAttribute('indicators')) {
                    localConfig.showIndicators = this.getAttribute('indicators') !== 'false';
                }

                // controls
                if (this.hasAttribute('show-controls')) {
                    localConfig.showControl = this.getAttribute('show-controls') !== 'false';
                }

                if (configAttr) {
                    try {
                        const parsedConfig = JSON.parse(configAttr);
                        localConfig = { ...localConfig, ...parsedConfig };
                    } catch (e) {
                        console.error('Invalid config attribute:', e);
                    }
                }

                if (imagesAttr) {
                    try {
                        localConfig.images = JSON.parse(imagesAttr);
                    } catch (e) {
                        console.error('Invalid images attribute:', e);
                    }
                }

                this.innerHTML = sliderTemplate;

                if (this.id) {
                    window.Alpine.store('sliderConfig_' + this.id, localConfig);
                }

                // // 디버깅 정보
                // console.log('Slider initialized with config:', localConfig);
                // if (localConfig.images) {
                //     console.log('Images loaded:', localConfig.images.length);
                // } else {
                //     console.warn('No images provided to slider');
                // }
            }

            disconnectedCallback() {
                if (this.id && window.Alpine && window.Alpine.store) {
                    const storeKey = 'sliderConfig_' + this.id;
                    if (typeof window.Alpine.store(storeKey) != 'undefined') {
                        window.Alpine.store(storeKey, {});
                    }
                }
            }
        }

        customElements.define('my-slider', SliderElement);
    }

    window.Alpine.data('carouselController', () => {
        return {
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
                // 요소의 ID를 확인하고 해당 설정 가져오기
                if (this.$el && this.$el.closest('my-slider') && this.$el.closest('my-slider').id) {
                    const mySlider = this.$el.closest('my-slider');
                    const sliderConfig = window.Alpine.store('sliderConfig_' + mySlider.id);

                    if (sliderConfig) {
                        // 모든 설정 복사
                        this.config = sliderConfig;

                        // 개별 설정 적용
                        if (sliderConfig.transitionType) this.transitionType = sliderConfig.transitionType;
                        if (sliderConfig.autoplayEnabled !== undefined) this.autoplayEnabled = sliderConfig.autoplayEnabled;
                        if (sliderConfig.interval) this.interval = sliderConfig.interval;
                        if (sliderConfig.transitionDuration) this.transitionDuration = sliderConfig.transitionDuration;
                        if (sliderConfig.imagePosition) this.imagePosition = sliderConfig.imagePosition;
                        if (sliderConfig.showIndicators !== undefined) this.showIndicators = sliderConfig.showIndicators;
                        if (sliderConfig.showControl !== undefined) this.showControl = sliderConfig.showControl;

                        // 이미지 설정 (가장 중요!)
                        if (sliderConfig.images && Array.isArray(sliderConfig.images)) {
                            this.images = sliderConfig.images;
                            // console.log('Setting slider images:', this.images);
                        }
                    }
                } else {
                    // 기존 설정 코드 (div 태그에서 사용할 경우)
                    if (this.config) {
                        Object.entries(this.config).forEach(([key, value]) => {
                            if (key in this) { this[key] = value; }
                        });
                    }
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
        };
    });

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

// // Auto initialization after the document is fully loaded
// if (typeof document != 'undefined') {
//     document.addEventListener('DOMContentLoaded', () => {
//         if (window.Alpine) {
//             // 커스텀 태그 정의 알림
//             if (typeof customElements !== 'undefined') {
//                 customElements.whenDefined('my-slider').then(() => {
//                     console.log('my-slider custom element defined');
//                 });
//             }
//         }
//     });
// }

window.SliderComponent = { registerSlider };