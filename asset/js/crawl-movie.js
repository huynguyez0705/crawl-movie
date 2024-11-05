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
function getUrls(jsonData, nameList) {
	let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())

	let latestItems = {}

	// Lọc trùng tên và giữ lại item có thời gian mới nhất
	jsonData.items.forEach(item => {
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
		const url = `https://apii.online/api/phim/${slug}|${id}|${modifiedTime}`

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
	const nonMatchingTable = document.getElementById('nonMatchingTable')
	const matchingTable = document.getElementById('matchingTable')
	const uniqueNamesCount = document.getElementById('uniqueNamesCount') // Tham chiếu đến phần tử đếm tên

	nonMatchingTable.innerHTML = '' // Xóa nội dung cũ
	matchingTable.innerHTML = '' // Xóa nội dung cũ

	fetchJsonData(apiUrl)
		.then(jsonData => {
			const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList)

			// Hiển thị số lượng tên duy nhất
			uniqueNamesCount.textContent = `Số lượng tên duy nhất: ${Object.keys(latestItems).length}`

			// Hiển thị các URL không bị trùng
			nonMatchingUrls.forEach(item => {
				let row = document.createElement('tr')
				let nameCell = document.createElement('td')
				let urlCell = document.createElement('td')
				nameCell.textContent = item.name
				urlCell.textContent = item.url
				row.appendChild(nameCell)
				row.appendChild(urlCell)
				nonMatchingTable.appendChild(row)
			})

			// Hiển thị các tên trùng và URL tương ứng
			matchingUrls.forEach(item => {
				let row = document.createElement('tr')
				let nameCell = document.createElement('td')
				let urlCell = document.createElement('td')
				nameCell.textContent = item.name
				urlCell.textContent = item.url
				row.appendChild(nameCell)
				row.appendChild(urlCell)
				matchingTable.appendChild(row)
			})
		})
		.catch(error => {
			console.error('Lỗi khi tải JSON:', error)
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

// Gắn sự kiện click vào button hiển thị URL
document.getElementById('getUrlsButton').addEventListener('click', displayUrls)

// Gắn sự kiện click vào các button copy
document.getElementById('copyNonMatchingNamesButton').addEventListener('click', copyNonMatchingNames)
document.getElementById('copyNonMatchingButton').addEventListener('click', copyNonMatchingUrls)
document.getElementById('copyMatchingButton').addEventListener('click', copyMatchingUrls)
