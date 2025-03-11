document.addEventListener('alpine:init', () => {
    // App data
    Alpine.data('appData', () => ({
        isSidebarOpen: window.innerWidth >= 992,
        isSidebarCollapsed: false,
        activeMenu: 'dashboard',
        openSubmenus: [],
        user: {
            name: 'John Doe',
            role: 'Administrator',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        },

        init() {
            // 로딩 화면 숨기기
            this.hideLoading();

            // 반응형 화면 조정
            this.checkScreenSize();
            window.addEventListener('resize', () => this.checkScreenSize());

            // 전역 클릭 이벤트로 드롭다운 닫기 처리
            window.addEventListener('click', (e) => {
                // 드롭다운 영역 밖을 클릭했을 때만 이벤트 발생
                if (!e.target.closest('.dropdown')) {
                    window.dispatchEvent(new CustomEvent('close-dropdowns'));
                }
            });
        },

        hideLoading() {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => {
                    loading.style.visibility = 'hidden';
                }, 300);
            }
        },

        checkScreenSize() {
            if (window.innerWidth < 992 && this.isSidebarOpen) {
                this.isSidebarOpen = false;
            }
        },

        isLargeScreen() {
            return window.innerWidth >= 992;
        },

        toggleSidebar() {
            this.isSidebarOpen = !this.isSidebarOpen;
        },

        toggleCollapse() {
            this.isSidebarCollapsed = !this.isSidebarCollapsed;

            // 사이드바 축소 상태를 body 클래스로 반영
            if (this.isSidebarCollapsed) {
                document.body.classList.add('sidebar-collapse');
            } else {
                document.body.classList.remove('sidebar-collapse');
            }
        },

        closeSidebar() {
            if (!this.isLargeScreen()) {
                this.isSidebarOpen = false;
            }
        },

        setActiveMenu(menu) {
            this.activeMenu = menu;
            this.closeSidebar();
        },

        toggleSubmenu(submenu) {
            if (this.isSubmenuOpen(submenu)) {
                this.openSubmenus = this.openSubmenus.filter(item => item !== submenu);
            } else {
                this.openSubmenus.push(submenu);
            }
        },

        isSubmenuOpen(submenu) {
            return this.openSubmenus.includes(submenu);
        }
    }));

    // Navigation data
    Alpine.data('navData', () => ({
        activeDropdown: null,
        notifications: [
            { message: 'New user registered', time: '5 minutes ago', unread: true },
            { message: 'Server CPU is at 90%', time: '1 hour ago', unread: true },
            { message: 'New version available', time: '2 hours ago', unread: false }
        ],

        toggleDropdown(dropdown) {
            this.activeDropdown = this.activeDropdown === dropdown ? null : dropdown;
        },

        getUnreadCount(type) {
            if (type === 'notifications') {
                return this.notifications.filter(n => n.unread).length;
            }
            return 0;
        },

        init() {
            // 전역 이벤트 리스너로 드롭다운 닫기
            window.addEventListener('close-dropdowns', () => {
                this.activeDropdown = null;
            });
        },

        closeAllDropdowns() {
            this.activeDropdown = null;
        }
    }));
});