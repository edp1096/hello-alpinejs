document.addEventListener('DOMContentLoaded', function () {
    // 컴포넌트 검색 기능
    const searchInput = document.getElementById('search-components');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            const componentCards = document.querySelectorAll('.component-card');

            componentCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                const description = card.querySelector('.card-description').textContent.toLowerCase();
                const tags = card.getAttribute('data-tags')?.toLowerCase() || '';

                if (title.includes(searchTerm) || description.includes(searchTerm) || tags.includes(searchTerm)) {
                    card.style.display = '';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // 전체 선택/해제 기능
    const selectAllBtn = document.getElementById('select-all');
    const deselectAllBtn = document.getElementById('deselect-all');

    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', function () {
            const checkboxes = document.querySelectorAll('.component-checkbox');
            checkboxes.forEach(checkbox => {
                if (!checkbox.disabled) {
                    checkbox.checked = true;
                }
            });
            updateSelectedCount();
        });
    }

    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', function () {
            const checkboxes = document.querySelectorAll('.component-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
            updateSelectedCount();
        });
    }

    // 선택된 컴포넌트 수 업데이트
    function updateSelectedCount() {
        const selectedCount = document.querySelectorAll('.component-checkbox:checked').length;
        const selectedCountElement = document.getElementById('selected-count');

        if (selectedCountElement) {
            selectedCountElement.textContent = selectedCount.toString();

            // 번들 생성 버튼 활성화/비활성화
            const createBundleBtn = document.getElementById('create-bundle-btn');
            if (createBundleBtn) {
                createBundleBtn.disabled = selectedCount === 0;
            }
        }
    }

    // 이벤트 위임을 사용하여 동적으로 생성된 체크박스에 이벤트 리스너 추가
    const componentsList = document.getElementById('components-list');
    if (componentsList) {
        componentsList.addEventListener('change', function (e) {
            // 체크박스 변경 이벤트만 처리
            if (e.target && e.target.classList.contains('component-checkbox')) {
                updateSelectedCount();
            }
        });
    }

    // 초기 선택 컴포넌트 수 업데이트
    updateSelectedCount();

    // 번들 생성 폼 제출
    const bundleForm = document.getElementById('bundle-form');
    if (bundleForm) {
        bundleForm.addEventListener('submit', function (e) {
            e.preventDefault();
            createBundle();
        });
    }

    // 번들 생성 함수
    async function createBundle() {
        // 선택된 컴포넌트 수집
        const selectedComponents = [];
        document.querySelectorAll('.component-checkbox:checked').forEach(checkbox => {
            selectedComponents.push(checkbox.value);
        });

        if (selectedComponents.length === 0) {
            showAlert('error', '하나 이상의 컴포넌트를 선택해주세요.');
            return;
        }

        // 번들 옵션 수집
        const options = {
            minify: document.getElementById('option-minify')?.checked !== false,
            sourcemap: document.getElementById('option-sourcemap')?.checked === true
        };

        // UI 상태 업데이트
        const createBundleBtn = document.getElementById('create-bundle-btn');
        const bundleSpinner = document.getElementById('bundle-spinner');
        const bundleResult = document.getElementById('bundle-result');

        if (createBundleBtn) createBundleBtn.disabled = true;
        if (bundleSpinner) bundleSpinner.style.display = 'flex';
        if (bundleResult) bundleResult.style.display = 'none';

        try {
            // 번들 생성 요청
            console.log('번들 생성 요청 중...');
            const response = await fetch('/bundle/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    components: selectedComponents,
                    options: options
                })
            });

            // 응답 처리
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '번들 생성 요청이 실패했습니다.');
            }

            const data = await response.json();
            console.log('번들 생성 응답:', data);

            if (!data.success) {
                throw new Error(data.error || '번들 생성에 실패했습니다.');
            }

            // 번들 상태 확인 및 다운로드 준비
            await checkBundleStatus(data.bundleId);

        } catch (error) {
            console.error('번들 생성 오류:', error);
            showAlert('error', `번들 생성 오류: ${error.message}`);

            // UI 상태 복원
            if (createBundleBtn) createBundleBtn.disabled = false;
            if (bundleSpinner) bundleSpinner.style.display = 'none';
        }
    }

    // 번들 상태 확인 함수
    async function checkBundleStatus(bundleId, retries = 10) {
        console.log(`번들 상태 확인 중... (${bundleId})`);

        if (retries <= 0) {
            throw new Error('번들 생성 시간이 초과되었습니다.');
        }

        try {
            const response = await fetch(`/bundle/status/${bundleId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '번들 상태 확인에 실패했습니다.');
            }

            const data = await response.json();
            console.log('번들 상태:', data);

            if (data.success && data.status === 'ready') {
                // 번들 준비 완료 - 다운로드 링크 표시
                showBundleResult(bundleId, data);
                return;
            }

            // 아직 준비 중 - 재시도
            setTimeout(() => checkBundleStatus(bundleId, retries - 1), 1000);

        } catch (error) {
            console.error('번들 상태 확인 오류:', error);

            // 일시적 오류일 수 있으므로 재시도
            setTimeout(() => checkBundleStatus(bundleId, retries - 1), 2000);
        }
    }

    // 번들 결과 표시
    function showBundleResult(bundleId, statusData) {
        const bundleSpinner = document.getElementById('bundle-spinner');
        const bundleResult = document.getElementById('bundle-result');
        const downloadBtn = document.getElementById('download-bundle-btn');
        const createBundleBtn = document.getElementById('create-bundle-btn');
        const resultMessage = document.getElementById('bundle-result-message');

        // 스피너 숨기기
        if (bundleSpinner) bundleSpinner.style.display = 'none';

        // 결과 영역 표시
        if (bundleResult) bundleResult.style.display = 'block';

        // 다운로드 버튼 설정
        if (downloadBtn) {
            downloadBtn.href = `/bundle/download/${bundleId}`;
            downloadBtn.style.display = 'inline-block';

            // 파일 크기 정보 추가 (옵션)
            if (statusData && statusData.fileSize) {
                const fileSizeKB = Math.round(statusData.fileSize / 1024);
                downloadBtn.setAttribute('title', `파일 크기: ${fileSizeKB}KB`);
            }
        }

        // 결과 메시지 설정
        if (resultMessage) {
            resultMessage.textContent = '번들이 성공적으로 생성되었습니다. 아래 버튼을 클릭하여 다운로드하세요.';
        }

        // 생성 버튼 다시 활성화
        if (createBundleBtn) {
            createBundleBtn.disabled = false;
            createBundleBtn.textContent = '새 번들 생성';
        }

        // 알림 표시
        showAlert('success', '번들이 성공적으로 생성되었습니다.');
    }

    // 알림 표시 함수
    function showAlert(type, message) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // 닫기 버튼 추가
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'close-alert';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => alert.remove());

        alert.appendChild(closeBtn);
        alertContainer.appendChild(alert);

        // 자동 제거 타이머
        setTimeout(() => {
            alert.classList.add('fade-out');
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    }

    // 디버그 정보 토글
    const debugToggle = document.getElementById('debug-toggle');
    const debugInfo = document.getElementById('debug-info');

    if (debugToggle && debugInfo) {
        debugToggle.addEventListener('click', function () {
            debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
            debugToggle.textContent = debugInfo.style.display === 'none' ? '디버그 정보 표시' : '디버그 정보 숨기기';
        });
    }
});

// 컴포넌트 목록이 동적으로 로드된 후 체크박스 이벤트를 다시 연결하는 함수
function setupComponentCheckboxes() {
    // 선택된 컴포넌트 수 업데이트
    function updateSelectedCount() {
        const selectedCount = document.querySelectorAll('.component-checkbox:checked').length;
        const selectedCountElement = document.getElementById('selected-count');

        if (selectedCountElement) {
            selectedCountElement.textContent = selectedCount.toString();

            // 번들 생성 버튼 활성화/비활성화
            const createBundleBtn = document.getElementById('create-bundle-btn');
            if (createBundleBtn) {
                createBundleBtn.disabled = selectedCount === 0;
            }
        }
    }

    // 모든 체크박스에 이벤트 리스너 연결
    const checkboxes = document.querySelectorAll('.component-checkbox');
    checkboxes.forEach(checkbox => {
        // 이전 이벤트 리스너 제거 (중복 방지)
        checkbox.removeEventListener('change', updateSelectedCount);
        // 새 이벤트 리스너 추가
        checkbox.addEventListener('change', updateSelectedCount);
    });

    // 초기 카운트 업데이트
    updateSelectedCount();

    console.log(`${checkboxes.length}개 체크박스에 이벤트 리스너가 연결되었습니다.`);
}