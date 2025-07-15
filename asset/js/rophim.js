// Khai báo các biến toàn cục để lưu trữ dữ liệu
let allNonMatchingUrls = []
let allMatchingUrls = []
let allLatestItems = {}

// Hàm chờ (để thêm độ trễ giữa các yêu cầu)
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

// Hàm lấy dữ liệu từ URL JSON với phân trang
async function fetchJsonData(apiUrl, page, sort, keyword, genres, countries, type, years) {
	const baseUrl = apiUrl || 'https://api.rophim.me/v1/movie/filterV2'
	const proxyUrl = 'https://api.allorigins.win/raw?url=' // Proxy mới
	const defaultParams = {
		countries: countries || '',
		genres: genres || '',
		years: years || '',
		type: type || '',
		status: '',
		exclude_status: 'Upcoming',
		versions: '',
		rating: '',
		networks: '',
		productions: '',
		sort: sort || 'release_date',
		page: page || 1,
		keyword: keyword || ''
	}

	const urlObj = new URL(baseUrl)
	const existingParams = new URLSearchParams(urlObj.search)

	Object.entries(defaultParams).forEach(([key, value]) => {
		existingParams.set(key, value)
	})

	urlObj.search = existingParams.toString()
	let url = proxyUrl + encodeURIComponent(urlObj.toString()) // Sử dụng proxy mới

	console.log('Đang lấy dữ liệu từ URL:', url)

	try {
		const response = await fetch(url)
		if (!response.ok) {
			throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`)
		}
		return await response.json()
	} catch (error) {
		console.error('Lỗi khi lấy dữ liệu:', error)
		showToast(`Lỗi khi tải dữ liệu: ${error.message}`, 'error')
		throw error
	}
}

// Hàm hiển thị thông báo toast
function showToast(message, type = 'success') {
	const toast = document.createElement('div')
	toast.classList.add('toast')
	toast.style.position = 'fixed'
	toast.style.bottom = '20px'
	toast.style.right = '20px'
	toast.style.padding = '10px 20px'
	toast.style.color = '#fff'
	toast.style.borderRadius = '5px'
	toast.style.zIndex = '1000'

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
	closeBtn.style.marginLeft = '10px'
	closeBtn.style.cursor = 'pointer'
	closeBtn.addEventListener('click', () => {
		toast.classList.add('hide')
		setTimeout(() => toast.remove(), 500)
	})
	toast.appendChild(closeBtn)

	const toastContainer = document.querySelector('.toast-container') || document.body
	toastContainer.appendChild(toast)

	setTimeout(() => {
		toast.classList.add('hide')
		setTimeout(() => toast.remove(), 500)
	}, 3000)
}

// Hàm trích xuất dữ liệu từ JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList) {
	let namesToCheck = nameList
		.split('\n')
		.map(name => name.trim().toLowerCase())
		.filter(name => name)
	let latestItems = {}

	let items = jsonData.result?.items || []

	if (!Array.isArray(items)) {
		console.error('Dữ liệu items không hợp lệ:', items)
		showToast('Dữ liệu items không hợp lệ', 'error')
		return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
	}

	items.forEach(item => {
		const itemName = item.title?.toLowerCase()
		const itemTime = new Date(item.release_date)

		if (itemName && (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].release_date))) {
			latestItems[itemName] = item
		}
	})

	let nonMatchingUrls = []
	let matchingUrls = []

	Object.values(latestItems).forEach(item => {
		const title = item.title || 'N/A'
		const englishTitle = item.english_title || 'Không có'
		const slug = item.slug || 'N/A'
		const id = item._id || 'N/A'

		const url = `https://rophim.com/phim/${slug}|${id}|${title}|${englishTitle}`

		if (namesToCheck.includes(title.toLowerCase())) {
			matchingUrls.push({ title, englishTitle, slug, id, url })
		} else {
			nonMatchingUrls.push({ title, englishTitle, slug, id, url })
		}
	})

	return { nonMatchingUrls, matchingUrls, latestItems }
}

// Hàm lấy danh sách các giá trị active từ một nhóm filter
function getActiveFilterValues(groupId) {
	const buttons = document.querySelectorAll(`#${groupId} .filter-btn.active`)
	const values = Array.from(buttons)
		.map(btn => btn.getAttribute('data-value'))
		.filter(value => value !== '')
	return values.length > 0 ? values.join(',') : ''
}

// Hàm hiển thị kết quả
async function displayUrls() {
	const apiUrl = document.getElementById('apiUrl')?.value || ''
	const nameList = document.getElementById('nameList')?.value || ''
	const startPage = parseInt(document.getElementById('startPage')?.value) || 1
	const endPage = parseInt(document.getElementById('endPage')?.value) || 1
	const keyword = document.getElementById('keyword')?.value || ''

	const sortButton = document.querySelector('#sort-buttons .filter-btn.active')
	const sort = sortButton ? sortButton.getAttribute('data-value') : 'release_date'
	const genres = getActiveFilterValues('genres-buttons')
	const countries = getActiveFilterValues('countries-buttons')
	const typeButton = document.querySelector('#type-buttons .filter-btn.active')
	const type = typeButton ? typeButton.getAttribute('data-value') : ''
	const years = getActiveFilterValues('years-buttons')

	const uniqueNamesCount = document.getElementById('uniqueNamesCount')
	uniqueNamesCount.textContent = 'Đang tải...'

	allNonMatchingUrls = []
	allMatchingUrls = []
	allLatestItems = {}

	const progressElement = document.getElementById('progressWrapper')
	if (progressElement) progressElement.style.display = 'block'

	for (let currentPage = startPage; currentPage <= endPage; currentPage++) {
		const currentPageElement = document.getElementById('currentPage')
		const currentPElement = document.getElementById('currentP')

		if (currentPageElement && currentPElement) {
			currentPageElement.classList.add('jump')
			currentPageElement.textContent = currentPage
			currentPElement.textContent = currentPage
			setTimeout(() => currentPageElement.classList.remove('jump'), 300)
		}

		try {
			const jsonData = await fetchJsonData(apiUrl, currentPage, sort, keyword, genres, countries, type, years)
			updateCrawlSummary(jsonData)
			const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList)

			allNonMatchingUrls = [...allNonMatchingUrls, ...nonMatchingUrls]
			allMatchingUrls = [...allMatchingUrls, ...matchingUrls]
			Object.assign(allLatestItems, latestItems)

			updateTableWithMessage('nonMatchingTable', allNonMatchingUrls, 'Không có phim không trùng khớp.')
			updateTableWithMessage('matchingTable', allMatchingUrls, 'Không có phim trùng khớp.')

			uniqueNamesCount.textContent = `Số lượng phim hiện tại: ${Object.keys(allLatestItems).length}`
			showToast(`Hoàn thành trang ${currentPage}`)

			// Tăng độ trễ lên 2 giây để tránh rate limiting
			await delay(2000)
		} catch (error) {
			console.error('Lỗi khi crawl trang:', currentPage, error)
			showToast(`Lỗi khi crawl trang ${currentPage}: ${error.message}`, 'error')
		}

		const progressBar = document.getElementById('loadingProgress')
		if (progressBar) {
			const progressValue = ((currentPage - startPage + 1) / (endPage - startPage + 1)) * 100
			progressBar.value = progressValue
		}
	}

	if (progressElement) progressElement.style.display = 'none'
}

// Hàm cập nhật bảng với thông báo
function updateTableWithMessage(tableId, items, message) {
	const tableBody = document.getElementById(tableId)
	if (!tableBody) {
		console.error(`Không tìm thấy phần tử với ID: ${tableId}`)
		showToast(`Không tìm thấy bảng với ID: ${tableId}`, 'error')
		return
	}
	tableBody.innerHTML = ''

	if (items.length === 0) {
		const row = document.createElement('tr')
		const cell = document.createElement('td')
		cell.colSpan = 5
		cell.textContent = message
		row.appendChild(cell)
		tableBody.appendChild(row)
	} else {
		items.forEach((item, index) => {
			const row = document.createElement('tr')
			row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.title}</td>
                <td>${item.englishTitle}</td>
                <td>${item.slug}</td>
                <td>${item.id}</td>
            `
			tableBody.appendChild(row)
		})
	}
}

// Hàm cập nhật thông tin crawl
function updateCrawlSummary(jsonData) {
	const totalItems = document.getElementById('totalItems')
	const itemsPerPage = document.getElementById('itemsPerPage')
	const totalPages = document.getElementById('totalPages')

	if (totalItems) totalItems.textContent = jsonData.result?.item_count || 0
	if (itemsPerPage) itemsPerPage.textContent = jsonData.result?.items?.length || 0
	if (totalPages) totalPages.textContent = jsonData.result?.page_count || 0
}

// Hàm sao chép nội dung vào clipboard
function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => showToast('Đã sao chép thành công!'))
		.catch(err => {
			showToast('Lỗi khi sao chép: ' + err, 'error')
			console.error('Lỗi khi sao chép:', err)
		})
}

// Hàm copy toàn bộ 5 cột
function copyAllColumns(tableId, isMatching) {
	const items = isMatching ? allMatchingUrls : allNonMatchingUrls
	let text = 'STT\tTên\tTên Tiếng Anh\tSlug\tID\n'
	items.forEach((item, index) => {
		text += `${index + 1}\t${item.title}\t${item.englishTitle}\t${item.slug}\t${item.id}\n`
	})
	copyToClipboard(text)
}

// Hàm copy cột Tên
function copyNames(isMatching) {
	const items = isMatching ? allMatchingUrls : allNonMatchingUrls
	const names = items.map(item => item.title).join('\n')
	copyToClipboard(names)
}

// Hàm copy cột Tên Tiếng Anh
function copyEnglishNames(isMatching) {
	const items = isMatching ? allMatchingUrls : allNonMatchingUrls
	const englishNames = items.map(item => item.englishTitle).join('\n')
	copyToClipboard(englishNames)
}

// Hàm copy cột Slug
function copySlugs(isMatching) {
	const items = isMatching ? allMatchingUrls : allNonMatchingUrls
	const slugs = items.map(item => item.slug).join('\n')
	copyToClipboard(slugs)
}

// Hàm copy cột ID
function copyIds(isMatching) {
	const items = isMatching ? allMatchingUrls : allNonMatchingUrls
	const ids = items.map(item => item.id).join('\n')
	copyToClipboard(ids)
}

// Hàm làm mới dữ liệu
function resetData() {
	allNonMatchingUrls = []
	allMatchingUrls = []
	allLatestItems = {}
	document.getElementById('uniqueNamesCount').textContent = 'Số lượng phim hiện tại: 0'
	document.getElementById('totalItems').textContent = '0'
	document.getElementById('itemsPerPage').textContent = '0'
	document.getElementById('currentP').textContent = '0'
	document.getElementById('totalPages').textContent = '0'
	updateTableWithMessage('nonMatchingTable', [], 'Không có phim không trùng khớp.')
	updateTableWithMessage('matchingTable', [], 'Không có phim trùng khớp.')
	showToast('Đã làm mới dữ liệu', 'success')
}

// Gắn sự kiện sau khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
	// Xử lý multi-select cho Quốc gia, Thể loại, Năm phát hành
	const multiSelectGroups = [
		{ id: 'countries-buttons', label: 'Đã chọn quốc gia' },
		{ id: 'genres-buttons', label: 'Đã chọn thể loại' },
		{ id: 'years-buttons', label: 'Đã chọn năm phát hành' }
	]
	multiSelectGroups.forEach(group => {
		const groupElement = document.getElementById(group.id)
		if (groupElement) {
			const buttons = groupElement.querySelectorAll('.filter-btn')
			buttons.forEach(btn => {
				btn.addEventListener('click', () => {
					console.log(`${group.label}: ${btn.textContent}`)
					const isAllButton = btn.getAttribute('data-value') === ''
					const allButton = groupElement.querySelector('.filter-btn[data-value=""]')

					if (isAllButton) {
						buttons.forEach(b => b.classList.remove('active'))
						btn.classList.add('active')
					} else {
						allButton.classList.remove('active')
						btn.classList.toggle('active')
						const activeButtons = groupElement.querySelectorAll('.filter-btn.active')
						if (activeButtons.length === 0) {
							allButton.classList.add('active')
						}
					}
				})
			})
		}
	})

	// Xử lý single-select cho Loại phim và Sắp xếp
	const singleSelectGroups = [
		{ id: 'type-buttons', label: 'Đã chọn loại phim' },
		{ id: 'sort-buttons', label: 'Đã chọn sắp xếp' }
	]
	singleSelectGroups.forEach(group => {
		const groupElement = document.getElementById(group.id)
		if (groupElement) {
			const buttons = groupElement.querySelectorAll('.filter-btn')
			buttons.forEach(btn => {
				btn.addEventListener('click', () => {
					console.log(`${group.label}: ${btn.textContent}`)
					buttons.forEach(b => b.classList.remove('active'))
					btn.classList.add('active')
				})
			})
		}
	})

	// Toggle bộ lọc
	const filterToggle = document.querySelector('.filter-toggle')
	const filterRpGr = document.querySelector('.filter-rp-gr')
	const closeFilterBtn = document.getElementById('close-filter')

	if (filterToggle && filterRpGr) {
		filterToggle.addEventListener('click', () => {
			filterRpGr.classList.toggle('hidden')
		})
	}

	if (closeFilterBtn && filterRpGr) {
		closeFilterBtn.addEventListener('click', () => {
			filterRpGr.classList.add('hidden')
		})
	}

	// Gắn sự kiện cho các nút
	document.getElementById('getUrlsButton')?.addEventListener('click', displayUrls)
	document.getElementById('resetButton')?.addEventListener('click', resetData)
	document.getElementById('copyAllNonMatchingButton')?.addEventListener('click', () => copyAllColumns('nonMatchingTable', false))
	document.getElementById('copyNonMatchingNamesButton')?.addEventListener('click', () => copyNames(false))
	document.getElementById('copyNonMatchingEnglishNamesButton')?.addEventListener('click', () => copyEnglishNames(false))
	document.getElementById('copyNonMatchingSlugsButton')?.addEventListener('click', () => copySlugs(false))
	document.getElementById('copyNonMatchingIdsButton')?.addEventListener('click', () => copyIds(false))
	document.getElementById('copyAllMatchingButton')?.addEventListener('click', () => copyAllColumns('matchingTable', true))
	document.getElementById('copyMatchingNamesButton')?.addEventListener('click', () => copyNames(true))
	document.getElementById('copyMatchingEnglishNamesButton')?.addEventListener('click', () => copyEnglishNames(true))
	document.getElementById('copyMatchingSlugsButton')?.addEventListener('click', () => copySlugs(true))
	document.getElementById('copyMatchingIdsButton')?.addEventListener('click', () => copyIds(true))
})
