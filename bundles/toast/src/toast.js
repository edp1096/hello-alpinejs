// src/toast.js
import toastTemplate from './toast.html';
import './toast.scss';

export function registerToast(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // 커스텀 toast 태그 정의
    if (typeof customElements !== 'undefined' && !customElements.get('my-toast')) {
        class ToastElement extends HTMLElement {
            connectedCallback() {
                // 옵션 속성 처리
                const positionAttr = this.getAttribute('position');
                const durationAttr = this.getAttribute('duration');
                const maxToastsAttr = this.getAttribute('max-toasts');

                let localConfig = { ...config };

                if (positionAttr) {
                    localConfig.position = positionAttr;
                }

                if (durationAttr) {
                    localConfig.duration = parseInt(durationAttr) || 3000;
                }

                if (maxToastsAttr) {
                    localConfig.maxToasts = parseInt(maxToastsAttr) || 5;
                }

                // 템플릿 설정
                this.innerHTML = toastTemplate;

                // Alpine 데이터 객체에 localConfig 전달
                if (this.id) {
                    window.Alpine.store('toastConfig_' + this.id, localConfig);
                }
            }

            disconnectedCallback() {
                // 태그가 문서에서 제거될 때 정리 작업
                if (this.id) {
                    window.Alpine.store('toastConfig_' + this.id, null);
                }
            }
        }

        customElements.define('my-toast', ToastElement);
    }

    window.Alpine.data('toast', () => {
        return {
            // 위치별로 토스트 아이템을 그룹화
            itemGroups: {
                'top-right': [],
                'top-left': [],
                'top-center': [],
                'bottom-right': [],
                'bottom-left': [],
                'bottom-center': []
            },
            position: config.position || 'top-right',
            duration: config.duration || 3000,
            maxToasts: config.maxToasts || 5,
            toastIdCounter: 0,

            init() {
                // 요소의 ID를 확인하고 해당 설정 가져오기
                if (this.$el && this.$el.closest('my-toast') && this.$el.closest('my-toast').id) {
                    const customConfig = window.Alpine.store('toastConfig_' + this.$el.closest('my-toast').id);
                    if (customConfig) {
                        this.position = customConfig.position || this.position;
                        this.duration = customConfig.duration || this.duration;
                        this.maxToasts = customConfig.maxToasts || this.maxToasts;
                    }
                }

                // Global API 등록
                if (!window.toast) {
                    window.toast = {
                        success: (message, options = {}) => this.addToast({ message, type: 'success', ...options }),
                        error: (message, options = {}) => this.addToast({ message, type: 'error', ...options }),
                        warning: (message, options = {}) => this.addToast({ message, type: 'warning', ...options }),
                        info: (message, options = {}) => this.addToast({ message, type: 'info', ...options }),
                        setPosition: (position) => { this.position = position; }
                    };
                }

                // 커스텀 이벤트 리스너 추가
                const myToastElement = this.$el.closest('my-toast');
                if (myToastElement) {
                    myToastElement.addEventListener('show-toast', (event) => {
                        if (event.detail) {
                            this.addToast(event.detail);
                        }
                    });
                }
            },

            // 특정 위치의 토스트 아이템 목록 반환
            getItemsForPosition(position) {
                return this.itemGroups[position] || [];
            },

            // 모든 위치의 토스트 아이템 수 반환
            getTotalItems() {
                return Object.values(this.itemGroups).reduce((sum, items) => sum + items.length, 0);
            },

            addToast(options) {
                // 고유 ID 생성
                const toastId = this.toastIdCounter++;

                // 토스트 위치 결정
                const position = options.position || this.position;

                // 기본 옵션 설정
                const toast = {
                    id: toastId,
                    title: options.title || this.getDefaultTitle(options.type),
                    message: options.message || '',
                    type: options.type || 'info',
                    duration: options.duration || this.duration,
                    visible: true,
                    closable: options.closable !== false,
                    showProgress: options.showProgress !== false,
                    progress: 100,
                    timerId: null
                };

                // 해당 위치 그룹이 없으면 생성
                if (!this.itemGroups[position]) {
                    this.itemGroups[position] = [];
                }

                // 최대 토스트 개수 제한 (위치별로 적용)
                if (this.itemGroups[position].length >= this.maxToasts) {
                    const oldestToast = this.itemGroups[position][0];
                    if (oldestToast && oldestToast.timerId) {
                        clearTimeout(oldestToast.timerId);
                    }
                    // 즉시 제거
                    this.itemGroups[position].shift();
                }

                // 토스트 추가
                this.itemGroups[position].push(toast);

                // 자동 제거 타이머 설정
                if (toast.duration > 0) {
                    // 프로그레스 바 업데이트
                    const startTime = Date.now();
                    const endTime = startTime + toast.duration;

                    const updateProgress = () => {
                        const now = Date.now();
                        const remaining = endTime - now;
                        const progress = (remaining / toast.duration) * 100;

                        // ID로 토스트 찾기 (모든 위치 그룹에서 검색)
                        let found = false;
                        for (const [pos, items] of Object.entries(this.itemGroups)) {
                            const toastItem = items.find(item => item.id === toastId);
                            if (toastItem) {
                                toastItem.progress = Math.max(0, progress);
                                found = true;
                                break;
                            }
                        }

                        if (found && progress > 0) {
                            requestAnimationFrame(updateProgress);
                        }
                    };

                    if (toast.showProgress) {
                        requestAnimationFrame(updateProgress);
                    }

                    toast.timerId = setTimeout(() => {
                        this.removeToast(toastId);
                    }, toast.duration);
                }

                return toastId;
            },

            removeToast(id) {
                // 모든 위치 그룹에서 토스트 찾기
                for (const position of Object.keys(this.itemGroups)) {
                    const index = this.itemGroups[position].findIndex(item => item.id === id);
                    if (index !== -1) {
                        // 토스트 찾았을 때 visible 플래그 변경
                        this.itemGroups[position][index].visible = false;

                        // 애니메이션 완료 후 제거
                        setTimeout(() => {
                            // 다시 검색하여 제거
                            this.itemGroups[position] = this.itemGroups[position].filter(item => item.id !== id);
                        }, 300);
                        break;
                    }
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
        };
    });

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                el.innerHTML = toastTemplate;
                // window.Alpine.nextTick(() => { window.Alpine.initTree(el); });
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
            // 기존 data-toast-mount 속성 초기화
            document.querySelectorAll('[data-toast-mount]').forEach(el => {
                const toast = registerToast();
                if (toast) { toast.mount(el); }
            });

            // 토스트 태그가 없으면 자동으로 생성
            if (!document.querySelector('my-toast')) {
                const globalToast = document.createElement('my-toast');
                globalToast.id = 'global-toast';
                document.body.appendChild(globalToast);
                registerToast();
            }

            // // 커스텀 태그 정의 알림
            // if (typeof customElements !== 'undefined') {
            //     customElements.whenDefined('my-toast').then(() => {
            //         console.log('my-toast custom element defined');
            //     });
            // }
        }
    });
}

window.ToastComponent = { registerToast };