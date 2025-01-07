// Khai báo các biến toàn cục để lưu trữ dữ liệu
let allNonMatchingUrls = []
let allMatchingUrls = []
let allLatestItems = {}

// Hàm lấy dữ liệu từ URL JSON với phân trang
function fetchJsonData(apiUrl, page) {
	let url = apiUrl.trim()

	if (!url.includes('?page=')) {
		url += `?page=${page}`
	} else {
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
		toast.style.backgroundColor = '#4caf50'
	} else if (type === 'error') {
		toast.style.backgroundColor = '#f44336'
	} else if (type === 'info') {
		toast.style.backgroundColor = '#2196F3'
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

	const toastContainer = document.querySelector('.toast-container')
	toastContainer.appendChild(toast)

	setTimeout(() => {
		toast.classList.add('hide')
		setTimeout(() => toast.remove(), 500)
	}, 3000)
}

// Hàm trích xuất URL từ dữ liệu JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList, source) {
	let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())
	let latestItems = {}
	let hasChieuRap = false
	const isChieuRapOnly = document.getElementById('crawlTheater').checked

	let items = source === 'kkphim' || source === 'ophim' ? jsonData.data?.items || [] : jsonData.items || []

	if (!Array.isArray(items)) {
		console.error('Dữ liệu items không hợp lệ:', items)
		showToast('Dữ liệu items không hợp lệ:', 'error')
		return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
	}

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

	if (isChieuRapOnly) {
		items.forEach(item => {
			if (item.chieurap === true) {
				processItem(item)
			}
		})

		if (!hasChieuRap) {
			return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
		}
	} else {
		items.forEach(item => processItem(item))
	}

	let nonMatchingUrls = []
	let matchingUrls = []

	Object.values(latestItems).forEach(item => {
		const slug = item.slug
		const id = item._id
		const modifiedTime = item.modified.time
		const name = item.name
		const origin_name = item.origin_name
		const year = item.year

		const url =
			source === 'kkphim'
				? `https://phimapi.com/phim/${slug}|${id}|${modifiedTime}|${name}|${origin_name}|${year}`
				: `https://ophim1.com/phim/${slug}|${id}|${modifiedTime}|${name}|${origin_name}|${year}`

		if (namesToCheck.includes(item.name.toLowerCase())) {
			matchingUrls.push({ name: item.name, url: url })
		} else {
			nonMatchingUrls.push({ name: item.name, url: url })
		}
	})

	return { nonMatchingUrls, matchingUrls, latestItems }
}

function displayUrls() {
	const apiUrl = document.getElementById('apiUrl').value
	const nameList = document.getElementById('nameList').value
	const sourceSelect = document.getElementById('sourceSelect').value
	const startPage = parseInt(document.getElementById('startPage').value)
	const endPage = parseInt(document.getElementById('endPage').value)
	const uniqueNamesCount = document.getElementById('uniqueNamesCount')
	uniqueNamesCount.textContent = 'Đang tải...'

	function fetchAllPages(currentPage) {
		const totalPages = endPage - startPage + 1
		const progressElement = document.getElementById('loadingProgress')
		const progressWrapper = document.getElementById('progressWrapper')

		progressWrapper.style.display = 'block'

		const currentPageElement = document.getElementById('currentPage')
		currentPageElement.classList.add('jump')
		currentPageElement.textContent = endPage
		setTimeout(() => {
			currentPageElement.classList.remove('jump')
		}, 300)

		const progressValue = ((currentPage - startPage) / totalPages) * 100
		progressElement.value = progressValue

		if (currentPage > endPage) {
			uniqueNamesCount.textContent = `Số lượng phim hiện tại: ${Object.keys(allLatestItems).length}`
			showToast(`Hoàn thành ${currentPage} Page`)
			return
		}

		fetchJsonData(apiUrl, currentPage)
			.then(jsonData => {
				updateCrawlSummary(jsonData)
				const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList, sourceSelect)
				allNonMatchingUrls = allNonMatchingUrls.concat(nonMatchingUrls)
				allMatchingUrls = allMatchingUrls.concat(matchingUrls)
				Object.assign(allLatestItems, latestItems)

				updateTableWithMessage('nonMatchingTable', nonMatchingUrls, 'Không có phim không trùng khớp.')
				updateTableWithMessage('matchingTable', matchingUrls, 'Không có phim trùng khớp.')

				fetchAllPages(currentPage + 1)
			})
			.catch(error => {
				console.error('Lỗi khi tải JSON:', error)
				showToast('Không thể lấy dữ liệu từ API. Vui lòng kiểm tra URL.', 'error')
			})
	}

	fetchAllPages(startPage)
}

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

function toggleCrawlModeVisibility() {
	const sourceSelect = document.getElementById('sourceSelect')
	const crawlTheaterWrapper = document.getElementById('crawlModeWrapper')
	const buttonLnk = document.getElementById('buttonIn_list')
	const selectedSource = sourceSelect.value

	if (selectedSource === 'ophim') {
		buttonLnk.style.display = 'flex'
		document.getElementById('apiUrl').value = 'https://ophim1.com/v1/api/danh-sach/phim-le'
	} else {
		buttonLnk.style.display = 'flex'
		document.getElementById('apiUrl').value = 'https://phimapi.com/v1/api/danh-sach/phim-le'
	}
}

function getUrlbtn(element) {
	const urlLink =
		document.getElementById('sourceSelect').value === 'ophim'
			? 'https://ophim1.com/v1/api/danh-sach/'
			: 'https://phimapi.com/v1/api/danh-sach/'

	const categoryUrls = {
		getUrlHH: `${urlLink}hoat-hinh`,
		getUrlsingle: `${urlLink}phim-le`,
		getUrlseries: `${urlLink}phim-bo`,
		getUrltvshow: `${urlLink}tv-shows`
	}

	const category = element.id
	categoryUrls[category] ? (document.getElementById('apiUrl').value = categoryUrls[category]) : NaN
}
function updateCrawlSummary(jsonData) {
	const totalItems = jsonData.data.params.pagination.totalItems || 0
	const itemsPerPage = jsonData.data.params.pagination.totalItemsPerPage || 0
	const currentPage = jsonData.data.params.pagination.currentPage || 0
	const totalPages = jsonData.data.params.pagination.totalPages || 0

	document.getElementById('totalItems').textContent = totalItems
	document.getElementById('itemsPerPage').textContent = itemsPerPage
	document.getElementById('currentP').textContent = currentPage
	document.getElementById('totalPages').textContent = totalPages
}
document.getElementById('sourceSelect').addEventListener('change', toggleCrawlModeVisibility)
window.addEventListener('load', toggleCrawlModeVisibility)

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
