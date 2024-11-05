// Hàm lấy dữ liệu từ URL JSON với trang cụ thể
function fetchJsonData(apiUrl, page) {
	const url = apiUrl.replace('${i}', page) // Thay thế ${i} với số trang
	return fetch(url).then(response => {
		if (!response.ok) {
			throw new Error('Network response was not ok')
		}
		return response.json()
	})
}

// Hàm trích xuất URL từ dữ liệu JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList) {
	let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())

	let latestItems = {}
	let hasChieuRap = false

	jsonData.data.items.forEach(item => {
		if (item.chieurap === true) {
			hasChieuRap = true
			const itemName = item.name.toLowerCase()
			const itemTime = new Date(item.modified.time)

			if (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].modified.time)) {
				latestItems[itemName] = item
			}
		}
	})

	if (!hasChieuRap) {
		alert('Không có phim chiếu rạp nào')
		return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
	}

	let nonMatchingUrls = []
	let matchingUrls = []

	Object.values(latestItems).forEach(item => {
		const slug = item.slug
		const id = item._id
		const modifiedTime = item.modified.time
		const url = `https://phimapi.com/phim/${slug}|${id}|${modifiedTime}`
		const urlSecond = `https://apii.online/api/phim/${slug}`

		if (namesToCheck.includes(item.name.toLowerCase())) {
			matchingUrls.push({ name: item.name, url: url, urlSecond: urlSecond })
		} else {
			nonMatchingUrls.push({ name: item.name, url: url, urlSecond: urlSecond })
		}
	})

	return { nonMatchingUrls, matchingUrls, latestItems }
}

// Hàm hiển thị danh sách URL trên trang web từ nhiều trang
function displayUrls() {
	const apiUrl = document.getElementById('apiUrl').value
	const nameList = document.getElementById('nameList').value
	const startPage = parseInt(document.getElementById('startPage').value)
	const endPage = parseInt(document.getElementById('endPage').value)
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	const matchingTable = document.getElementById('matchingTable')
	const uniqueNamesCount = document.getElementById('uniqueNamesCount')

	nonMatchingTable.innerHTML = ''
	matchingTable.innerHTML = ''
	uniqueNamesCount.textContent = 'Đang tải...'

	let allNonMatchingUrls = []
	let allMatchingUrls = []
	let allLatestItems = {}

	function fetchAllPages(currentPage) {
		if (currentPage > endPage) {
			uniqueNamesCount.textContent = `Số lượng tên duy nhất: ${Object.keys(allLatestItems).length}`

			allNonMatchingUrls.forEach(item => {
				let row = document.createElement('tr')
				let nameCell = document.createElement('td')
				let urlCell = document.createElement('td')
				let urlSecondCell = document.createElement('td')

				nameCell.textContent = item.name
				urlCell.textContent = item.url
				urlSecondCell.textContent = item.urlSecond

				row.appendChild(nameCell)
				row.appendChild(urlCell)
				row.appendChild(urlSecondCell)
				nonMatchingTable.appendChild(row)
			})

			allMatchingUrls.forEach(item => {
				let row = document.createElement('tr')
				let nameCell = document.createElement('td')
				let urlCell = document.createElement('td')
				let urlSecondCell = document.createElement('td')

				nameCell.textContent = item.name
				urlCell.textContent = item.url
				urlSecondCell.textContent = item.urlSecond

				row.appendChild(nameCell)
				row.appendChild(urlCell)
				row.appendChild(urlSecondCell)
				matchingTable.appendChild(row)
			})
			return
		}

		fetchJsonData(apiUrl, currentPage)
			.then(jsonData => {
				const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList)

				allNonMatchingUrls = allNonMatchingUrls.concat(nonMatchingUrls)
				allMatchingUrls = allMatchingUrls.concat(matchingUrls)
				Object.assign(allLatestItems, latestItems)

				fetchAllPages(currentPage + 1)
			})
			.catch(error => {
				console.error('Lỗi khi tải JSON:', error)
			})
	}

	fetchAllPages(startPage)
}

// Hàm sao chép cột cụ thể (Name, URL 1, URL 2) từ bảng được chỉ định vào clipboard
function copyTableColumn(tableId, columnIndex) {
	const table = document.getElementById(tableId)
	let values = []

	// Lấy tất cả các giá trị trong cột chỉ định của bảng
	table.querySelectorAll('tr').forEach(row => {
		const cellText = row.cells[columnIndex]?.textContent || ''
		values.push(cellText)
	})

	if (values.length === 0) {
		alert('Không có dữ liệu để sao chép.')
		return
	}

	// Sao chép toàn bộ danh sách vào clipboard
	copyToClipboard(values.join('\n'))
}

// Hàm sao chép nội dung vào clipboard với xử lý lỗi
function copyToClipboard(text) {
	if (!navigator.clipboard) {
		alert('Trình duyệt của bạn không hỗ trợ sao chép vào clipboard.')
		return
	}

	navigator.clipboard
		.writeText(text)
		.then(() => {
			alert('Đã sao chép thành công!')
		})
		.catch(err => {
			alert('Lỗi khi sao chép vào clipboard.')
			console.error('Lỗi khi sao chép:', err)
		})
}

// Gắn sự kiện click vào các button copy cho từng hành động riêng biệt
document.getElementById('getUrlsButton').addEventListener('click', displayUrls)

// Non-matching table buttons
document.getElementById('copyNonMatchingNamesButton').addEventListener('click', () => copyTableColumn('nonMatchingTable', 0))
document.getElementById('copyNonMatchingUrl1Button').addEventListener('click', () => copyTableColumn('nonMatchingTable', 1))
document.getElementById('copyNonMatchingUrl2Button').addEventListener('click', () => copyTableColumn('nonMatchingTable', 2))

// Matching table buttons
document.getElementById('copyMatchingNamesButton').addEventListener('click', () => copyTableColumn('matchingTable', 0))
document.getElementById('copyMatchingUrl1Button').addEventListener('click', () => copyTableColumn('matchingTable', 1))
document.getElementById('copyMatchingUrl2Button').addEventListener('click', () => copyTableColumn('matchingTable', 2))
