// Hàm lấy dữ liệu từ URL JSON
function fetchJsonData(apiUrl) {
	return fetch(apiUrl).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok')
		}
		return response.json()
	})
}

// Hàm trích xuất URL từ dữ liệu JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList, source) {
	let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())
	let latestItems = {}

	// Lấy danh sách items từ nguồn phù hợp
	let items = source === 'kkphim' ? jsonData.data.items : jsonData.items

	// Lọc trùng tên và giữ lại item có thời gian mới nhất
	items.forEach(item => {
		const itemName = item.name.toLowerCase()
		const itemTime = new Date(item.modified.time)

		// Nếu item chưa tồn tại trong latestItems hoặc thời gian mới hơn
		if (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].modified.time)) {
			latestItems[itemName] = item // Cập nhật item mới nhất
		}
	})

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
		const url = source === 'kkphim' ? `https://phimapi.com/phim/${slug}|${id}|${modifiedTime}|${name}|${origin_name}|${year}` : `https://ophim1.com/phim/${slug}|${id}|${modifiedTime}`

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
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	const matchingTable = document.getElementById('matchingTable')
	const uniqueNamesCount = document.getElementById('uniqueNamesCount') // Tham chiếu đến phần tử đếm tên

	nonMatchingTable.innerHTML = '' // Xóa nội dung cũ
	matchingTable.innerHTML = '' // Xóa nội dung cũ

	fetchJsonData(apiUrl)
		.then(jsonData => {
			const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList, sourceSelect)

			// Hiển thị số lượng tên duy nhất
			uniqueNamesCount.textContent = `Số lượng tên duy nhất: ${Object.keys(latestItems).length}`

			// Hiển thị các URL không bị trùng
			updateTableWithMessage('nonMatchingTable', nonMatchingUrls, 'Không có URL không trùng khớp')

			// Hiển thị các tên trùng và URL tương ứng
			updateTableWithMessage('matchingTable', matchingUrls, 'Không có URL trùng khớp')
		})
		.catch(error => {
			console.error('Lỗi khi tải JSON:', error)
			alert('Không thể lấy dữ liệu từ API. Vui lòng kiểm tra URL.')
		})
}

// Hàm cập nhật bảng với dữ liệu hoặc thông báo nếu không có dữ liệu
function updateTableWithMessage(tableId, items, message) {
	const tableBody = document.getElementById(tableId)
	tableBody.innerHTML = '' // Clear previous content

	if (items.length === 0) {
		const row = document.createElement('tr')
		const cell = document.createElement('td')
		cell.colSpan = 2 // Merge columns
		cell.textContent = message
		row.appendChild(cell)
		tableBody.appendChild(row)
		return
	}

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

// Hàm sao chép nội dung vào clipboard
function copyToClipboard(text) {
	navigator.clipboard
		.writeText(text)
		.then(() => {
			alert('Đã sao chép thành công!')
		})
		.catch(err => {
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
function copyNonMatchingUrls() {
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	let urls = []
	nonMatchingTable.querySelectorAll('tr td:nth-child(2)').forEach(cell => {
		urls.push(cell.textContent)
	})
	copyToClipboard(urls.join('\n'))
}

// Hàm sao chép các URL trùng khớp
function copyMatchingUrls() {
	const matchingTable = document.getElementById('matchingTable')
	let urls = []
	matchingTable.querySelectorAll('tr td:nth-child(2)').forEach(cell => {
		urls.push(cell.textContent)
	})
	copyToClipboard(urls.join('\n'))
}

// Gắn sự kiện click vào button hiển thị URL
document.getElementById('getUrlsButton').addEventListener('click', displayUrls)

// Gắn sự kiện click vào các button copy
document.getElementById('copyNonMatchingNamesButton').addEventListener('click', copyNonMatchingNames)
document.getElementById('copyNonMatchingButton').addEventListener('click', copyNonMatchingUrls)
document.getElementById('copyMatchingButton').addEventListener('click', copyMatchingUrls)
