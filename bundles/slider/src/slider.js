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

                // arrows
                if (this.hasAttribute('show-arrows')) {
                    localConfig.showArrows = this.getAttribute('show-arrows') !== 'false';
                }

                // indicators
                if (this.hasAttribute('indicators')) {
                    localConfig.showIndicators = this.getAttribute('indicators') !== 'false';
                }

                // controls
                if (this.hasAttribute('show-controls')) {
                    localConfig.showControl = this.getAttribute('show-controls') !== 'false';
                }

                // nofillet
                if (this.hasAttribute('no-fillet')) {
                    localConfig.noFillet = this.getAttribute('no-fillet') !== 'false';
                }

                // ratio
                if (this.hasAttribute('ratio')) {
                    localConfig.ratio = this.getAttribute('ratio');
                }

                // swipe
                if (this.hasAttribute('swipe')) {
                    localConfig.useSwipe = this.getAttribute('swipe') !== 'false';
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
            showArrows: true, // Show prev/next arrows
            showIndicators: true, // Show indicators
            showControl: false, // Show options panel
            noFillet: false, // Use border-radius
            useSwipe: false, // Use swipe

            // Swipe
            touchStartX: 0,
            touchStartY: 0,
            touchEndX: 0,
            lastDeltaX: 0,
            dragOffset: 0,
            mouseDown: false,
            isDragging: false,
            isSwiping: false,
            minSwipeDistance: 50,
            swipeThreshold: 0.15,

            // Aspect ratio
            ratio: '1080/480',
            customRatioSelected: false,
            customRatio: '',

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
                        if (sliderConfig.showArrows !== undefined) this.showArrows = sliderConfig.showArrows;
                        if (sliderConfig.showIndicators !== undefined) this.showIndicators = sliderConfig.showIndicators;
                        if (sliderConfig.showControl !== undefined) this.showControl = sliderConfig.showControl;
                        if (sliderConfig.noFillet !== undefined) this.noFillet = sliderConfig.noFillet;
                        if (sliderConfig.useSwipe !== undefined) this.useSwipe = sliderConfig.useSwipe;
                        if (sliderConfig.ratio) this.ratio = sliderConfig.ratio;

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


                this.$nextTick(() => { this.updateRatioStyle(); });
                this.$watch('ratio', () => { this.updateRatioStyle(); });

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
                this.$nextTick(() => { this.setupSwipeHandlers(); }); // Swipe handlers
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
            // next() {
            //     const inner = this.$el.querySelector('.carousel-inner');
            //     if (inner) inner.style.transition = `transform ${this.transitionDuration}s ease`;

            //     this.currentIndex = (this.currentIndex + 1) % this.images.length;
            // },
            // prev() {
            //     const inner = this.$el.querySelector('.carousel-inner');
            //     if (inner) inner.style.transition = `transform ${this.transitionDuration}s ease`;

            //     this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
            // },
            // goToSlide(index) {
            //     const inner = this.$el.querySelector('.carousel-inner');
            //     if (inner) inner.style.transition = `transform ${this.transitionDuration}s ease`;

            //     this.currentIndex = index;
            // },

            startAutoplay() {
                this.stopAutoplay();
                this.autoplayInterval = setInterval(() => { this.next(); }, this.interval * 1000);
            },
            stopAutoplay() { clearInterval(this.autoplayInterval); },

            // ratio를 CSS 변수로 적용
            updateRatioStyle() {
                const container = this.$el.querySelector('.carousel-container');
                if (container) {
                    // ratio가 "가로/세로" 형식인 경우 계산
                    if (this.ratio.includes('/')) {
                        const [width, height] = this.ratio.split('/').map(Number);
                        if (!isNaN(width) && !isNaN(height) && height > 0) {
                            const percentage = (height / width) * 100;
                            container.style.setProperty('--ratio', `${percentage}%`);
                        }
                    }
                    // ratio가 직접 퍼센트 값인 경우
                    else if (this.ratio.includes('%')) {
                        container.style.setProperty('--ratio', this.ratio);
                    }
                    // 기본값 설정
                    else {
                        container.style.setProperty('--ratio', '44.44%');
                    }
                }
            },

            // Swipe 핸들러 설정
            setupSwipeHandlers() {
                const container = this.$el.querySelector('.carousel-container');
                if (!container) return;

                // 터치 이벤트 (모바일)
                container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
                container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
                container.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

                // 마우스 이벤트 (데스크톱)
                container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
                window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
                window.addEventListener('mouseup', () => this.handleMouseUp());
            },

            // 터치 이벤트 핸들러 (모바일)
            handleTouchStart(e) {
                if (!this.useSwipe || this.transitionType !== 'slide') return;

                this.touchStartX = e.touches[0].clientX;
                this.touchStartY = e.touches[0].clientY;
                this.lastDeltaX = 0;
                this.dragOffset = 0;
                this.isSwiping = false;

                // 자동 재생 일시 중지
                if (this.autoplayEnabled) this.stopAutoplay();

                // 트랜지션 효과 제거로 즉각적인 반응 제공
                const inner = this.$el.querySelector('.carousel-inner');
                if (inner) inner.style.transition = 'none';
            },

            handleTouchMove(e) {
                if (!this.useSwipe || this.transitionType !== 'slide' || !this.touchStartX) return;

                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                const diffX = touchX - this.touchStartX;
                const diffY = touchY - this.touchStartY;

                // 처음 움직임이 감지될 때 방향 결정
                if (!this.isSwiping && !this.isDragging) {
                    // 수평 방향 움직임이 더 크면 스와이프로 판단
                    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                        this.isSwiping = true;
                        this.isDragging = true;
                        e.preventDefault(); // 수평 스와이프 시 스크롤 방지
                    }
                }

                // 수평 스와이프로 판단된 경우 슬라이더 위치 실시간 업데이트
                if (this.isSwiping) {
                    e.preventDefault();

                    const container = this.$el.querySelector('.carousel-container');
                    const inner = this.$el.querySelector('.carousel-inner');

                    if (container && inner) {
                        // 드래그 거리를 백분율로 계산
                        this.dragOffset = diffX / container.offsetWidth * 100;

                        // 슬라이더 끝에 도달했을 때 저항 효과
                        if ((this.currentIndex === 0 && diffX > 0) ||
                            (this.currentIndex === this.images.length - 1 && diffX < 0)) {
                            this.dragOffset /= 2; // 저항 효과: 끝에서는 절반만 움직임
                        }

                        // 슬라이더 위치 업데이트
                        const translateX = -this.currentIndex * 100 + this.dragOffset;
                        inner.style.transform = `translateX(${translateX}%)`;
                    }

                    this.touchEndX = touchX;
                    this.lastDeltaX = diffX; // 드래그 속도 계산을 위해 저장
                }
            },

            handleTouchEnd(e) {
                if (!this.useSwipe || this.transitionType !== 'slide' || !this.isSwiping) {
                    // 자동 재생 재개
                    if (this.autoplayEnabled) this.startAutoplay();
                    return;
                }

                // 수평 스와이프로 판단된 경우 처리
                if (this.isSwiping) {
                    e.preventDefault();

                    const container = this.$el.querySelector('.carousel-container');
                    const inner = this.$el.querySelector('.carousel-inner');

                    if (inner) {
                        // 트랜지션 효과 다시 활성화
                        inner.style.transition = `transform ${this.transitionDuration}s ease`;

                        // 드래그 거리가 임계값을 넘으면 슬라이드 변경
                        const threshold = container ? container.offsetWidth * this.swipeThreshold : this.minSwipeDistance;

                        if (Math.abs(this.lastDeltaX) > threshold) {
                            if (this.lastDeltaX > 0) {
                                // 오른쪽으로 스와이프 - 이전 슬라이드
                                this.prev();
                            } else {
                                // 왼쪽으로 스와이프 - 다음 슬라이드
                                this.next();
                            }
                        } else {
                            // 임계값 미만이면 현재 슬라이드로 복귀
                            inner.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                        }
                    }
                }

                // 상태 초기화
                this.touchStartX = 0;
                this.touchEndX = 0;
                this.touchStartY = 0;
                this.lastDeltaX = 0;
                this.dragOffset = 0;
                this.isDragging = false;
                this.isSwiping = false;

                // 자동 재생 재개
                if (this.autoplayEnabled) this.startAutoplay();
            },

            // 마우스 이벤트 핸들러 (데스크톱)
            handleMouseDown(e) {
                if (!this.useSwipe || this.transitionType !== 'slide') return;

                e.preventDefault(); // 텍스트 선택 방지
                this.mouseDown = true;
                this.touchStartX = e.clientX;
                this.touchStartY = e.clientY;
                this.lastDeltaX = 0;
                this.dragOffset = 0;
                this.isSwiping = false;

                // 자동 재생 일시 중지
                if (this.autoplayEnabled) this.stopAutoplay();

                // 트랜지션 효과 제거
                const inner = this.$el.querySelector('.carousel-inner');
                if (inner) inner.style.transition = 'none';

                // 커서 스타일 변경
                document.body.style.cursor = 'grabbing';
            },

            handleMouseMove(e) {
                if (!this.useSwipe || !this.mouseDown) return;

                const diffX = e.clientX - this.touchStartX;
                const diffY = e.clientY - this.touchStartY;

                // 처음 움직임이 감지될 때 방향 결정
                if (!this.isSwiping && !this.isDragging) {
                    // 수평 방향 움직임이 더 크면 스와이프로 판단
                    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
                        this.isSwiping = true;
                        this.isDragging = true;
                        e.preventDefault(); // 수평 스와이프 시 스크롤 방지
                    }
                }

                // 수평 스와이프로 판단된 경우 슬라이더 위치 실시간 업데이트
                if (this.isSwiping) {
                    e.preventDefault();
                    const container = this.$el.querySelector('.carousel-container');
                    const inner = this.$el.querySelector('.carousel-inner');

                    if (container && inner) {
                        // 드래그 거리를 백분율로 계산
                        this.dragOffset = diffX / container.offsetWidth * 100;

                        // 슬라이더 끝에 도달했을 때 저항 효과
                        if ((this.currentIndex === 0 && diffX > 0) ||
                            (this.currentIndex === this.images.length - 1 && diffX < 0)) {
                            this.dragOffset /= 2; // 저항 효과
                        }

                        // 슬라이더 위치 업데이트
                        const translateX = -this.currentIndex * 100 + this.dragOffset;
                        inner.style.transform = `translateX(${translateX}%)`;
                    }

                    this.touchEndX = e.clientX;
                    this.lastDeltaX = diffX;
                }
            },

            handleMouseUp() {
                if (!this.useSwipe || !this.mouseDown) return;

                // 커서 스타일 복원
                document.body.style.cursor = '';

                if (this.isSwiping) {
                    const container = this.$el.querySelector('.carousel-container');
                    const inner = this.$el.querySelector('.carousel-inner');

                    if (inner) {
                        // 트랜지션 효과 다시 활성화
                        inner.style.transition = `transform ${this.transitionDuration}s ease`;

                        // 드래그 거리가 임계값을 넘으면 슬라이드 변경
                        const threshold = container ? container.offsetWidth * this.swipeThreshold : this.minSwipeDistance;

                        if (Math.abs(this.lastDeltaX) > threshold) {
                            if (this.lastDeltaX > 0) {
                                // 오른쪽으로 드래그 - 이전 슬라이드
                                this.prev();
                            } else {
                                // 왼쪽으로 드래그 - 다음 슬라이드
                                this.next();
                            }
                        } else {
                            // 임계값 미만이면 현재 슬라이드로 복귀
                            inner.style.transform = `translateX(${-this.currentIndex * 100}%)`;
                        }
                    }

                    const preventClickEvent = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        document.removeEventListener('click', preventClickEvent, true);
                    };
                    document.addEventListener('click', preventClickEvent, true);
                }

                // 상태 초기화
                this.mouseDown = false;
                this.isDragging = false;
                this.isSwiping = false;
                this.touchStartX = 0;
                this.touchEndX = 0;
                this.touchStartY = 0;
                this.lastDeltaX = 0;
                this.dragOffset = 0;

                // 자동 재생 재개
                if (this.autoplayEnabled) this.startAutoplay();
            },
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