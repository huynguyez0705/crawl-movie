document.getElementById('fetchDataBtn').addEventListener('click', async () => {
	const baseUrl = document.getElementById('baseUrl').value
	const startPage = parseInt(document.getElementById('startPage').value)
	const endPage = parseInt(document.getElementById('endPage').value)

	document.getElementById('status').innerText = 'Fetching data...'

	try {
		const result = await window.electron.fetchData(baseUrl, startPage, endPage)
		document.getElementById('status').innerText = result.message

		// Show file download option or open the file
		const filePath = result.fileName
		const downloadLink = document.createElement('a')
		downloadLink.href = filePath
		downloadLink.download = filePath
		downloadLink.innerText = 'Download Excel File'
		document.body.appendChild(downloadLink)
	} catch (error) {
		document.getElementById('status').innerText = 'An error occurred!'
		console.error(error)
	}
})
