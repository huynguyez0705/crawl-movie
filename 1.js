async function crawlMovies() {
	try {
		const response = await fetch(
			'https://api.rophim.me/v1/movie/filterV2?countries=&genres=&years=&type=&status=&exclude_status=Upcoming&versions=&rating=&networks=&productions=&sort=release_date&page=2&keyword='
		)
		const data = await response.json()

		if (data.status && data.result && data.result.items) {
			console.log('Danh sách phim:')
			data.result.items.forEach(movie => {
				console.log({
					title: movie.title || 'N/A',
					english_title: movie.english_title || 'N/A',
					release_date: movie.release_date || 'N/A',
					rating: movie.rating || 'N/A',
					imdb_rating: movie.imdb_rating || 'N/A',
					genres: movie.genres ? movie.genres.map(g => g.name).join(', ') : 'N/A',
					origin_country: movie.origin_country ? movie.origin_country.join(', ') : 'N/A',
					status: movie.status || 'N/A',
					runtime: movie.runtime ? `${movie.runtime} phút` : 'N/A',
					latest_episode: movie.latest_episode ? `Mùa ${movie.latest_season}, Tập ${movie.latest_episode[1]}` : 'N/A',
					overview: movie.overview ? movie.overview.slice(0, 100) + '...' : 'N/A',
					poster: movie.images.posters[0]?.path || 'N/A'
				})
			})
		} else {
			console.log('Không tìm thấy dữ liệu hoặc API trả về lỗi')
		}
	} catch (error) {
		console.error('Lỗi khi crawl dữ liệu:', error)
	}
}

// Gọi hàm để thực thi
crawlMovies()
