document.getElementById('checkUrlsButton').addEventListener('click', () => {
	const urlList = document.getElementById('urlList').value.trim().split('\n')
	const urlStatusTable = document.getElementById('urlStatusTable')
	urlStatusTable.innerHTML = '' // Xóa kết quả trước đó
	function validateURL(url) {
		const regex = /^https:\/\/[^\s]+$/ // Kiểm tra URL có bắt đầu bằng https://
		return regex.test(url)
	}
	if (urlList.every(url => url.trim() === '')) {
		showToast('Vui lòng nhập ít nhất một URL hợp lệ.', 'error')
		return
	}

	const statusResults = [] // Lưu kết quả trạng thái cho mỗi URL

	// Lấy trạng thái của từng URL trong danh sách
	urlList.forEach((url, index) => {
		if (url) {
			if (!validateURL(url)) {
				showToast(`URL không hợp lệ: ${url}`, 'error')
				return // Dừng việc xử lý với URL không hợp lệ
			}
			checkUrlStatus(url)
				.then(result => {
					// Lưu kết quả tại chỉ số gốc của URL
					statusResults[index] = {
						name: result.name,
						url,
						status: result.status,
						fullUrl: result.fullUrl,
						type: result.type,
						chieurap: result.chieurap
					}

					// Chỉ hiển thị bảng khi tất cả kết quả có mặt
					if (statusResults.filter(Boolean).length === urlList.length) {
						displayResults(statusResults)
					}
				})
				.catch(() => {
					// Xử lý lỗi, đánh dấu trạng thái là "False"
					statusResults[index] = { name: '', url, status: false, fullUrl: '', type: '', chieurap: false }

					if (statusResults.filter(Boolean).length === urlList.length) {
						displayResults(statusResults)
					}
				})
		} else {
			statusResults[index] = { name: '', url, status: false, fullUrl: '', type: '', chieurap: false }
		}
	})
})

// Hàm hiển thị kết quả
function displayResults(results) {
	const urlStatusTable = document.getElementById('urlStatusTable')
	const uniqueNamesCount = document.getElementById('uniqueNamesCount')

	urlStatusTable.innerHTML = '' // Xóa bảng cũ
	uniqueNamesCount.style.display = 'block'
	uniqueNamesCount.textContent = 'Đang tải...'

	let countTrue = 0
	let countFalse = 0

	results.forEach(({ name, url, fullUrl, status, type, chieurap }) => {
		const row = document.createElement('tr')
		// Tạo cột Name
		const urlName = document.createElement('td')
		urlName.textContent = name
		row.appendChild(urlName)

		// Tạo cột URL
		const urlCell = document.createElement('td')
		urlCell.textContent = url
		row.appendChild(urlCell)

		// Tạo cột URL hoàn chỉnh
		const fullUrlCell = document.createElement('td')
		fullUrlCell.textContent = status ? fullUrl : 'None'
		row.appendChild(fullUrlCell)

		// Tạo cột trạng thái
		const statusCell = document.createElement('td')
		statusCell.textContent = status ? 'True' : 'False'
		statusCell.style.color = status ? 'green' : 'red'
		row.appendChild(statusCell)

		// Tạo cột danh mục
		const categoriesCell = document.createElement('td')
		let categoriesText = ''
		if (status) {
			categoriesText += type === 'single_movies' || type === 'single' ? 'Phim Lẻ' : ''
			categoriesText += type === 'hoathinh' ? 'Hoạt Hình' : ''
			categoriesText += type === 'tvshows' ? 'TV Shows' : ''
			categoriesText += type === 'tv_series' || type === 'series' ? 'Phim bộ' : ''
		}
		if (chieurap) {
			if (categoriesText) categoriesText += ', '
			categoriesText += 'Phim chiếu rạp'
		}
		categoriesCell.textContent = categoriesText
		row.appendChild(categoriesCell)

		// Tạo cột Xem
		const viewCell = document.createElement('td')
		const viewButton = document.createElement('button')
		viewButton.textContent = 'Xem'
		viewButton.classList.add('btn-view') // Thêm class tại đây
		viewButton.disabled = !status // Vô hiệu hóa nếu trạng thái là False
		viewButton.addEventListener('click', () => showPopup(fullUrl))
		viewCell.appendChild(viewButton)
		row.appendChild(viewCell)

		// Thêm dòng vào bảng
		urlStatusTable.appendChild(row)

		// Tăng số lượng phim thành công và không thành công
		status ? countTrue++ : countFalse++
	})

	// Cập nhật thông tin số lượng tên duy nhất
	uniqueNamesCount.innerHTML = `Phim crawl được <span class="countMovie">${countTrue}</span>
	<span class="line-break">Phim không crawl được <span class="countMovie false">${countFalse}</span></span>`

	// Hiển thị thông báo
	if (countTrue > 0) showToast(`Có ${countTrue} phim crawl hoàn thành`, 'success')
	if (countFalse > 0) showToast(`Có ${countFalse} phim không crawl được`, 'error')
	showToast('Hoàn thành')
}

// Hàm hiển thị popup
async function showPopup(fullUrl) {
	const popup = document.getElementById('popup')
	const popupContent = document.getElementById('popupContent')
	const popupOverlay = document.getElementById('popupOverlay')
	const popupClose = document.getElementById('popupClose')

	// Lấy phần URL trước dấu |
	const apiUrl = fullUrl.split('|')[0]

	try {
		const response = await fetch(apiUrl)
		const data = await response.json()
		popupContent.textContent = JSON.stringify(data, null, 2) // Hiển thị JSON đẹp
	} catch (error) {
		popupContent.textContent = `Lỗi khi lấy dữ liệu: ${error}`
	}
	// popupContent.innerHTML = `<a href="${apiUrl}" target="_blank">${apiUrl}</a>`
	// Hiển thị popup và overlay
	popup.style.display = 'block'
	popupOverlay.style.display = 'block'

	// Đóng popup
	popupClose.addEventListener('click', () => {
		popup.style.display = 'none'
		popupOverlay.style.display = 'none'
	})
	popupOverlay.addEventListener('click', () => {
		popup.style.display = 'none'
		popupOverlay.style.display = 'none'
	})
}

// Hàm kiểm tra trạng thái URL và trả về full URL nếu trạng thái là true
async function checkUrlStatus(url) {
	// Danh sách ánh xạ domain
	const domainMap = {
		'ophim17.cc': 'ophim1.com',
		'www.kkphim.vip': 'phimapi.com',
		'kkphim.vip': 'phimapi.com'
	}

	try {
		let modifiedUrl = url

		// Chuyển đổi domain nếu có trong domainMap
		for (const [source, target] of Object.entries(domainMap)) {
			if (url.includes(source)) {
				modifiedUrl = url.replace(source, target)
			}
		}

		// Chuyển đổi /v1/api/phim/ thành /phim/ nếu có
		if (modifiedUrl.includes('ophim1.com/v1/api/phim/')) {
			modifiedUrl = modifiedUrl.replace('/v1/api/phim/', '/phim/')
		}

		// Gửi yêu cầu đến URL đã chuyển đổi
		const response = await fetch(modifiedUrl)
		const data = await response.json()

		// Kiểm tra nếu status là true và đảm bảo rằng các trường movie và thông tin cần thiết có mặt
		if (data.status === true || data.status === 'success') {
			const type = data.movie.type || ''
			const name = data.movie.name
			const modifiedTime = data.movie.modified?.time ?? data.movie.modified ?? ''
			const originName = data.movie?.origin_name ?? data.movie?.original_name ?? ''
			const id = data.movie?._id ?? data.movie?.id ?? ''
			const fullUrl = `${modifiedUrl}|${id}|${modifiedTime}|${data.movie.name}|${originName}|${data.movie.year}`
			return { name: name, status: true, fullUrl: fullUrl, type: type, chieurap: data.movie.chieurap || false }
		} else {
			return { name: '', status: false, fullUrl: '', type: '', chieurap: false }
		}
	} catch (error) {
		console.error('Lỗi khi lấy dữ liệu từ URL:', error)
		showToast('Lỗi khi lấy dữ liệu từ URL: ' + error, 'error')
		return { name: '', status: false, fullUrl: '', type: '', chieurap: false }
	}
}

// Hàm hiển thị thông báo (toast)
function showToast(message, type = 'success') {
	const toast = document.createElement('div')
	toast.classList.add('toast', 'show')
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

// Hàm sao chép văn bản vào clipboard
function copyToClipboard(text) {
	navigator.clipboard.writeText(text).catch(err => {
		showToast(`Lỗi khi sao chép: ${err}`, 'error')
		console.error('Lỗi khi sao chép:', err)
	})
}

function copyColumn(columnIndex, successMessage) {
	const cells = Array.from(document.querySelectorAll(`#urlStatusTable td:nth-child(${columnIndex})`))
	const text = cells
		.map(cell => cell.textContent)
		.filter(text => text)
		.join('\n')
	copyToClipboard(text)
	showToast(successMessage, 'info')
}

// Các sự kiện sao chép
document.getElementById('copyFullName').addEventListener('click', () => {
	copyColumn(1, 'Đã sao chép Name!')
})
document.getElementById('copyUrl').addEventListener('click', () => {
	copyColumn(2, 'Đã sao chép URL')
})
document.getElementById('coppyFullUrl').addEventListener('click', () => {
	copyColumn(3, 'Đã sao chép fullUrl')
})
document.getElementById('copyStatus').addEventListener('click', () => {
	copyColumn(4, 'Đã sao chép trạng thái')
})
document.getElementById('copyCategories').addEventListener('click', () => {
	copyColumn(5, 'Đã sao chép danh mục')
})
