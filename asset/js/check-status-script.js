// Function to check the status of each URL entered in the textarea
document.getElementById('checkUrlsButton').addEventListener('click', () => {
	const urlList = document.getElementById('urlList').value.trim().split('\n')
	const urlStatusTable = document.getElementById('urlStatusTable')
	urlStatusTable.innerHTML = '' // Clear previous results

	const statusResults = [] // To store the results in the correct order

	// Fetch status for each URL in the order they were pasted
	urlList.forEach((url, index) => {
		if (url) {
			checkUrlStatus(url)
				.then(result => {
					// Store result at the original index
					statusResults[index] = { url, status: result.status, fullUrl: result.fullUrl }

					// Only render table once all results are available
					if (statusResults.filter(Boolean).length === urlList.length) {
						displayResults(statusResults)
					}
				})
				.catch(() => {
					// Handle errors by marking status as "False" (failed requests)
					statusResults[index] = { url, status: false, fullUrl: '' }

					if (statusResults.filter(Boolean).length === urlList.length) {
						displayResults(statusResults)
					}
				})
		} else {
			statusResults[index] = { url: '', status: false, fullUrl: '' }
		}
	})
})

// Function to display results in the correct order
function displayResults(results) {
	const urlStatusTable = document.getElementById('urlStatusTable')
	urlStatusTable.innerHTML = '' // Clear previous table entries

	results.forEach(({ url, fullUrl, status }) => {
		const row = document.createElement('tr')

		// URL cell
		const urlCell = document.createElement('td')
		urlCell.textContent = url
		row.appendChild(urlCell)

		// Full URL cell
		const fullUrlCell = document.createElement('td')
		fullUrlCell.textContent = status ? fullUrl : '' // Display full URL only if status is true
		row.appendChild(fullUrlCell)

		// Status cell
		const statusCell = document.createElement('td')
		statusCell.textContent = status ? 'True' : 'False'
		statusCell.style.color = status ? 'green' : 'red'
		row.appendChild(statusCell)

		urlStatusTable.appendChild(row)
	})
}

// Function to check the status of a single URL and generate full URL if status is true
async function checkUrlStatus(url) {
	try {
		const response = await fetch(url)
		const data = await response.json()

		// Check if status is true and generate full URL format
		if (data.status === true && data.movie && data.movie._id && data.movie.modified && data.movie.modified.time) {
			const fullUrl = `${url}|${data.movie._id}|${data.movie.modified.time}`
			return { status: true, fullUrl: fullUrl }
		} else {
			return { status: false, fullUrl: '' }
		}
	} catch (error) {
		console.error('Error fetching URL:', error)
		return { status: false, fullUrl: '' }
	}
}

// Copy Status Button
document.getElementById('copyStatusButton').addEventListener('click', () => {
	const statusCells = Array.from(document.querySelectorAll('#urlStatusTable td:nth-child(3)'))
	const statusText = statusCells.map(cell => cell.textContent).join('\n')

	// Copy to clipboard
	copyToClipboard(statusText)
	alert('Đã sao chép trạng thái vào clipboard!')
})

// Copy Full URL Button
document.getElementById('copyFullUrlButton').addEventListener('click', () => {
	const fullUrlCells = Array.from(document.querySelectorAll('#urlStatusTable td:nth-child(2)'))
	const fullUrlText = fullUrlCells
		.map(cell => cell.textContent)
		.filter(text => text)
		.join('\n') // Filter empty cells

	// Copy to clipboard
	copyToClipboard(fullUrlText)
	alert('Đã sao chép URL Hoàn Chỉnh vào clipboard!')
})

// Function to copy text to clipboard
function copyToClipboard(text) {
	navigator.clipboard.writeText(text).catch(err => {
		console.error('Lỗi khi sao chép:', err)
	})
}
