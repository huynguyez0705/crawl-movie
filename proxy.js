const express = require('express')
const fetch = require('node-fetch')
const app = express()

// Thêm CORS
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', '*') // Cho phép tất cả origin
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
	res.header('Access-Control-Allow-Headers', 'Content-Type')
	next()
})

app.use(express.json())

app.get('/proxy', async (req, res) => {
	try {
		const apiUrl = `https://api.rophim.me/v1/movie/filterV2${req.url.split('/proxy')[1]}`
		console.log('Proxy fetching:', apiUrl)
		const response = await fetch(apiUrl)
		if (!response.ok) {
			throw new Error(`API error! Status: ${response.status}`)
		}
		const data = await response.json()
		res.json(data)
	} catch (error) {
		console.error('Proxy error:', error.message)
		res.status(500).send(`Proxy error: ${error.message}`)
	}
})

app.listen(3000, () => console.log('Proxy server running on http://localhost:3000'))
