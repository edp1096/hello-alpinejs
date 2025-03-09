// src/toast.js
import toastTemplate from './toast.html';
import './toast.scss';

export function registerToast(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    window.Alpine.data('toast', () => ({
        items: [],
        position: config.position || 'top-right',
        duration: config.duration || 3000,
        maxToasts: config.maxToasts || 5,

        init() {
            // Global API 등록
            if (!window.toast) {
                window.toast = {
                    success: (message, options = {}) => this.addToast({ message, type: 'success', ...options }),
                    error: (message, options = {}) => this.addToast({ message, type: 'error', ...options }),
                    warning: (message, options = {}) => this.addToast({ message, type: 'warning', ...options }),
                    info: (message, options = {}) => this.addToast({ message, type: 'info', ...options })
                };
            }
        },

        addToast(options) {
            // 기본 옵션 설정
            const toast = {
                title: options.title || this.getDefaultTitle(options.type),
                message: options.message || '',
                type: options.type || 'info',
                duration: options.duration || this.duration,
                visible: true,
                closable: options.closable !== false, // 기본값은 true
                showProgress: options.showProgress !== false, // 기본값은 true
                progress: 100,
                timerId: null
            };

            // 최대 토스트 개수 제한
            if (this.items.length >= this.maxToasts) {
                clearTimeout(this.items[0].timerId);
                this.items.shift();
            }

            // 토스트 추가
            this.items.push(toast);
            const index = this.items.length - 1;

            // 자동 제거 타이머 설정
            if (toast.duration > 0) {
                // 프로그레스 바 업데이트
                const startTime = Date.now();
                const endTime = startTime + toast.duration;

                const updateProgress = () => {
                    const now = Date.now();
                    const remaining = endTime - now;
                    const progress = (remaining / toast.duration) * 100;

                    if (this.items[index]) {
                        this.items[index].progress = Math.max(0, progress);

                        if (progress > 0) {
                            requestAnimationFrame(updateProgress);
                        }
                    }
                };

                if (toast.showProgress) {
                    requestAnimationFrame(updateProgress);
                }

                toast.timerId = setTimeout(() => {
                    this.removeToast(index);
                }, toast.duration);
            }

            return index; // 추가된 토스트의 인덱스 반환
        },

        removeToast(index) {
            if (this.items[index]) {
                this.items[index].visible = false;

                // 애니메이션 완료 후 제거
                setTimeout(() => {
                    this.items = this.items.filter((_, i) => i !== index);
                }, 300); // 300ms는 애니메이션 지속 시간과 일치해야 함
            }
        },

        getDefaultTitle(type) {
            switch (type) {
                case 'success': return '성공';
                case 'error': return '오류';
                case 'warning': return '경고';
                case 'info': return '정보';
                default: return '';
            }
        }
    }));

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = toastTemplate;
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() { return toastTemplate; }
    };

    return controller;
}

// Auto initialization after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            document.querySelectorAll('[data-toast-mount]').forEach(el => {
                const toast = registerToast();
                if (toast) { toast.mount(el); }
            });
        }
    });
}

window.ToastComponent = { registerToast };