// src/region-selector.js
import regionSelectorTemplate from './region-selector.html';
import './region-selector.scss';

// 전역 변수로 만들어 모든 곳에서 접근 가능하게 함
let RegionSelectorElement;

export function registerRegionSelector(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // 커스텀 element 클래스 정의 - 전역 변수에 할당
    RegionSelectorElement = class extends HTMLElement {
        constructor() {
            super();

            // Shadow DOM 생성
            this.attachShadow({ mode: 'open' });

            // 스타일 요소 생성
            const style = document.createElement('style');

            // 스타일 태그에 스타일 추가 (빌드 시스템에서 가져옴)
            fetch('./dist/region-selector-styles.css')
                .then(response => response.text())
                .then(css => {
                    style.textContent = css;
                    this.shadowRoot.appendChild(style);

                    // 템플릿 추가
                    const template = document.createElement('div');
                    template.innerHTML = regionSelectorTemplate;
                    this.shadowRoot.appendChild(template.firstChild);

                    // Alpine 초기화
                    if (window.Alpine) {
                        setTimeout(() => {
                            window.Alpine.initTree(this.shadowRoot);
                        }, 0);
                    }

                    // 컴포넌트 준비 완료 이벤트
                    this.dispatchEvent(new CustomEvent('region-selector-ready', {
                        bubbles: true,
                        composed: true
                    }));
                });
        }

        connectedCallback() {
            // 속성에서 설정 가져오기
            let localConfig = { ...config };

            // 도시/지역 데이터 속성 처리
            const citiesAttr = this.getAttribute('cities');
            const districtsAttr = this.getAttribute('districts');
            const selectorIdAttr = this.getAttribute('selector-id');
            const placeholderText = this.getAttribute('placeholder-text');

            if (citiesAttr) {
                try {
                    localConfig.cities = JSON.parse(citiesAttr);
                } catch (e) {
                    console.error('Failed to parse cities attribute:', e);
                }
            }

            if (districtsAttr) {
                try {
                    localConfig.districts = JSON.parse(districtsAttr);
                } catch (e) {
                    console.error('Failed to parse districts attribute:', e);
                }
            }

            if (selectorIdAttr) {
                localConfig.selectorId = selectorIdAttr;
            } else if (this.id) {
                localConfig.selectorId = this.id; // ID 속성이 있으면 selector-id로 사용
            }

            if (placeholderText) {
                localConfig.placeholderText = placeholderText;
            }

            // Alpine 스토어에 데이터 설정
            if (this.id) {
                window.Alpine.store('regionSelectorConfig_' + this.id, localConfig);
            }
        }

        disconnectedCallback() {
            // 태그가 문서에서 제거될 때 정리 작업
            if (this.id) {
                window.Alpine.store('regionSelectorConfig_' + this.id, null);
            }
        }

        // 선택된 지역을 가져오는 메서드 (외부에서 접근 가능)
        getSelectedRegion() {
            const regionSelector = this.shadowRoot.querySelector('[x-data="regionSelector"]');
            if (regionSelector && window.Alpine) {
                try {
                    const data = window.Alpine.$data(regionSelector);
                    return {
                        city: data.selectedCity,
                        district: data.selectedDistrict
                    };
                } catch (e) {
                    console.error('Error getting selected region:', e);
                }
            }
            return { city: null, district: null };
        }

        // 선택된 지역을 설정하는 메서드 (외부에서 접근 가능)
        setSelectedRegion(city, district) {
            const regionSelector = this.shadowRoot.querySelector('[x-data="regionSelector"]');
            if (regionSelector && window.Alpine) {
                try {
                    const data = window.Alpine.$data(regionSelector);
                    data.selectedCity = city;
                    setTimeout(() => {
                        data.selectedDistrict = district;
                    }, 100);
                } catch (e) {
                    console.error('Error setting selected region:', e);
                }
            }
        }
    };

    // 커스텀 요소 등록 함수 - 필요시 직접 호출
    const registerCustomElement = () => {
        if (typeof customElements != 'undefined' && !customElements.get('region-selector')) {
            customElements.define('region-selector', RegionSelectorElement);
            console.log('region-selector custom element defined');
            return true;
        }
        return false;
    };

    registerCustomElement(); // 바로 등록 시도

    window.Alpine.data('regionSelector', () => ({
        config: config,
        isOpen: false,
        selectedCity: null,
        selectedDistrict: null,
        defaultPlaceHolderText: '지역 선택',

        // 지역 데이터는 config에서 가져옴
        get cities() {
            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host && host.id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + host.id);
                if (customConfig && customConfig.cities) {
                    return customConfig.cities;
                }
            }

            return this.config.cities || [];
        },

        get districts() {
            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host && host.id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + host.id);
                if (customConfig && customConfig.districts) {
                    return customConfig.districts;
                }
            }

            return this.config.districts || [];
        },

        // 선택기 ID를 config에서 가져옴
        get selectorId() {
            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host && host.id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + host.id);
                if (customConfig && customConfig.selectorId) {
                    return customConfig.selectorId;
                }

                return host.id; // selector-id 속성이 없으면 요소의 id를 반환
            }

            return this.config.selectorId || '';
        },

        // 플레이스홀더 텍스트 가져오기 (사용자 정의 가능)
        get placeholderText() {
            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host && host.id) {
                const customConfig = window.Alpine.store('regionSelectorConfig_' + host.id);
                if (customConfig && customConfig.placeholderText) {
                    return customConfig.placeholderText;
                }
            }

            return this.defaultPlaceHolderText;
        },

        // 현재 선택된 지역 표시 텍스트
        get displayText() {
            if (this.selectedCity && this.selectedDistrict) {
                return `${this.selectedCity.name} > ${this.selectedDistrict.name.replace(this.selectedCity.name + ' ', '')}`;
            }
            return this.placeholderText;
        },

        // 선택된 시/도에 맞는 군/구 필터링
        get filteredDistricts() {
            if (!this.selectedCity) return [];
            return this.districts.filter(district => district.cityId == this.selectedCity.id);
        },

        // 드롭다운 토글
        toggleDropdown() {
            this.isOpen = !this.isOpen;
        },

        // 드롭다운 닫기
        closeDropdown() {
            this.isOpen = false;
        },

        // 시/도 선택
        selectCity(city) {
            this.selectedCity = city;
            // 시/도만 선택하고 군/구는 선택하지 않은 상태로 초기화
            this.selectedDistrict = null;

            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host) {
                // 이벤트 발생
                const selectedEvent = new CustomEvent('region-selected', {
                    detail: {
                        city: this.selectedCity,
                        district: null,
                        selectorId: this.selectorId
                    },
                    bubbles: true,
                    composed: true // Shadow DOM 경계를 넘어 이벤트 전파
                });
                host.dispatchEvent(selectedEvent);
            }

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: this.selectedCity,
                    district: null,
                    selectorId: this.selectorId
                });
            }
        },

        // 군/구 선택
        selectDistrict(district) {
            this.selectedDistrict = district;
            this.closeDropdown();

            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host) {
                // 선택된 지역 정보를 이벤트로 발생시킴
                const selectedEvent = new CustomEvent('region-selected', {
                    detail: {
                        city: this.selectedCity,
                        district: district,
                        selectorId: this.selectorId
                    },
                    bubbles: true,
                    composed: true // Shadow DOM 경계를 넘어 이벤트 전파
                });
                host.dispatchEvent(selectedEvent);
            }

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: this.selectedCity,
                    district: district,
                    selectorId: this.selectorId
                });
            }
        },

        // 전체 지역 선택
        selectAllRegions() {
            this.selectedCity = null;
            this.selectedDistrict = null;
            this.closeDropdown();

            // Shadow DOM에서 호스트 요소 가져오기
            const host = this.$el.getRootNode().host;
            if (host) {
                // 전체 지역 선택 이벤트 발생
                const selectedEvent = new CustomEvent('region-selected', {
                    detail: {
                        city: null,
                        district: null,
                        selectorId: this.selectorId
                    },
                    bubbles: true,
                    composed: true // Shadow DOM 경계를 넘어 이벤트 전파
                });
                host.dispatchEvent(selectedEvent);
            }

            // 콜백 함수가 있다면 호출
            if (typeof this.config.onSelect == 'function') {
                this.config.onSelect({
                    city: null,
                    district: null,
                    selectorId: this.selectorId
                });
            }
        },

        init() {
            // 초기 상태 설정
            if (this.config) {
                if (this.config.selectedCity) {
                    this.selectedCity = this.config.selectedCity;
                }
                if (this.config.selectedDistrict) {
                    this.selectedDistrict = this.config.selectedDistrict;
                }
            }
        }
    }));

    return {
        mount(el) {
            if (typeof el == 'string') {
                el = document.querySelector(el);
            }

            if (el) {
                // Shadow DOM 적용으로 mount 메서드 수정
                el.innerHTML = '';
                const shadowRoot = el.attachShadow({ mode: 'open' });

                // 스타일 요소 생성
                const style = document.createElement('style');

                // CSS 가져오기
                fetch('./dist/region-selector-styles.css')
                    .then(response => response.text())
                    .then(css => {
                        style.textContent = css;
                        shadowRoot.appendChild(style);

                        // 템플릿 추가
                        const template = document.createElement('div');
                        template.innerHTML = regionSelectorTemplate;
                        shadowRoot.appendChild(template.firstChild);

                        // Alpine 초기화
                        if (window.Alpine) {
                            setTimeout(() => {
                                window.Alpine.initTree(shadowRoot);
                            }, 0);
                        }
                    });
            } else {
                console.error('Cannot find target element.', el);
            }
        },

        getTemplate() {
            return regionSelectorTemplate;
        },

        // 커스텀 엘리먼트 등록 메서드 노출
        registerCustomElement
    };
}

// 전역 객체 등록
window.RegionSelectorComponent = { registerRegionSelector };