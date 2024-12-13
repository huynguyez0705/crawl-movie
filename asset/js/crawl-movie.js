// Khai báo các biến toàn cục để lưu trữ dữ liệu
let allNonMatchingUrls = []
let allMatchingUrls = []
let allLatestItems = {}

// Hàm lấy dữ liệu từ URL JSON với phân trang
function fetchJsonData(apiUrl, page) {
	// Kiểm tra xem URL đã có phần phân trang chưa
	let url = apiUrl.trim()

	// Nếu URL không có ?page= thì thêm vào
	if (!url.includes('?page=')) {
		url += `?page=${page}`
	} else {
		// Nếu đã có ?page=, thay thế page={i} bằng giá trị mới
		url = url.replace(/([?&])page=\d+/, `$1page=${page}`)
	}

	return fetch(url).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok')
		}
		return response.json()
	})
}
function showToast(message, type = 'success') {
	const toast = document.createElement('div')
	toast.classList.add('toast')

	if (type === 'success') {
		toast.style.backgroundColor = '#4caf50' // Màu xanh cho thành công
	} else if (type === 'error') {
		toast.style.backgroundColor = '#f44336' // Màu đỏ cho lỗi
	} else if (type === 'info') {
		toast.style.backgroundColor = '#2196F3' // Màu xanh dương cho thông tin
	}

	toast.textContent = message

	const closeBtn = document.createElement('span')
	closeBtn.classList.add('close-btn')
	closeBtn.textContent = '×'
	closeBtn.addEventListener('click', () => {
		toast.classList.add('hide')
		setTimeout(() => toast.remove(), 500)
	})
	toast.appendChild(closeBtn)
	// Thêm toast vào container
	const toastContainer = document.querySelector('.toast-container')
	toastContainer.appendChild(toast)
	// Tự động ẩn toast sau 5 giây
	setTimeout(() => {
		toast.classList.add('hide')
		setTimeout(() => toast.remove(), 500)
	}, 10000)
}

// Hàm trích xuất URL từ dữ liệu JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList, source) {
	let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())
	let latestItems = {}
	let hasChieuRap = false // Biến kiểm tra có phim chiếu rạp hay không
	const isChieuRapOnly = document.getElementById('crawlTheater').checked

	let items = source === 'kkphim' ? jsonData.data?.items || [] : jsonData.items || []

	if (!Array.isArray(items)) {
		console.error('Dữ liệu items không hợp lệ:', items)
		showToast('Dữ liệu items không hợp lệ:', error)
		return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
	}

	// Hàm xử lý chung cho tất cả các item
	function processItem(item) {
		const itemName = item.name.toLowerCase()
		const itemTime = new Date(item.modified.time)
		if (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].modified.time)) {
			latestItems[itemName] = item
		}
		if (item.chieurap === true) {
			hasChieuRap = true
		}
	}

	// Lọc và xử lý item dựa trên chế độ đã chọn
	if (isChieuRapOnly) {
		items.forEach(item => {
			if (item.chieurap === true) {
				processItem(item) // Xử lý item chiếu rạp
			}
		})

		// Nếu không có phim chiếu rạp nào, hiển thị thông báo lỗi
		if (!hasChieuRap) {
			return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
		}
	} else {
		// Nếu không chọn "Chỉ Crawl Phim Chiếu Rạp", xử lý tất cả phim
		items.forEach(item => processItem(item)) // Xử lý tất cả các item
	}

	let nonMatchingUrls = []
	let matchingUrls = []

	// Xuất ra các URL
	Object.values(latestItems).forEach(item => {
		const slug = item.slug
		const id = item._id
		const modifiedTime = item.modified.time
		const name = item.name
		const origin_name = item.origin_name
		const year = item.year

		// Cấu trúc URL theo nguồn
		const url = source === 'kkphim' ? `https://phimapi.com/phim/${slug}|${id}|${modifiedTime}|${name}|${origin_name}|${year}` : `https://ophim1.com/phim/${slug}|${id}|${modifiedTime}|${name}|${origin_name}|${year}`

		// Phân loại theo tên
		if (namesToCheck.includes(item.name.toLowerCase())) {
			matchingUrls.push({ name: item.name, url: url })
		} else {
			nonMatchingUrls.push({ name: item.name, url: url })
		}
	})

	return { nonMatchingUrls, matchingUrls, latestItems }
}

// Hàm hiển thị danh sách URL trên trang web
function displayUrls() {
	const apiUrl = document.getElementById('apiUrl').value
	const nameList = document.getElementById('nameList').value
	const sourceSelect = document.getElementById('sourceSelect').value
	const startPage = parseInt(document.getElementById('startPage').value)
	const endPage = parseInt(document.getElementById('endPage').value)
	const uniqueNamesCount = document.getElementById('uniqueNamesCount')
	uniqueNamesCount.textContent = 'Đang tải...'
	// Hàm xử lý lấy dữ liệu từ tất cả các trang
	function fetchAllPages(currentPage) {
		const totalPages = endPage - startPage + 1 // Tổng số trang cần tải
		const progressElement = document.getElementById('loadingProgress')
		const progressWrapper = document.getElementById('progressWrapper')

		// Hiển thị thanh tiến trình khi bắt đầu tải
		progressWrapper.style.display = 'block'

		// Cập nhật thông tin trang hiện tại
		const currentPageElement = document.getElementById('currentPage')
		currentPageElement.classList.add('jump')
		currentPageElement.textContent = currentPage
		setTimeout(() => {
			currentPageElement.classList.remove('jump')
		}, 300)
		// Tính toán tiến độ
		const progressValue = ((currentPage - startPage) / totalPages) * 100
		progressElement.value = progressValue

		if (currentPage > endPage) {
			// Đã qua hết các trang, hiển thị kết quả
			uniqueNamesCount.textContent = `Số lượng phim hiện tại: ${Object.keys(allLatestItems).length}`
			showToast(`Hoàn thành ${currentPage} Page`)
			return // Kết thúc khi đã xử lý tất cả các trang
		}

		fetchJsonData(apiUrl, currentPage)
			.then(jsonData => {
				const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList, sourceSelect, currentPage) //
				allNonMatchingUrls = allNonMatchingUrls.concat(nonMatchingUrls)
				allMatchingUrls = allMatchingUrls.concat(matchingUrls)
				Object.assign(allLatestItems, latestItems)

				updateTableWithMessage('nonMatchingTable', nonMatchingUrls)
				updateTableWithMessage('matchingTable', matchingUrls)
				if (nonMatchingUrls.length === 0 && matchingUrls.length === 0) {
					showToast(`${apiUrl}?page=${currentPage} không có phim chiếu rạp`, 'error')
				}
				// Gọi tiếp trang tiếp theo
				fetchAllPages(currentPage + 1)
			})
			.catch(error => {
				console.error('Lỗi khi tải JSON:', error)
				showToast('Không thể lấy dữ liệu từ API. Vui lòng kiểm tra URL.', 'error')
			})
	}

	// Bắt đầu lấy dữ liệu từ trang bắt đầu
	fetchAllPages(startPage)
}

// Hàm cập nhật bảng với dữ liệu hoặc thông báo nếu không có dữ liệu
function updateTableWithMessage(tableId, items, message) {
	const tableBody = document.getElementById(tableId)

	if (items.length === 0) {
		const row = document.createElement('tr')
		const cell = document.createElement('td')
		cell.colSpan = 2
		cell.textContent = message
		row.appendChild(cell)
		tableBody.appendChild(row)
	} else {
		items.forEach(item => {
			const row = document.createElement('tr')
			const nameCell = document.createElement('td')
			const urlCell = document.createElement('td')
			nameCell.textContent = item.name
			urlCell.textContent = item.url
			row.appendChild(nameCell)
			row.appendChild(urlCell)
			tableBody.appendChild(row)
		})
	}
}

// Hàm kiểm tra và hiển thị/ẩn radio button dựa trên lựa chọn nguồn
function toggleCrawlModeVisibility() {
	const sourceSelect = document.getElementById('sourceSelect')
	const crawlTheaterWrapper = document.getElementById('crawlModeWrapper')
	const buttonLnk = document.getElementById('buttonIn_list')
	const selectedSource = sourceSelect.value

	// Hiển thị checkbox khi chọn KKPhim, ẩn khi chọn nguồn khác
	if (selectedSource === 'kkphim') {
		crawlTheaterWrapper.style.display = 'block'
		buttonLnk.style.display = 'flex'
		document.getElementById('apiUrl').value = 'https://phimapi.com/v1/api/danh-sach/phim-le'
	} else {
		crawlTheaterWrapper.style.display = 'none'
		buttonLnk.style.display = 'none'
		document.getElementById('apiUrl').value = 'https://ophim1.com/danh-sach/phim-moi-cap-nhat'
		// Ẩn radio khi chọn nguồn khác
	}
}
function getUrlbtn(element) {
	const urlLink = 'https://phimapi.com/v1/api/danh-sach/'
	const categoryUrls = {
		getUrlHH: `${urlLink}hoat-hinh`,
		getUrlsingle: `${urlLink}phim-le`,
		getUrlseries: `${urlLink}phim-bo`
	}
	const category = element.id
	categoryUrls[category] ? (document.getElementById('apiUrl').value = categoryUrls[category]) : NaN
}
document.getElementById('sourceSelect').addEventListener('change', toggleCrawlModeVisibility)

// Kích hoạt sự kiện mặc định khi trang tải (lần đầu tiên)
window.addEventListener('load', toggleCrawlModeVisibility)

// Hàm sao chép nội dung vào clipboard
function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			showToast('Đã sao chép thành công!')
		})
		.catch(err => {
			showToast('Lỗi khi sao chép:', error)
			console.error('Lỗi khi sao chép:', err)
		})
}

// Hàm sao chép tên không trùng khớp
function copyNonMatchingNames() {
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	let names = []
	nonMatchingTable.querySelectorAll('tr td:first-child').forEach(cell => {
		names.push(cell.textContent)
	})
	copyToClipboard(names.join('\n'))
}

// Hàm sao chép các URL không trùng khớp
function copyMatchingUrls() {
	const matchingTable = document.getElementById('matchingTable')
	let urls = []
	matchingTable.querySelectorAll('tr td:nth-child(2)').forEach(cell => {
		urls.push(cell.textContent)
	})
	copyToClipboard(urls.join('\n'))
}

function copyNonMatchingUrls() {
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	let urls = []
	nonMatchingTable.querySelectorAll('tr td:nth-child(2)').forEach(cell => {
		urls.push(cell.textContent)
	})
	copyToClipboard(urls.join('\n'))
}
document.getElementById('getUrlsButton').addEventListener('click', displayUrls)
document.getElementById('copyNonMatchingNamesButton').addEventListener('click', copyNonMatchingNames)
document.getElementById('copyNonMatchingButton').addEventListener('click', copyNonMatchingUrls)
document.getElementById('copyMatchingButton').addEventListener('click', copyMatchingUrls)
