const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')
const axios = require('axios')
const cheerio = require('cheerio')
const XLSX = require('xlsx')
const fs = require('fs')

let mainWindow

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true, // Cho phép sử dụng Node.js trong renderer process
			preload: path.join(__dirname, 'preload.js') // Đảm bảo preload.js đã được cấu hình
		}
	})

	// Đảm bảo rằng đường dẫn này chính xác
	mainWindow.loadFile(path.join(__dirname, '../public/index.html'))

	mainWindow.on('closed', () => {
		mainWindow = null
	})
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// Function to fetch movie ID using the API
async function fetchMovieID(slug) {
	const apiURL = `https://ophim1.com/phim/${slug}`
	try {
		const response = await axios.get(apiURL)
		const data = response.data
		if (data.movie && data.movie._id) {
			return data.movie._id
		}
	} catch (error) {
		console.error(`Error fetching data for slug: ${slug}, error: ${error}`)
	}
	return 'N/A'
}

// Function to process a single page and generate the desired output
async function processMovies(pageUrl) {
	try {
		const response = await axios.get(pageUrl)
		const $ = cheerio.load(response.data)
		const rows = $('table tbody tr')
		const movies = []

		for (const row of rows) {
			const columns = $(row).find('td')
			if (columns.length > 0) {
				const linkElement = $(columns[0]).find('a')
				const link = linkElement.attr('href')
				const slug = link.split('/').pop()
				const movieID = await fetchMovieID(slug)

				const url = `https://ophim1.com${link}`
				const api = `https://ophim1.com/phim/${slug}|${movieID}`
				movies.push({ URL: url, API: api, slug: slug })
			}
		}

		return movies
	} catch (error) {
		console.error(`Error processing movies: ${error}`)
		return []
	}
}

// Xử lý yêu cầu từ renderer process để tải dữ liệu và xuất file Excel
ipcMain.handle('fetch-data', async (event, baseUrl, startPage, endPage) => {
	let allMovies = []

	// Lấy dữ liệu từ nhiều trang
	for (let page = startPage; page <= endPage; page++) {
		const pageUrl = `${baseUrl}?page=${page}`
		console.log(`Processing page: ${pageUrl}`)
		const movies = await processMovies(pageUrl)
		allMovies = allMovies.concat(movies)
	}

	// Đường dẫn thư mục muốn lưu file (ở đây là thư mục crawl-live hoặc output)
	const outputDir = path.join(__dirname, 'output') // Có thể thay đổi thành thư mục khác nếu cần

	// Kiểm tra và tạo thư mục nếu chưa tồn tại
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir)
	}

	// Đặt tên cho file Excel
	const fileName = path.join(outputDir, 'movies.xlsx') // Đặt tên và đường dẫn cho file

	// Tạo workbook và worksheet
	const ws = XLSX.utils.json_to_sheet(allMovies)
	const wb = XLSX.utils.book_new()
	XLSX.utils.book_append_sheet(wb, ws, 'Movies')

	// Xuất file Excel vào thư mục đã chỉ định
	XLSX.writeFile(wb, fileName)

	// Trả kết quả về cho renderer
	return { message: `Data fetched and saved as ${fileName}`, fileName: fileName }
})
