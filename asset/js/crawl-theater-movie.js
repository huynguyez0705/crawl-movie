// Hàm lấy dữ liệu từ URL JSON với trang cụ thể
function fetchJsonData(apiUrl, page) {
    const url = apiUrl.replace('${i}', page); // Thay thế ${i} với số trang
    return fetch(url).then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}
// Hàm để tạo và hiển thị toast notifications
function showToast(message, type = 'success') {
    // Tạo phần tử toast
    const toast = document.createElement('div');
    toast.classList.add('toast');
    
    // Đặt màu sắc của toast tùy thuộc vào loại thông báo
    if (type === 'success') {
        toast.style.backgroundColor = '#4caf50'; // Màu xanh cho thành công
    } else if (type === 'error') {
        toast.style.backgroundColor = '#f44336'; // Màu đỏ cho lỗi
    } else if (type === 'info') {
        toast.style.backgroundColor = '#2196F3'; // Màu xanh dương cho thông tin
    }

    toast.textContent = message;

    // Tạo nút đóng (tuỳ chọn)
    const closeBtn = document.createElement('span');
    closeBtn.classList.add('close-btn');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 500); // Đợi 0.5s để thực hiện ẩn toast
    });

    // Thêm nút đóng vào toast
    toast.appendChild(closeBtn);

    // Thêm toast vào container
    const toastContainer = document.querySelector('.toast-container');
    toastContainer.appendChild(toast);

    // Tự động ẩn toast sau 3 giây
    setTimeout(() => {
        toast.classList.add('hide'); // Áp dụng hiệu ứng ẩn
        setTimeout(() => toast.remove(), 500); // Sau 0.5s, xóa toast khỏi DOM
    }, 3000);
}
// Hàm trích xuất URL từ dữ liệu JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList) {
    let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase());
 
    let latestItems = {};
    let hasChieuRap = false;

    jsonData.data.items.forEach(item => {
        if (item.chieurap === true) {
            hasChieuRap = true;
            const itemName = item.name.toLowerCase();
            const itemTime = new Date(item.modified.time);

            if (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].modified.time)) {
                latestItems[itemName] = item;
            }
        }
    });

    if (!hasChieuRap) {
        showToast('Không có phim chiếu rạp nào');
        return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} };
    }

    let nonMatchingUrls = [];
    let matchingUrls = [];

    Object.values(latestItems).forEach(item => {
        const slug = item.slug;
        const id = item._id;
        const modifiedTime = item.modified.time;
        const url = `https://phimapi.com/phim/${slug}|${id}|${modifiedTime}`;
        const urlSecond = `https://apii.online/api/phim/${slug}`;

        if (namesToCheck.includes(item.name.toLowerCase())) {
            matchingUrls.push({ name: item.name, url: url, urlSecond: urlSecond });
        } else {
            nonMatchingUrls.push({ name: item.name, url: url, urlSecond: urlSecond });
        }
    });

    return { nonMatchingUrls, matchingUrls, latestItems };
}

// Hàm hiển thị danh sách URL trên trang web từ nhiều trang
function displayUrls() {
    const apiUrl = document.getElementById('apiUrl').value;
    const nameList = document.getElementById('nameList').value;
    const startPage = parseInt(document.getElementById('startPage').value);
    const endPage = parseInt(document.getElementById('endPage').value);
    const nonMatchingTable = document.getElementById('nonMatchingTable');
    const matchingTable = document.getElementById('matchingTable');
    const uniqueNamesCount = document.getElementById('uniqueNamesCount');

    nonMatchingTable.innerHTML = '';
    matchingTable.innerHTML = '';
    uniqueNamesCount.textContent = 'Đang tải...';

    let allNonMatchingUrls = [];
    let allMatchingUrls = [];
    let allLatestItems = {};

    // Hàm xử lý lấy dữ liệu từ tất cả các trang
    function fetchAllPages(currentPage) {
        // Dừng nếu đã qua trang cuối cùng
        if (currentPage > endPage) {
            uniqueNamesCount.textContent = `Số lượng tên duy nhất: ${Object.keys(allLatestItems).length}`;
            return; // Kết thúc khi đã xử lý tất cả các trang
        }

        // Lấy dữ liệu trang hiện tại
        fetchJsonData(apiUrl, currentPage)
            .then(jsonData => {
                const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList);

                // Cập nhật toàn bộ dữ liệu đã có
                allNonMatchingUrls = allNonMatchingUrls.concat(nonMatchingUrls);
                allMatchingUrls = allMatchingUrls.concat(matchingUrls);
                Object.assign(allLatestItems, latestItems);

                // Hiển thị dữ liệu ngay khi tải xong trang
                displayData(nonMatchingUrls, matchingUrls);

                // Gọi trang tiếp theo sau khi xử lý trang hiện tại
                fetchAllPages(currentPage + 1);
            })
            .catch(error => {
                console.error('Lỗi khi tải JSON:', error);
            });
    }

    // Hàm hiển thị dữ liệu cho các bảng
    function displayData(nonMatchingUrls, matchingUrls) {
        // Hiển thị URL không bị trùng
        nonMatchingUrls.forEach(item => {
            let row = document.createElement('tr');
            let nameCell = document.createElement('td');
            let urlCell = document.createElement('td');
            let urlSecondCell = document.createElement('td');

            nameCell.textContent = item.name;
            urlCell.textContent = item.url;
            urlSecondCell.textContent = item.urlSecond;

            row.appendChild(nameCell);
            row.appendChild(urlCell);
            row.appendChild(urlSecondCell);
            nonMatchingTable.appendChild(row);
        });

        // Hiển thị URL bị trùng
        matchingUrls.forEach(item => {
            let row = document.createElement('tr');
            let nameCell = document.createElement('td');
            let urlCell = document.createElement('td');
            let urlSecondCell = document.createElement('td');

            nameCell.textContent = item.name;
            urlCell.textContent = item.url;
            urlSecondCell.textContent = item.urlSecond;

            row.appendChild(nameCell);
            row.appendChild(urlCell);
            row.appendChild(urlSecondCell);
            matchingTable.appendChild(row);
        });
    }

    // Bắt đầu lấy dữ liệu từ trang bắt đầu
    fetchAllPages(startPage);
}

// Hàm sao chép cột cụ thể (Name, URL 1, URL 2) từ bảng được chỉ định vào clipboard
function copyTableColumn(tableId, columnIndex) {
    const table = document.getElementById(tableId);
    let values = [];

    // Lấy tất cả các giá trị trong cột chỉ định của bảng
    table.querySelectorAll('tr').forEach(row => {
        const cellText = row.cells[columnIndex]?.textContent || '';
        values.push(cellText);
    });

    if (values.length === 0) {
		showToast('Không có dữ liệu để sao chép.');
        return;
    }

    // Sao chép toàn bộ danh sách vào clipboard
    copyToClipboard(values.join('\n'));
}

// Hàm sao chép nội dung vào clipboard với xử lý lỗi
function copyToClipboard(text) {
    if (!navigator.clipboard) {
		showToast('Trình duyệt của bạn không hỗ trợ sao chép vào clipboard.');
        return;
    }

    navigator.clipboard
        .writeText(text)
        .then(() => {
            showToast('Đã sao chép vào clipboard!');
        })
        .catch(err => {
			showToast('Lỗi khi sao chép!');
            console.error('Lỗi khi sao chép:', err);
        });
}


// Gắn sự kiện click vào các button copy cho từng hành động riêng biệt
document.getElementById('getUrlsButton').addEventListener('click', displayUrls);

// Non-matching table buttons
document.getElementById('copyNonMatchingNamesButton').addEventListener('click', () => copyTableColumn('nonMatchingTable', 0));
document.getElementById('copyNonMatchingUrl1Button').addEventListener('click', () => copyTableColumn('nonMatchingTable', 1));
document.getElementById('copyNonMatchingUrl2Button').addEventListener('click', () => copyTableColumn('nonMatchingTable', 2));

// Matching table buttons
document.getElementById('copyMatchingNamesButton').addEventListener('click', () => copyTableColumn('matchingTable', 0));
document.getElementById('copyMatchingUrl1Button').addEventListener('click', () => copyTableColumn('matchingTable', 1));
document.getElementById('copyMatchingUrl2Button').addEventListener('click', () => copyTableColumn('matchingTable', 2));
