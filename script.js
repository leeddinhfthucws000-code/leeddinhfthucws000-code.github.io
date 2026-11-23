/* ================================================================== */
/*  ZABORAN — CYBERSECURITY PORTFOLIO                                  */
/*  File: script.js                                                    */
/*  Toàn bộ chú thích trong file này viết bằng Tiếng Việt, giải thích   */
/*  rõ mục đích + cách hoạt động của từng khối code.                    */
/*                                                                      */
/*  LƯU Ý: file này được load bằng <script src="script.js" defer>      */
/*  trong index.html, nên tại thời điểm các dòng code bên dưới chạy,   */
/*  toàn bộ DOM đã được trình duyệt parse xong -> có thể truy vấn       */
/*  phần tử (document.querySelector...) ngay mà KHÔNG cần bọc thêm     */
/*  sự kiện "DOMContentLoaded".                                        */
/* ================================================================== */


/* ================================================================== */
/*  1. HỆ THỐNG CHUYỂN ĐỔI SECTION                                     */
/*  (Home / Projects & Achievements / Roadmap & Development / Contact) */
/* ================================================================== */

/**
 * Chuyển trang sang đúng section có id = targetId, đồng thời:
 *   - Ẩn hết các section còn lại (bỏ class "active")
 *   - Cập nhật trạng thái "active" cho link tương ứng trên Navbar
 *   - Cuộn mượt (smooth scroll) lên đầu trang
 *
 * @param {string} targetId - id của section muốn hiển thị
 *                            ("home" | "projects" | "roadmap" | "contact")
 */
function switchSection(targetId) {
    // Chỉ section có id trùng targetId mới được gắn class "active"
    // (CSS trong style.css đã quy định .page-section.active { display: block })
    document.querySelectorAll('.page-section').forEach(function (section) {
        section.classList.toggle('active', section.id === targetId);
    });

    // Đồng bộ trạng thái "đang chọn" trên thanh Navbar
    document.querySelectorAll('.nav-link[data-target]').forEach(function (link) {
        link.classList.toggle('active', link.dataset.target === targetId);
    });

    // Luôn cuộn mượt lên đầu trang mỗi khi chuyển sang section mới,
    // tránh tình trạng người dùng đang cuộn dở section cũ rồi bị "rớt"
    // giữa chừng ở section mới.
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Gắn sự kiện click cho TẤT CẢ các phần tử có thể dùng để điều hướng:
 *   - Link trên Navbar (data-target)
 *   - Logo thương hiệu "ZaborAn" trên Navbar (data-target)
 *   - Nút "Back to Home" ở 3 section con (data-target)
 *   - 3 thẻ preview ở trang Home (data-goto)
 *   - Logo nổi cố định góc dưới bên phải (#floating-logo)
 */
function initNavigation() {
    // Nhóm 1: mọi phần tử dùng chung thuộc tính data-target
    // (nav-link, brand logo, back-btn đều thuộc nhóm này)
    document.querySelectorAll('[data-target]').forEach(function (element) {
        element.addEventListener('click', function (event) {
            // Các phần tử này đều là thẻ <a href="#">, phải preventDefault
            // để tránh trình duyệt nhảy lên đầu trang kèm dấu "#" trên URL
            event.preventDefault();
            switchSection(element.dataset.target);
        });
    });

    // Nhóm 2: 3 thẻ preview ở Home dùng thuộc tính data-goto (không phải thẻ <a>)
    document.querySelectorAll('.preview-card[data-goto]').forEach(function (card) {
        card.addEventListener('click', function () {
            switchSection(card.dataset.goto);
        });
    });

    // Nhóm 3: logo nổi cố định góc dưới bên phải -> luôn luôn về Home
    // (phần tử này không có data-target riêng vì chức năng của nó cố định,
    // không bao giờ đổi sang section khác)
    var floatingLogo = document.getElementById('floating-logo');
    if (floatingLogo) {
        floatingLogo.addEventListener('click', function (event) {
            event.preventDefault();
            switchSection('home');
        });
    }
}


/* ================================================================== */
/*  2. HIỆU ỨNG NỀN "MẠCH ĐIỆN TỬ" TRÊN CANVAS (#circuit-bg)           */
/*                                                                      */
/*  Nguyên lý hoạt động:                                                */
/*    - Tạo ra 1 tập hợp các "nút mạch" (node) nằm rải rác, mỗi nút     */
/*      tự di chuyển chậm rãi theo 1 vận tốc ngẫu nhiên.                */
/*    - Ở mỗi khung hình (frame), nếu 2 nút nằm đủ gần nhau thì vẽ 1    */
/*      đường nối mờ giữa chúng -> tạo cảm giác giống sơ đồ mạch PCB    */
/*      đang "chạy" trên nền đen.                                      */
/*    - Toàn bộ dùng tông màu trắng/xám để khớp với theme LED của       */
/*      trang (không dùng màu sắc sặc sỡ).                             */
/* ================================================================== */
function initCircuitBackground() {
    var canvas = document.getElementById('circuit-bg');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var width, height, nodes;

    // Các thông số điều chỉnh hiệu ứng - gom lại 1 chỗ cho dễ tinh chỉnh sau này
    var CONFIG = {
        nodeCount: 70,        // Số lượng nút mạch trên màn hình lớn (desktop)
        maxDistance: 150,     // Khoảng cách tối đa (px) để 2 nút được nối đường
        nodeSpeed: 0.25,      // Tốc độ trôi của mỗi nút mạch
        nodeRadius: 1.6       // Bán kính chấm tròn vẽ tại mỗi nút
    };

    // Tính lại kích thước canvas cho khớp đúng với kích thước cửa sổ hiện tại
    function resizeCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    // Sinh ngẫu nhiên vị trí + vận tốc ban đầu cho từng nút mạch.
    // Trên màn hình nhỏ (mobile) giảm bớt số lượng nút để đỡ giật lag.
    function createNodes() {
        var count = width < 640 ? Math.floor(CONFIG.nodeCount / 2.5) : CONFIG.nodeCount;
        nodes = [];
        for (var i = 0; i < count; i++) {
            nodes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * CONFIG.nodeSpeed,
                vy: (Math.random() - 0.5) * CONFIG.nodeSpeed
            });
        }
    }

    // Cập nhật vị trí từng nút; nút nào chạm biên màn hình thì "dội ngược" lại
    function updateNodes() {
        nodes.forEach(function (node) {
            node.x += node.vx;
            node.y += node.vy;

            if (node.x <= 0 || node.x >= width) node.vx *= -1;
            if (node.y <= 0 || node.y >= height) node.vy *= -1;
        });
    }

    // Vẽ lại toàn bộ khung hình: đường nối trước, chấm nút sau (để chấm nổi lên trên)
    function drawFrame() {
        ctx.clearRect(0, 0, width, height);

        for (var i = 0; i < nodes.length; i++) {
            for (var j = i + 1; j < nodes.length; j++) {
                var dx = nodes[i].x - nodes[j].x;
                var dy = nodes[i].y - nodes[j].y;
                var distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.maxDistance) {
                    // 2 nút càng gần nhau thì đường nối càng rõ (opacity càng cao)
                    var opacity = (1 - distance / CONFIG.maxDistance) * 0.35;
                    ctx.strokeStyle = 'rgba(160, 160, 168, ' + opacity + ')';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.stroke();
                }
            }
        }

        ctx.fillStyle = 'rgba(228, 228, 231, 0.6)'; // Trùng màu --led-color trong style.css
        nodes.forEach(function (node) {
            ctx.beginPath();
            ctx.arc(node.x, node.y, CONFIG.nodeRadius, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Vòng lặp animation chạy liên tục bằng requestAnimationFrame
    // (mượt hơn setInterval vì được trình duyệt đồng bộ theo khung hình)
    function animate() {
        updateNodes();
        drawFrame();
        requestAnimationFrame(animate);
    }

    resizeCanvas();
    createNodes();
    animate();

    // Khi người dùng resize cửa sổ: tính lại kích thước + tạo lại nút cho phù hợp
    window.addEventListener('resize', function () {
        resizeCanvas();
        createNodes();
    });
}


/* ================================================================== */
/*  3. HIỆU ỨNG GÕ CHỮ ĐỘNG (#typing-role)                             */
/*  Lần lượt gõ ra từng vai trò trong mảng ROLES, dừng lại 1 chút,      */
/*  xoá đi rồi chuyển sang vai trò kế tiếp, lặp vô hạn.                 */
/* ================================================================== */
function initTypingEffect() {
    var el = document.getElementById('typing-role');
    if (!el) return;

    var ROLES = [
        'Blue Team Defender',
        'SOC Analyst Aspirant',
        'DFIR & Memory Forensics',
        'KMA Information Security Student'
    ];

    var TYPE_SPEED = 80;     // Tốc độ gõ từng ký tự (ms/ký tự)
    var DELETE_SPEED = 45;   // Tốc độ xoá từng ký tự (ms/ký tự) - xoá nhanh hơn gõ
    var HOLD_TIME = 1800;    // Thời gian giữ nguyên chuỗi sau khi gõ xong (ms)
    var PAUSE_BEFORE_NEXT = 400; // Thời gian nghỉ trước khi gõ chuỗi tiếp theo (ms)

    var roleIndex = 0;       // Đang ở vai trò thứ mấy trong mảng ROLES
    var charIndex = 0;       // Đang gõ/xoá tới ký tự thứ mấy
    var isDeleting = false;  // true = đang ở pha xoá chữ, false = đang ở pha gõ chữ

    function tick() {
        var currentRole = ROLES[roleIndex];
        var delay;

        if (isDeleting) {
            charIndex--;
            delay = DELETE_SPEED;
        } else {
            charIndex++;
            delay = TYPE_SPEED;
        }

        el.textContent = currentRole.substring(0, charIndex);

        if (!isDeleting && charIndex === currentRole.length) {
            // Gõ xong trọn vẹn 1 vai trò -> giữ nguyên 1 lúc rồi mới bắt đầu xoá
            isDeleting = true;
            delay = HOLD_TIME;
        } else if (isDeleting && charIndex === 0) {
            // Xoá xong -> chuyển sang vai trò kế tiếp (hết mảng thì quay lại đầu)
            isDeleting = false;
            roleIndex = (roleIndex + 1) % ROLES.length;
            delay = PAUSE_BEFORE_NEXT;
        }

        setTimeout(tick, delay);
    }

    tick();
}


/* ================================================================== */
/*  4. BỘ LỌC DỰ ÁN (#project-filter)                                  */
/*  Bấm vào 1 nút lọc (All / DFIR & Forensics / Network & System /      */
/*  Cryptography) sẽ chỉ hiện các .project-card có data-category        */
/*  tương ứng, ẩn các thẻ còn lại.                                       */
/* ================================================================== */
function initProjectFilter() {
    var filterBar = document.getElementById('project-filter');
    if (!filterBar) return;

    var filterButtons = filterBar.querySelectorAll('.filter-btn');
    var projectCards = document.querySelectorAll('.project-card');

    filterButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            var filterValue = button.dataset.filter;

            // Chỉ nút vừa bấm mới được gắn class "active"
            filterButtons.forEach(function (btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            // "all" thì hiện hết, còn lại thì so khớp đúng data-category
            projectCards.forEach(function (card) {
                var matches = filterValue === 'all' || card.dataset.category === filterValue;
                card.style.display = matches ? '' : 'none';
            });
        });
    });
}


/* ================================================================== */
/*  5. COPY EMAIL (#copy-email-btn & #copy-email-mini) + TOAST         */
/* ================================================================== */

var EMAIL_ADDRESS = 'leeddinhfthucws000@gmail.com';
var toastHideTimer = null; // Lưu lại timeout đang chờ ẩn toast, để có thể huỷ khi cần

/**
 * Hiện khung thông báo Toast ở góc dưới bên trái với nội dung tuỳ ý,
 * tự động ẩn đi sau 2.5 giây.
 * @param {string} message - Nội dung muốn hiển thị trong Toast
 */
function showToast(message) {
    var toast = document.getElementById('toast');
    var toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;

    toastMessage.textContent = message;
    toast.classList.add('show');

    // Nếu người dùng bấm copy liên tục nhiều lần, huỷ timer cũ để tránh
    // toast bị ẩn đi ngay sau khi vừa đổi sang nội dung mới nhất
    clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(function () {
        toast.classList.remove('show');
    }, 2500);
}

/**
 * Cách copy văn bản dự phòng, dùng khi trình duyệt không hỗ trợ
 * (hoặc không cho phép) Clipboard API hiện đại (navigator.clipboard).
 * @param {string} text - Văn bản cần copy vào clipboard
 */
function fallbackCopyText(text) {
    var tempInput = document.createElement('textarea');
    tempInput.value = text;
    // Đưa ra ngoài màn hình để người dùng không nhìn thấy ô nhập tạm này
    tempInput.style.position = 'fixed';
    tempInput.style.opacity = '0';
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

/**
 * Gắn sự kiện copy email cho cả 2 nút:
 *   - #copy-email-btn  (nằm trong Terminal Card ở trang Contact)
 *   - #copy-email-mini (nằm trong thẻ preview Contact ở trang Home)
 */
function initCopyEmail() {
    var buttons = document.querySelectorAll('#copy-email-btn, #copy-email-mini');

    buttons.forEach(function (button) {
        button.addEventListener('click', function (event) {
            // #copy-email-mini nằm LỒNG BÊN TRONG 1 .preview-card (thẻ này có
            // sự kiện click riêng để chuyển section) -> phải chặn sự kiện lan
            // lên thẻ cha, nếu không mỗi lần bấm Copy Email sẽ vô tình bị
            // điều hướng sang section khác.
            event.stopPropagation();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(EMAIL_ADDRESS)
                    .then(function () {
                        showToast('Email copied to clipboard!');
                    })
                    .catch(function () {
                        // Trình duyệt chặn quyền truy cập clipboard -> dùng cách dự phòng
                        fallbackCopyText(EMAIL_ADDRESS);
                        showToast('Email copied to clipboard!');
                    });
            } else {
                // Môi trường không có Clipboard API (trình duyệt cũ, hoặc chạy qua http)
                fallbackCopyText(EMAIL_ADDRESS);
                showToast('Email copied to clipboard!');
            }
        });
    });
}


/* ================================================================== */
/*  6. TỰ ĐỘNG CẬP NHẬT NĂM HIỆN TẠI Ở FOOTER (#current-year)          */
/* ================================================================== */
function initCurrentYear() {
    var yearEl = document.getElementById('current-year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }
}


/* ================================================================== */
/*  7. PHÍM TẮT CHUYỂN SECTION BẰNG BÀN PHÍM (1 / 2 / 3 / 4)           */
/*     1 -> Home | 2 -> Projects | 3 -> Roadmap | 4 -> Contact          */
/* ================================================================== */
function initKeyboardShortcuts() {
    var SHORTCUT_MAP = {
        '1': 'home',
        '2': 'projects',
        '3': 'roadmap',
        '4': 'contact'
    };

    document.addEventListener('keydown', function (event) {
        // Nếu người dùng đang gõ chữ trong 1 ô input/textarea (vd: form Quick
        // Message) thì bỏ qua, tránh việc gõ số "1", "2"... trong nội dung tin
        // nhắn bị hiểu nhầm thành phím tắt chuyển trang.
        var activeTag = document.activeElement ? document.activeElement.tagName : '';
        if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

        var targetSection = SHORTCUT_MAP[event.key];
        if (targetSection) {
            switchSection(targetSection);
        }
    });
}


/* ================================================================== */
/*  8. FORM QUICK MESSAGE (#quick-message-form)                        */
/*                                                                      */
/*  THAY ĐỔI QUAN TRỌNG SO VỚI BẢN TRƯỚC:                               */
/*  Bản cũ dùng event.preventDefault() để chặn hẳn hành vi submit mặc   */
/*  định của form, rồi tự dựng 1 link "mailto:..." và mở ứng dụng email */
/*  trên máy người dùng. Cách này đã được GỠ BỎ HOÀN TOÀN.              */
/*                                                                      */
/*  Bây giờ form có action="https://formsubmit.co/..." + method="POST" */
/*  được khai báo sẵn ngay trong thẻ <form> ở index.html, nên chỉ cần   */
/*  để trình duyệt tự submit bình thường (gửi POST request thật sự lên  */
/*  FormSubmit, rồi FormSubmit sẽ forward nội dung vào email của bạn).  */
/*  Script ở đây CHỈ làm đúng 1 việc: kiểm tra dữ liệu rỗng cơ bản       */
/*  trước khi submit, để không gửi đi 1 request trống không cần thiết.  */
/* ================================================================== */
function initQuickMessageForm() {
    var form = document.getElementById('quick-message-form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
        var emailField = form.querySelector('#msg-email');
        var subjectField = form.querySelector('#msg-subject');
        var bodyField = form.querySelector('#msg-body');

        var isMissingData =
            !emailField.value.trim() ||
            !subjectField.value.trim() ||
            !bodyField.value.trim();

        if (isMissingData) {
            // Còn trường trống -> chặn submit lần này, báo cho người dùng biết
            // bằng toast thay vì để trình duyệt tự hiện thông báo mặc định.
            event.preventDefault();
            showToast('Please fill in all fields before sending.');
            return;
        }

        // Dữ liệu hợp lệ -> KHÔNG gọi preventDefault(), để trình duyệt tự
        // submit request POST thật sự tới FormSubmit như cấu hình trong HTML.
    });
}


/* ================================================================== */
/*  KHỞI CHẠY TOÀN BỘ TÍNH NĂNG NGAY KHI SCRIPT ĐƯỢC LOAD              */
/*  (đã giải thích ở đầu file: script có "defer" nên DOM chắc chắn đã  */
/*  sẵn sàng tại thời điểm các dòng gọi hàm bên dưới được thực thi)     */
/* ================================================================== */
initNavigation();
initCircuitBackground();
initTypingEffect();
initProjectFilter();
initCopyEmail();
initCurrentYear();
initKeyboardShortcuts();
initQuickMessageForm();
