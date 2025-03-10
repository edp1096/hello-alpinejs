// src/dropdown.js
import dropdownTemplate from './dropdown.html';
import './dropdown.scss';

// 기본 옵션 설정 - 빈 배열
const DEFAULT_OPTIONS = [];

// 아이콘 라이브러리 기본값
const DEFAULT_ICON_LIBRARIES = [
    'https://cdn.jsdelivr.net/npm/remixicon@3.2.0/fonts/remixicon.css'
];

// 전역 아이콘 관리자
const IconManager = {
    loadedLibraries: new Set(),
    initialized: false,

    init(libraries = DEFAULT_ICON_LIBRARIES) {
        if (this.initialized) return;

        // 페이지 로드 시 모든 아이콘 라이브러리를 헤드에 한 번만 추가
        libraries.forEach(url => {
            if (!document.querySelector(`link[href="${url}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                document.head.appendChild(link);
                this.loadedLibraries.add(url);
            }
        });

        this.initialized = true;
    },

    // Shadow DOM 내부에서도 아이콘 사용 가능하도록 링크 추가
    attachToShadow(shadowRoot, libraries = DEFAULT_ICON_LIBRARIES) {
        // 전역 초기화
        this.init(libraries);

        // Shadow DOM에 스타일시트 추가
        libraries.forEach(url => {
            const shadowLink = document.createElement('link');
            shadowLink.rel = 'stylesheet';
            shadowLink.href = url;
            shadowRoot.appendChild(shadowLink);
        });
    }
};

export function registerDropdown(config = {}) {
    if (!window.Alpine) {
        console.error('Alpine.js is not loaded. Please load Alpine.js first.');
        return null;
    }

    // 아이콘 라이브러리 설정
    const iconLibraries = config.iconLibraries || DEFAULT_ICON_LIBRARIES;

    // 전역 아이콘 초기화 (페이지당 한 번만 실행)
    IconManager.init(iconLibraries);

    // 커스텀 dropdown 태그 정의
    if (typeof customElements != 'undefined' && !customElements.get('my-dropdown')) {
        class DropdownElement extends HTMLElement {
            constructor() {
                super();

                // Shadow DOM 생성
                this.attachShadow({ mode: 'open' });

                // 컴포넌트 스타일 로드
                const style = document.createElement('style');

                // Shadow DOM에 아이콘 라이브러리 추가 (공유 리소스 사용)
                IconManager.attachToShadow(this.shadowRoot, iconLibraries);

                // 내부 스타일 로드 및 초기화
                fetch('./dist/dropdown-styles.css')
                    .then(response => response.text())
                    .then(css => {
                        style.textContent = css;
                        this.shadowRoot.appendChild(style);

                        // 템플릿 추가
                        const template = document.createElement('div');
                        template.innerHTML = dropdownTemplate;
                        this.shadowRoot.appendChild(template.firstChild);

                        // Alpine 초기화
                        if (window.Alpine) {
                            setTimeout(() => {
                                window.Alpine.initTree(this.shadowRoot);
                            }, 0);
                        }

                        // 속성 초기화
                        this.initializeAttributes();

                        // 컴포넌트 준비 완료 이벤트
                        this.dispatchEvent(new CustomEvent('dropdown-ready', {
                            bubbles: true,
                            composed: true
                        }));
                    });
            }

            initializeAttributes() {
                // option 태그를 처리하여 옵션 목록 구성
                let optionsFromChildren = [];
                const selectedValue = this.getAttribute('selected');
                let defaultOption = null;

                // 자식 노드에서 option 태그 처리
                const optionElements = this.querySelectorAll('option');
                if (optionElements.length > 0) {
                    optionsFromChildren = Array.from(optionElements).map(option => {
                        const name = option.textContent;
                        const value = option.getAttribute('value') || name;
                        const icon = option.getAttribute('icon') || 'ri-file-list-line';

                        const optionObj = { name, value, icon };

                        // 모든 추가 속성을 객체에 추가
                        Array.from(option.attributes).forEach(attr => {
                            // name, value, icon 외의 모든 속성 처리
                            if (!['value', 'icon'].includes(attr.name)) {
                                optionObj[attr.name] = attr.value;
                            }
                        });

                        // selected 속성으로 기본 선택 항목 확인
                        if (selectedValue && (selectedValue === value || selectedValue === name)) {
                            defaultOption = optionObj;
                        }

                        return optionObj;
                    });

                    // 첫 번째 option을 기본값으로 설정 (만약 selected가 없으면)
                    if (!defaultOption && optionsFromChildren.length > 0) {
                        defaultOption = optionsFromChildren[0];
                    }

                    // option 태그 삭제 (처리 완료했으므로)
                    optionElements.forEach(option => option.remove());
                }

                // 옵션 속성 처리
                const optionsAttr = this.getAttribute('options');
                const selectedAttr = this.getAttribute('selected');
                const positionAttr = this.getAttribute('position');
                const onSelectAttr = this.getAttribute('on-select');
                const configAttr = this.getAttribute('config');

                // 기본 설정 (빈 배열로 시작)
                let localConfig = {
                    options: optionsFromChildren.length > 0 ? optionsFromChildren : [...DEFAULT_OPTIONS],
                    defaultOption: defaultOption || null
                };

                // config 속성이 있으면 파싱해서 적용
                if (configAttr) {
                    try {
                        const parsedConfig = JSON.parse(configAttr);
                        Object.assign(localConfig, parsedConfig);
                    } catch (e) {
                        console.error('Invalid config attribute:', e);
                    }
                }

                // 개별 속성으로 덮어쓰기 - 옵션
                if (optionsAttr) {
                    try {
                        localConfig.options = JSON.parse(optionsAttr);
                    } catch (e) {
                        console.error('Invalid options attribute:', e);
                    }
                }

                // 개별 속성으로 덮어쓰기 - 선택된 옵션
                if (selectedAttr && optionsFromChildren.length === 0) {
                    try {
                        // 직접 JSON으로 입력한 경우
                        localConfig.defaultOption = JSON.parse(selectedAttr);
                    } catch (e) {
                        // 문자열로 이름이나 값을 입력한 경우
                        const selectedOption = localConfig.options.find(
                            opt => opt.name === selectedAttr || opt.value === selectedAttr
                        );
                        if (selectedOption) {
                            localConfig.defaultOption = selectedOption;
                        }
                    }
                }

                // 개별 속성으로 덮어쓰기 - 위치
                if (positionAttr) {
                    localConfig.position = positionAttr;
                }

                // on-select 속성 처리
                if (onSelectAttr) {
                    try {
                        // 전역 함수 참조 찾기
                        if (typeof window[onSelectAttr] === 'function') {
                            localConfig.onSelect = window[onSelectAttr];
                        } else {
                            console.warn(`함수 '${onSelectAttr}'를 찾을 수 없습니다.`);
                        }
                    } catch (e) {
                        console.error('Error setting onSelect callback:', e);
                    }
                }

                // 기본 선택 값이 없고 옵션이 있는 경우 첫 번째 옵션을 선택
                if (!localConfig.defaultOption && localConfig.options && localConfig.options.length > 0) {
                    localConfig.defaultOption = localConfig.options[0];
                }

                // Alpine 스토어에 데이터 설정
                if (this.id) {
                    window.Alpine.store('dropdownConfig_' + this.id, localConfig);
                } else {
                    // ID가 없는 경우 임의로 생성
                    const randomId = 'dropdown_' + Math.random().toString(36).substring(2, 11);
                    this.id = randomId;
                    window.Alpine.store('dropdownConfig_' + randomId, localConfig);
                }
            }

            disconnectedCallback() {
                // 태그가 문서에서 제거될 때 정리 작업
                if (this.id && window.Alpine && window.Alpine.store) {
                    try {
                        // 안전하게 store에서 빈 객체로 설정 (null 대신)
                        const storeKey = 'dropdownConfig_' + this.id;
                        if (typeof window.Alpine.store(storeKey) !== 'undefined') {
                            window.Alpine.store(storeKey, {});
                        }
                    } catch (e) {
                        console.warn('Error cleaning up dropdown:', e);
                    }
                }
            }

            /**
             * 새로운 옵션 추가
             * @param {Object} option - 추가할 옵션 객체 {name, icon, value, ...}
             */
            addOption(option) {
                if (!option || !option.name) return false;

                console.log('Adding option:', option);

                // 현재 설정 가져오기
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 중복 체크
                    const isDuplicate = config.options.some(opt =>
                        (opt.value && opt.value === option.value) ||
                        (opt.name && opt.name === option.name)
                    );

                    if (isDuplicate) {
                        console.warn('중복된 옵션:', option);
                        return false;
                    }

                    // 새 드롭다운 생성 및 교체
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 새 옵션 목록 생성
                    const newOptions = [...config.options, option];

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: newOptions,
                        defaultOption: config.defaultOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정 (JSON으로 직렬화 불가)
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }
                return false;
            }

            /**
             * 옵션 제거
             * @param {string|number} identifier - 제거할 옵션의 value, name 또는 인덱스
             */
            removeOption(identifier) {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 옵션 복사
                    const options = [...config.options];
                    let newOptions = [];
                    let removed = false;

                    if (typeof identifier === 'number') {
                        // 인덱스로 제거
                        if (identifier >= 0 && identifier < options.length) {
                            newOptions = [
                                ...options.slice(0, identifier),
                                ...options.slice(identifier + 1)
                            ];
                            removed = true;
                        }
                    } else {
                        // value 또는 name으로 제거
                        newOptions = options.filter(option =>
                            option.value !== identifier && option.name !== identifier
                        );
                        removed = newOptions.length < options.length;
                    }

                    if (removed) {
                        // 새 드롭다운 생성
                        const newDropdown = document.createElement('my-dropdown');
                        newDropdown.id = this.id;

                        // 선택된 항목 체크
                        let selectedOption = config.defaultOption;

                        // 선택된 항목이 제거됐는지 확인
                        const selectedRemoved = config.defaultOption && !newOptions.some(opt =>
                            (opt.value === config.defaultOption.value) ||
                            (opt.name === config.defaultOption.name)
                        );

                        // 선택된 항목이 제거됐으면 첫 번째 항목 선택
                        if (selectedRemoved && newOptions.length > 0) {
                            selectedOption = newOptions[0];
                        } else if (newOptions.length === 0) {
                            selectedOption = null;
                        }

                        // 새 설정 적용
                        newDropdown.setAttribute('config', JSON.stringify({
                            options: newOptions,
                            defaultOption: selectedOption
                        }));

                        // 이벤트 핸들러가 있으면 직접 설정
                        if (config.onSelect) {
                            setTimeout(() => {
                                window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                    ...JSON.parse(newDropdown.getAttribute('config')),
                                    onSelect: config.onSelect
                                });
                            }, 0);
                        }

                        // 기존 요소 교체
                        this.replaceWith(newDropdown);
                        return true;
                    }
                }
                return false;
            }

            /**
             * 특정 옵션 업데이트
             * @param {string|number} identifier - 업데이트할 옵션의 value, name 또는 인덱스
             * @param {Object} newProps - 업데이트할 속성 {name, icon, value, ...}
             */
            updateOption(identifier, newProps) {
                if (!newProps || typeof newProps !== 'object') return false;

                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 옵션 복사
                    const options = [...config.options];
                    let updated = false;
                    let targetIndex = -1;

                    if (typeof identifier === 'number') {
                        // 인덱스로 업데이트
                        if (identifier >= 0 && identifier < options.length) {
                            targetIndex = identifier;
                            updated = true;
                        }
                    } else {
                        // value 또는 name으로 업데이트
                        targetIndex = options.findIndex(option =>
                            option.value === identifier || option.name === identifier
                        );
                        updated = targetIndex !== -1;
                    }

                    if (updated) {
                        // 특정 옵션 업데이트
                        const oldOption = options[targetIndex];
                        options[targetIndex] = { ...oldOption, ...newProps };

                        // 새 드롭다운 생성
                        const newDropdown = document.createElement('my-dropdown');
                        newDropdown.id = this.id;

                        // 선택된 항목이 업데이트된 경우 처리
                        let selectedOption = config.defaultOption;
                        if (config.defaultOption &&
                            (config.defaultOption.value === oldOption.value ||
                                config.defaultOption.name === oldOption.name)) {
                            selectedOption = options[targetIndex];
                        }

                        // 새 설정 적용
                        newDropdown.setAttribute('config', JSON.stringify({
                            options: options,
                            defaultOption: selectedOption
                        }));

                        // 이벤트 핸들러가 있으면 직접 설정
                        if (config.onSelect) {
                            setTimeout(() => {
                                window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                    ...JSON.parse(newDropdown.getAttribute('config')),
                                    onSelect: config.onSelect
                                });
                            }, 0);
                        }

                        // 기존 요소 교체
                        this.replaceWith(newDropdown);
                        return true;
                    }
                }
                return false;
            }

            /**
             * 모든 옵션 업데이트
             * @param {Array} newOptions - 새로운 옵션 배열
             */
            updateOptions(newOptions) {
                if (!Array.isArray(newOptions)) return false;

                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (config) {
                    // 새 드롭다운 생성
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 선택된 항목 확인
                    let selectedOption = config.defaultOption;

                    // 선택된 항목이 새 목록에 있는지 확인
                    const selectedExists = config.defaultOption && newOptions.some(opt =>
                        (opt.value && opt.value === config.defaultOption.value) ||
                        (opt.name && opt.name === config.defaultOption.name)
                    );

                    // 선택된 항목이 없으면 첫 번째 항목 선택
                    if (!selectedExists && newOptions.length > 0) {
                        selectedOption = newOptions[0];
                    } else if (newOptions.length === 0) {
                        selectedOption = null;
                    }

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: newOptions,
                        defaultOption: selectedOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }
                return false;
            }

            /**
             * 현재 옵션 목록 가져오기
             * @returns {Array} 옵션 배열
             */
            getOptions() {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);
                return config && config.options ? [...config.options] : [];
            }

            /**
             * 선택된 옵션 설정
             * @param {Object|string} option - 선택할 옵션 객체 또는 value/name
             */
            setSelectedOption(option) {
                const storeKey = 'dropdownConfig_' + this.id;
                const config = window.Alpine.store(storeKey);

                if (!config) return false;

                // 찾을 옵션 결정
                let selectedOption = null;

                if (typeof option === 'string') {
                    // 문자열인 경우 value 또는 name으로 옵션 찾기
                    selectedOption = config.options.find(opt =>
                        opt.value === option || opt.name === option
                    );
                } else if (option && typeof option === 'object') {
                    // 객체인 경우 직접 사용
                    selectedOption = option;
                }

                if (selectedOption) {
                    // 새 드롭다운 생성
                    const newDropdown = document.createElement('my-dropdown');
                    newDropdown.id = this.id;

                    // 새 설정 적용
                    newDropdown.setAttribute('config', JSON.stringify({
                        options: config.options,
                        defaultOption: selectedOption
                    }));

                    // 이벤트 핸들러가 있으면 직접 설정
                    if (config.onSelect) {
                        setTimeout(() => {
                            window.Alpine.store('dropdownConfig_' + newDropdown.id, {
                                ...JSON.parse(newDropdown.getAttribute('config')),
                                onSelect: config.onSelect
                            });
                        }, 0);
                    }

                    // 기존 요소 교체
                    this.replaceWith(newDropdown);
                    return true;
                }

                return false;
            }
        }

        customElements.define('my-dropdown', DropdownElement);
    }

    window.Alpine.data('dropdown', () => {
        return {
            init() {
                // Shadow DOM 환경에서 호스트 요소 접근
                const host = this.$el.getRootNode().host;
                if (host && host.id) {
                    const storeConfig = window.Alpine.store('dropdownConfig_' + host.id);
                    if (storeConfig) {
                        // 설정 복사
                        this.options = storeConfig.options || [];
                        this.selectedOption = storeConfig.defaultOption || null;
                        this.onSelect = storeConfig.onSelect;
                    }
                }
            },
            isOpen: false,
            options: [],
            selectedOption: null,
            onSelect: null,

            // 옵션이 없을 때 표시할 기본 값을 반환하는 getter
            get displayName() {
                return this.selectedOption ? this.selectedOption.name : 'Select option';
            },

            get displayIcon() {
                return this.selectedOption ? this.selectedOption.icon : 'ri-user-3-line';
            },

            toggle() {
                this.isOpen = !this.isOpen;
            },

            selectOption(option) {
                this.selectedOption = option;
                this.isOpen = false;

                // 콜백 호출
                if (typeof this.onSelect === 'function') {
                    this.onSelect(option);
                }

                // 커스텀 이벤트 발생 - Shadow DOM 경계를 넘도록 설정
                const host = this.$el.getRootNode().host;
                if (host) {
                    host.dispatchEvent(new CustomEvent('option-selected', {
                        detail: { option },
                        bubbles: true,
                        composed: true // Shadow DOM 경계를 넘어 이벤트 전파
                    }));
                }
            }
        };
    });

    const controller = {
        mount(el) {
            if (typeof el == 'string') { el = document.querySelector(el); }

            if (el) {
                // Shadow DOM 적용으로 mount 메서드 수정
                el.innerHTML = '';
                const shadowRoot = el.attachShadow({ mode: 'open' });

                // 스타일 요소 생성
                const style = document.createElement('style');

                // Shadow DOM에 아이콘 라이브러리 추가 (공유 리소스 사용)
                IconManager.attachToShadow(shadowRoot, iconLibraries);

                // CSS 가져오기
                fetch('./dist/dropdown-styles.css')
                    .then(response => response.text())
                    .then(css => {
                        style.textContent = css;
                        shadowRoot.appendChild(style);

                        // 템플릿 추가
                        const template = document.createElement('div');
                        template.innerHTML = dropdownTemplate;
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

        getTemplate() { return dropdownTemplate; }
    };

    return controller;
}

// Auto initialization after the document is fully loaded
if (typeof document != 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (window.Alpine) {
            // 기본 드롭다운 컴포넌트 등록
            registerDropdown();

            // 기존 data-dropdown-mount 속성 초기화
            document.querySelectorAll('[data-dropdown-mount]').forEach(el => {
                const dropdown = registerDropdown();
                if (dropdown) { dropdown.mount(el); }
            });

            // 커스텀 태그 정의 확인
            if (typeof customElements != 'undefined') {
                customElements.whenDefined('my-dropdown').then(() => {
                    console.log('my-dropdown custom element defined');
                });
            }
        }
    });
}

// 라이브러리 커스터마이징을 위한 인터페이스
window.DropdownComponent = {
    registerDropdown,
    // 추가 아이콘 라이브러리 등록 (런타임)
    registerIconLibrary(url) {
        if (!IconManager.loadedLibraries.has(url)) {
            // 헤드에 추가
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
            IconManager.loadedLibraries.add(url);
        }
    }
};