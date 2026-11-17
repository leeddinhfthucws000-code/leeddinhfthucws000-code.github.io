/* ================================================================
   ZABORAN — CYBERSECURITY PORTFOLIO
   File: script.js
   Mô tả: Toàn bộ logic tương tác cho trang portfolio
   Bao gồm: chuyển tab, canvas nền mạch điện, typing effect,
            lọc dự án, copy email, xử lý form mailto.
   ================================================================ */

/* ----------------------------------------------------------------
   0. KHỞI TẠO CHUNG
   Chờ DOM load xong rồi mới chạy toàn bộ logic.
   ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function () {

    /* ============================================================
       1. HỆ THỐNG CHUYỂN ĐỔI GIỮA 4 MỤC (TAB/SECTION)
       ============================================================ */

    /**
     * Hàm dùng chung để chuyển sang một section bất kỳ.
     * @param {string} targetId - ID của section cần hiển thị
     *                            (home | projects | roadmap | contact)
     *
     * Các bước thực hiện:
     *   1. Ẩn tất cả .page-section (bỏ class active)
     *   2. Hiển thị section có id === targetId (thêm class active)
     *   3. Cập nhật trạng thái active cho nút navbar tương ứng
     *   4. Cuộn mượt lên đầu trang
     */
    function switchSection(targetId) {
        // --- Bước 1: Lấy tất cả section và ẩn hết ---
        const allSections = document.querySelectorAll('.page-section');
        allSections.forEach(function (section) {
            section.classList.remove('active');
        });

        // --- Bước 2: Tìm section đích và hiển thị ---
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // --- Bước 3: Cập nhật trạng thái active trên navbar ---
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(function (link) {
            // Nếu data-target của nút trùng với targetId -> active
            if (link.getAttribute('data-target') === targetId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // --- Bước 4: Cuộn mượt lên đầu trang ---
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ------------------------------------------------------------
       1.1. Gắn sự kiện cho các nút điều hướng
       Bao gồm:
         - Nút navbar ([data-target])
         - Thẻ preview & View Details ([data-goto])
         - Nút Back to Home ([data-target])
         - Logo cố định (#floating-logo)
         - Tên thương hiệu ZaborAn (.brand)
       ------------------------------------------------------------ */

    // --- Nhóm 1: Mọi phần tử có thuộc tính data-target ---
    // (navbar links, brand, back buttons)
    const dataTargetElements = document.querySelectorAll('[data-target]');
    dataTargetElements.forEach(function (el) {
        el.addEventListener('click', function (event) {
            event.preventDefault(); // Ngăn hành vi mặc định của thẻ <a>
            const target = el.getAttribute('data-target');
            switchSection(target);
        });
    });

    // --- Nhóm 2: Các thẻ preview và nút View Details có data-goto ---
    const dataGotoElements = document.querySelectorAll('[data-goto]');
    dataGotoElements.forEach(function (el) {
        el.addEventListener('click', function (event) {
            event.preventDefault();
            const target = el.getAttribute('data-goto');
            switchSection(target);
        });
    });

    // --- Nhóm 3: Logo cố định góc dưới bên trái ---
    // Luôn đưa về Home và cuộn lên đầu trang
    const floatingLogo = document.getElementById('floating-logo');
    if (floatingLogo) {
        floatingLogo.addEventListener('click', function (event) {
            event.preventDefault();
            switchSection('home');
        });
    }

    /* ============================================================
       2. HIỆU ỨNG NỀN MẠCH ĐIỆN TỬ LED (#circuit-bg)
       ============================================================ */

    /**
     * Khởi tạo và vẽ mạng lưới mạch điện tử PCB trên canvas.
     * - Các đường mạch màu xám cực tối, góc vuông 90 độ.
     * - Các xung LED trắng/bạc chạy dọc theo đường mạch.
     * - Tối ưu bằng requestAnimationFrame.
     * - Tự điều chỉnh kích thước khi resize.
     */
    (function initCircuitBackground() {
        const canvas = document.getElementById('circuit-bg');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        // --- Biến lưu kích thước canvas ---
        let width = 0;
        let height = 0;

        // --- Mảng chứa các đường mạch (mỗi đường là 1 mảng điểm) ---
        let traces = [];

        // --- Mảng chứa các xung LED đang chạy ---
        let pulses = [];

        // --- Cấu hình ---
        const CONFIG = {
            gridSize: 80,          // Khoảng cách lưới cơ sở (px)
            traceCount: 14,        // Số đường mạch
            pulseCount: 10,        // Số xung LED cùng lúc
            pulseSpeed: 0.6,       // Tốc độ xung (px/frame)
            traceColor: 'rgba(40, 42, 48, 0.55)',   // Màu đường mạch xám tối
            nodeColor: 'rgba(70, 72, 80, 0.7)',     // Màu nút giao
            pulseColor: 'rgba(255, 255, 255, 0.35)',// Màu xung LED trắng
            pulseGlow: 'rgba(255, 255, 255, 0.12)'  // Quầng sáng xung
        };

        /**
         * Điều chỉnh kích thước canvas theo cửa sổ.
         * Đồng thời tạo lại lưới mạch khi resize.
         */
        function resizeCanvas() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            buildTraces();  // Tạo lại đường mạch theo kích thước mới
            buildPulses();  // Tạo lại xung LED
        }

        /**
         * Tạo ngẫu nhiên các đường mạch kiểu PCB.
         * Mỗi đường gồm nhiều đoạn thẳng vuông góc (90 độ).
         */
        function buildTraces() {
            traces = [];
            const cols = Math.ceil(width / CONFIG.gridSize);
            const rows = Math.ceil(height / CONFIG.gridSize);

            for (let i = 0; i < CONFIG.traceCount; i++) {
                // Điểm bắt đầu ngẫu nhiên trên lưới
                let x = Math.floor(Math.random() * cols) * CONFIG.gridSize;
                let y = Math.floor(Math.random() * rows) * CONFIG.gridSize;

                // Mỗi đường gồm 3-6 đoạn
                const segments = 3 + Math.floor(Math.random() * 4);
                const points = [{ x, y }];

                for (let s = 0; s < segments; s++) {
                    // Chọn hướng đi ngang hoặc dọc
                    const horizontal = Math.random() > 0.5;
                    // Bước nhảy 1-3 ô lưới
                    const step = (1 + Math.floor(Math.random() * 3)) * CONFIG.gridSize;
                    // Hướng dương hoặc âm
                    const dir = Math.random() > 0.5 ? 1 : -1;

                    if (horizontal) {
                        x += step * dir;
                    } else {
                        y += step * dir;
                    }

                    // Giới hạn trong khung hình
                    x = Math.max(0, Math.min(width, x));
                    y = Math.max(0, Math.min(height, y));

                    points.push({ x, y });
                }

                traces.push(points);
            }
        }

        /**
         * Tạo các xung LED ban đầu, mỗi xung gắn với 1 đường mạch.
         */
        function buildPulses() {
            pulses = [];
            if (traces.length === 0) return;

            for (let i = 0; i < CONFIG.pulseCount; i++) {
                const traceIndex = Math.floor(Math.random() * traces.length);
                const trace = traces[traceIndex];
                if (trace.length < 2) continue;

                pulses.push({
                    traceIndex: traceIndex,
                    segmentIndex: 0,        // Đang ở đoạn nào
                    progress: 0,            // Tiến độ trên đoạn (0 -> 1)
                    speed: CONFIG.pulseSpeed * (0.7 + Math.random() * 0.6),
                    delay: Math.random() * 200  // Delay ngẫu nhiên ban đầu
                });
            }
        }

        /**
         * Tính toán vị trí hiện tại (x, y) của một xung dựa trên
         * traceIndex, segmentIndex và progress.
         */
        function getPulsePosition(pulse) {
            const trace = traces[pulse.traceIndex];
            if (!trace || pulse.segmentIndex >= trace.length - 1) return null;

            const start = trace[pulse.segmentIndex];
            const end = trace[pulse.segmentIndex + 1];

            const x = start.x + (end.x - start.x) * pulse.progress;
            const y = start.y + (end.y - start.y) * pulse.progress;

            return { x, y, start, end };
        }

        /**
         * Vẽ toàn bộ đường mạch (tĩnh, màu tối).
         */
        function drawTraces() {
            ctx.strokeStyle = CONFIG.traceColor;
            ctx.lineWidth = 1.2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            traces.forEach(function (points) {
                if (points.length < 2) return;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.stroke();

                // Vẽ các nút giao nhỏ (node) tại mỗi đỉnh
                ctx.fillStyle = CONFIG.nodeColor;
                points.forEach(function (p) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
                    ctx.fill();
                });
            });
        }

        /**
         * Cập nhật và vẽ các xung LED.
         */
        function updateAndDrawPulses() {
            pulses.forEach(function (pulse) {
                // Xử lý delay ban đầu
                if (pulse.delay > 0) {
                    pulse.delay -= 1;
                    return;
                }

                const pos = getPulsePosition(pulse);
                if (!pos) {
                    // Hết đường -> reset về đầu với đường mới
                    pulse.traceIndex = Math.floor(Math.random() * traces.length);
                    pulse.segmentIndex = 0;
                    pulse.progress = 0;
                    pulse.delay = Math.random() * 120;
                    return;
                }

                // --- Vẽ quầng sáng (glow) trước ---
                ctx.fillStyle = CONFIG.pulseGlow;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
                ctx.fill();

                // --- Vẽ điểm LED trắng sáng ---
                ctx.fillStyle = CONFIG.pulseColor;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
                ctx.fill();

                // --- Vẽ vệt mờ phía sau xung (trail) ---
                const trailLength = 0.15;
                const trailProgress = Math.max(0, pulse.progress - trailLength);
                const tx = pos.start.x + (pos.end.x - pos.start.x) * trailProgress;
                const ty = pos.start.y + (pos.end.y - pos.start.y) * trailProgress;

                ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(tx, ty);
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();

                // --- Cập nhật tiến độ ---
                const segLength = Math.hypot(
                    pos.end.x - pos.start.x,
                    pos.end.y - pos.start.y
                );
                // Tránh chia cho 0
                const stepProgress = segLength > 0 ? (pulse.speed / segLength) : 1;
                pulse.progress += stepProgress;

                // Nếu vượt qua đoạn hiện tại -> sang đoạn kế tiếp
                if (pulse.progress >= 1) {
                    pulse.progress = 0;
                    pulse.segmentIndex += 1;
                }
            });
        }

        /**
         * Vòng lặp render chính.
         */
        function render() {
            // Xóa canvas
            ctx.clearRect(0, 0, width, height);

            // Vẽ lớp tĩnh: đường mạch
            drawTraces();

            // Vẽ lớp động: xung LED
            updateAndDrawPulses();

            // Gọi lại frame tiếp theo
            requestAnimationFrame(render);
        }

        // --- Khởi động ---
        resizeCanvas();
        render();

        // --- Lắng nghe resize cửa sổ ---
        // Dùng debounce nhẹ để tránh tạo lại quá nhiều lần
        let resizeTimer = null;
        window.addEventListener('resize', function () {
            if (resizeTimer) clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 200);
        });
    })();

    /* ============================================================
       3. HIỆU ỨNG GÕ CHỮ ĐỘNG (#typing-role)
       ============================================================ */

    /**
     * Lần lượt gõ và xóa các cụm từ định hướng nghề nghiệp.
     * Chu kỳ: gõ từng ký tự -> dừng -> xóa từng ký tự -> chuyển từ tiếp.
     */
    (function initTypingEffect() {
        const typingElement = document.getElementById('typing-role');
        if (!typingElement) return;

        // Danh sách cụm từ sẽ gõ
        const phrases = [
            'Blue Team Defender',
            'SOC Analyst Aspirant',
            'DFIR & Memory Forensics',
            'KMA Information Security Student'
        ];

        // Cấu hình tốc độ (ms)
        const TYPE_SPEED = 70;       // Tốc độ gõ mỗi ký tự
        const DELETE_SPEED = 40;     // Tốc độ xóa mỗi ký tự
        const HOLD_DELAY = 1800;     // Thời gian giữ nguyên cụm từ đã gõ xong
        const BETWEEN_DELAY = 400;   // Thời gian chờ trước khi gõ từ tiếp theo

        let phraseIndex = 0;         // Đang ở cụm từ nào
        let charIndex = 0;           // Đang gõ đến ký tự nào
        let isDeleting = false;      // Đang xóa hay đang gõ

        /**
         * Hàm đệ quy tự gọi lại với setTimeout để tạo nhịp.
         */
        function tick() {
            const currentPhrase = phrases[phraseIndex];

            if (isDeleting) {
                // --- Đang xóa ---
                charIndex--;
                typingElement.textContent = currentPhrase.substring(0, charIndex);

                if (charIndex === 0) {
                    // Xóa xong -> chuyển từ tiếp theo
                    isDeleting = false;
                    phraseIndex = (phraseIndex + 1) % phrases.length;
                    setTimeout(tick, BETWEEN_DELAY);
                } else {
                    setTimeout(tick, DELETE_SPEED);
                }
            } else {
                // --- Đang gõ ---
                charIndex++;
                typingElement.textContent = currentPhrase.substring(0, charIndex);

                if (charIndex === currentPhrase.length) {
                    // Gõ xong -> giữ nguyên một lúc rồi xóa
                    isDeleting = true;
                    setTimeout(tick, HOLD_DELAY);
                } else {
                    setTimeout(tick, TYPE_SPEED);
                }
            }
        }

        // Bắt đầu sau 500ms
        setTimeout(tick, 500);
    })();

    /* ============================================================
       4. BỘ LỌC DỰ ÁN (Project Filter)
       ============================================================ */

    (function initProjectFilter() {
        const filterBar = document.getElementById('project-filter');
        if (!filterBar) return;

        const filterButtons = filterBar.querySelectorAll('.filter-btn');
        const projectCards = document.querySelectorAll('.project-card');

        // Gắn sự kiện cho từng nút lọc
        filterButtons.forEach(function (btn) {
            btn.addEventListener('click', function () {
                const filterValue = btn.getAttribute('data-filter');

                // --- Cập nhật trạng thái active cho nút ---
                filterButtons.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');

                // --- Lọc các thẻ dự án ---
                projectCards.forEach(function (card) {
                    const category = card.getAttribute('data-category');

                    if (filterValue === 'all' || category === filterValue) {
                        // Hiển thị: dùng animation fade in nhẹ
                        card.style.display = 'flex';
                        // Reset animation
                        card.style.animation = 'none';
                        // Force reflow để animation chạy lại
                        void card.offsetWidth;
                        card.style.animation = 'fadeSlideIn 0.35s ease forwards';
                    } else {
                        // Ẩn
                        card.style.display = 'none';
                    }
                });
            });
        });
    })();

    /* ============================================================
       5. NÚT COPY EMAIL (Home mini + Contact terminal)
       ============================================================ */

    (function initCopyEmail() {
        const EMAIL = 'leeddinhfthucws000@gmail.com';

        /**
         * Hàm copy email vào clipboard và hiển thị phản hồi.
         * @param {HTMLElement} button - Nút được nhấn (để đổi text tạm thời)
         */
        function copyEmailToClipboard(button) {
            // Lưu nội dung gốc của nút để khôi phục sau
            const originalHTML = button.innerHTML;

            // Dùng Clipboard API nếu có, fallback về execCommand
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(EMAIL)
                    .then(function () {
                        showCopiedFeedback(button, originalHTML);
                    })
                    .catch(function () {
                        fallbackCopy(button, originalHTML);
                    });
            } else {
                fallbackCopy(button, originalHTML);
            }
        }

        /**
         * Fallback copy bằng textarea ẩn (cho trình duyệt cũ / http).
         */
        function fallbackCopy(button, originalHTML) {
            const textarea = document.createElement('textarea');
            textarea.value = EMAIL;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            try {
                document.execCommand('copy');
                showCopiedFeedback(button, originalHTML);
            } catch (err) {
                // Nếu vẫn lỗi, hiển thị toast lỗi
                showToast('Copy failed. Please copy manually: ' + EMAIL);
            }
            document.body.removeChild(textarea);
        }

        /**
         * Hiển thị phản hồi "Copied!" trên nút trong 2 giây.
         */
        function showCopiedFeedback(button, originalHTML) {
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.borderColor = 'var(--border-hover)';
            button.style.boxShadow = 'var(--glow-white)';
            button.style.color = 'var(--text-title)';

            showToast('Email copied to clipboard!');

            // Khôi phục sau 2 giây
            setTimeout(function () {
                button.innerHTML = originalHTML;
                button.style.borderColor = '';
                button.style.boxShadow = '';
                button.style.color = '';
            }, 2000);
        }

        /**
         * Hiển thị toast thông báo ở góc màn hình.
         */
        function showToast(message) {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toast-message');
            if (!toast || !toastMessage) return;

            toastMessage.textContent = message;
            toast.classList.add('show');

            // Tự ẩn sau 2.5 giây
            setTimeout(function () {
                toast.classList.remove('show');
            }, 2500);
        }

        // --- Gắn sự kiện cho nút copy ở trang Contact ---
        const copyBtnMain = document.getElementById('copy-email-btn');
        if (copyBtnMain) {
            copyBtnMain.addEventListener('click', function () {
                copyEmailToClipboard(copyBtnMain);
            });
        }

        // --- Gắn sự kiện cho nút copy mini ở trang Home ---
        const copyBtnMini = document.getElementById('copy-email-mini');
        if (copyBtnMini) {
            copyBtnMini.addEventListener('click', function (event) {
                // Ngăn sự kiện click lan lên preview-card (tránh chuyển tab)
                event.stopPropagation();
                copyEmailToClipboard(copyBtnMini);
            });
        }
    })();

    /* ============================================================
       6. XỬ LÝ FORM GỬI TIN NHẮN NHANH (mailto)
       ============================================================ */

    (function initQuickMessageForm() {
        const form = document.getElementById('quick-message-form');
        if (!form) return;

        const EMAIL = 'leeddinhfthucws000@gmail.com';

        form.addEventListener('submit', function (event) {
            // Ngăn form submit mặc định (tránh reload trang)
            event.preventDefault();

            // Lấy giá trị người dùng nhập
            const subjectInput = document.getElementById('msg-subject');
            const bodyInput = document.getElementById('msg-body');

            const subject = subjectInput ? subjectInput.value.trim() : '';
            const body = bodyInput ? bodyInput.value.trim() : '';

            // Validate cơ bản
            if (!subject || !body) {
                alert('Please fill in both Subject and Message fields.');
                return;
            }

            // Mã hóa để chèn vào URL mailto an toàn
            const encodedSubject = encodeURIComponent(subject);
            const encodedBody = encodeURIComponent(body);

            // Tạo URL mailto
            const mailtoUrl = 'mailto:' + EMAIL +
                '?subject=' + encodedSubject +
                '&body=' + encodedBody;

            // Mở trình gửi mail mặc định
            window.location.href = mailtoUrl;

            // Xóa form sau khi gửi (tùy chọn)
            form.reset();
        });
    })();

    /* ============================================================
       7. CẬP NHẬT NĂM BẢN QUYỀN Ở FOOTER
       ============================================================ */

    (function updateCurrentYear() {
        const yearEl = document.getElementById('current-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    })();

    /* ============================================================
       8. XỬ LÝ PHÍM TẮT (TÙY CHỌN) — Điều hướng bằng phím số
       Nhấn 1 -> Home, 2 -> Projects, 3 -> Roadmap, 4 -> Contact
       Có thể bỏ nếu không cần.
       ============================================================ */

    (function initKeyboardShortcuts() {
        // Bỏ qua nếu người dùng đang gõ trong input/textarea
        function isTypingInInput(event) {
            const tag = event.target.tagName.toLowerCase();
            return tag === 'input' || tag === 'textarea' || event.target.isContentEditable;
        }

        document.addEventListener('keydown', function (event) {
            if (isTypingInInput(event)) return;

            // Chỉ xử lý khi không nhấn modifier
            if (event.ctrlKey || event.altKey || event.metaKey) return;

            const key = event.key;
            const map = {
                '1': 'home',
                '2': 'projects',
                '3': 'roadmap',
                '4': 'contact'
            };

            if (map[key]) {
                switchSection(map[key]);
            }
        });
    })();

});