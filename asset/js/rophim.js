// Khai báo các biến toàn cục để lưu trữ dữ liệu
let allNonMatchingUrls = []
let allMatchingUrls = []
let allLatestItems = {}

// Hàm lấy dữ liệu từ URL JSON với phân trang
function fetchJsonData(apiUrl, page, sort, keyword, genres, countries, type, years) {
  let url = apiUrl.trim()

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
    page: page,
    keyword: keyword || '',
  }

  const urlObj = new URL(url)
  const existingParams = new URLSearchParams(urlObj.search)

  Object.entries(defaultParams).forEach(([key, value]) => {
    if (!existingParams.has(key)) {
      existingParams.set(key, value)
    }
  })

  urlObj.search = existingParams.toString()
  url = urlObj.toString()

  return fetch(url).then(response => {
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    console.log('Fetch URL:', url)
    return response.json()
  })
}

// Hàm hiển thị thông báo toast
function showToast(message, type = 'success') {
  const toast = document.createElement('div')
  toast.classList.add('toast')

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

// Hàm trích xuất dữ liệu từ JSON và kiểm tra tên nhập vào
function getUrls(jsonData, nameList) {
  let namesToCheck = nameList.split('\n').map(name => name.trim().toLowerCase())
  let latestItems = {}

  let items = jsonData.result.items || []

  if (!Array.isArray(items)) {
    console.error('Dữ liệu items không hợp lệ:', items)
    showToast('Dữ liệu items không hợp lệ:', 'error')
    return { nonMatchingUrls: [], matchingUrls: [], latestItems: {} }
  }

  items.forEach(item => {
    const itemName = item.title.toLowerCase()
    const itemTime = new Date(item.release_date)

    if (!latestItems[itemName] || itemTime > new Date(latestItems[itemName].release_date)) {
      latestItems[itemName] = item
    }
  })

  let nonMatchingUrls = []
  let matchingUrls = []

  Object.values(latestItems).forEach(item => {
    const title = item.title
    const englishTitle = item.english_title || 'Không có'
    const slug = item.slug
    const id = item._id

    const url = `https://rophim.com/phim/${slug}|${id}|${title}|${englishTitle}`

    if (namesToCheck.includes(title.toLowerCase())) {
      matchingUrls.push({ title, englishTitle, slug, id, url })
    } else {
      nonMatchingUrls.push({ title, englishTitle, slug, id, url })
    }
  })

  return { nonMatchingUrls, matchingUrls, latestItems }
}

// Hàm hiển thị kết quả
function displayUrls() {
  const apiUrl = document.getElementById('apiUrl').value
  const nameList = document.getElementById('nameList').value
  const startPage = parseInt(document.getElementById('startPage').value)
  const endPage = parseInt(document.getElementById('endPage').value)
  const keyword = document.getElementById('keyword').value

  // Lấy giá trị từ các div active
  const sort = document.querySelector('#sort-buttons .filter-btn.active').getAttribute('data-value')
  const genres = document
    .querySelector('#genres-buttons .filter-btn.active')
    .getAttribute('data-value')
  const countries = document
    .querySelector('#countries-buttons .filter-btn.active')
    .getAttribute('data-value')
  const type = document.querySelector('#type-buttons .filter-btn.active').getAttribute('data-value')
  const years = document
    .querySelector('#years-buttons .filter-btn.active')
    .getAttribute('data-value')

  const uniqueNamesCount = document.getElementById('uniqueNamesCount')
  uniqueNamesCount.textContent = 'Đang tải...'

  allNonMatchingUrls = []
  allMatchingUrls = []
  allLatestItems = {}

  function fetchAllPages(currentPage) {
    const totalPages = endPage - startPage + 1
    const progressElement = document.getElementById('loadingProgress')
    const progressWrapper = document.getElementById('progressWrapper')

    progressWrapper.style.display = 'block'

    const currentPageElement = document.getElementById('currentPage')
    const currentPElement = document.getElementById('currentP')

    currentPageElement.classList.add('jump')
    currentPageElement.textContent = currentPage
    currentPElement.textContent = currentPage

    setTimeout(() => {
      currentPageElement.classList.remove('jump')
    }, 300)

    const progressValue = ((endPage - currentPage) / totalPages) * 100
    progressElement.value = progressValue

    if (currentPage < startPage) {
      uniqueNamesCount.textContent = `Số lượng phim hiện tại: ${Object.keys(allLatestItems).length}`
      showToast(`Hoàn thành ${currentPage + 1} Page`)
      updateTableWithMessage(
        'nonMatchingTable',
        allNonMatchingUrls,
        'Không có phim không trùng khớp.'
      )
      updateTableWithMessage('matchingTable', allMatchingUrls, 'Không có phim trùng khớp.')
      return
    }

    fetchJsonData(apiUrl, currentPage, sort, keyword, genres, countries, type, years)
      .then(jsonData => {
        updateCrawlSummary(jsonData)
        const { nonMatchingUrls, matchingUrls, latestItems } = getUrls(jsonData, nameList)
        allNonMatchingUrls = allNonMatchingUrls.concat(nonMatchingUrls)
        allMatchingUrls = allMatchingUrls.concat(matchingUrls)
        Object.assign(allLatestItems, latestItems)

        updateTableWithMessage(
          'nonMatchingTable',
          allNonMatchingUrls,
          'Không có phim không trùng khớp.'
        )
        updateTableWithMessage('matchingTable', allMatchingUrls, 'Không có phim trùng khớp.')

        fetchAllPages(currentPage - 1)
      })
      .catch(error => {
        console.error('Lỗi khi tải JSON:', error)
        showToast('Không thể lấy dữ liệu từ API. Vui lòng kiểm tra URL.', 'error')
      })
  }
  fetchAllPages(endPage)
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
      const sttCell = document.createElement('td')
      const titleCell = document.createElement('td')
      const englishTitleCell = document.createElement('td')
      const slugCell = document.createElement('td')
      const idCell = document.createElement('td')

      sttCell.textContent = index + 1
      titleCell.textContent = item.title
      englishTitleCell.textContent = item.englishTitle
      slugCell.textContent = item.slug
      idCell.textContent = item.id

      row.appendChild(sttCell)
      row.appendChild(titleCell)
      row.appendChild(englishTitleCell)
      row.appendChild(slugCell)
      row.appendChild(idCell)
      tableBody.appendChild(row)
    })
  }
}

// Hàm cập nhật thông tin crawl
function updateCrawlSummary(jsonData) {
  const totalItems = jsonData.result.item_count || 0
  const itemsPerPage = jsonData.result.items.length || 0
  const totalPages = jsonData.result.page_count || 0

  document.getElementById('totalItems').textContent = totalItems
  document.getElementById('itemsPerPage').textContent = itemsPerPage
  document.getElementById('currentP').textContent = jsonData.result.items.length ? 1 : 0
  document.getElementById('totalPages').textContent = totalPages
}

// Hàm sao chép nội dung vào clipboard
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      showToast('Đã sao chép thành công!')
    })
    .catch(err => {
      showToast('Lỗi khi sao chép: ' + err, 'error')
      console.error('Lỗi khi sao chép:', err)
    })
}

// Hàm copy toàn bộ 5 cột (bao gồm tiêu đề và STT)
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

// Gắn sự kiện sau khi DOM tải xong
document.addEventListener('DOMContentLoaded', () => {
  // Hàm xử lý click cho các div filter-btn
  const filterGroups = document.querySelectorAll('.filter-buttons')
  filterGroups.forEach(group => {
    const buttons = group.querySelectorAll('.filter-btn')
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        // Xóa class active khỏi tất cả các div trong cùng nhóm
        buttons.forEach(b => b.classList.remove('active'))
        // Thêm class active cho div được click
        btn.classList.add('active')
      })
    })
  })
  // Lấy các phần tử cần thiết
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

  const getUrlsButton = document.getElementById('getUrlsButton')
  const copyAllNonMatchingButton = document.getElementById('copyAllNonMatchingButton')
  const copyNonMatchingNamesButton = document.getElementById('copyNonMatchingNamesButton')
  const copyNonMatchingEnglishNamesButton = document.getElementById(
    'copyNonMatchingEnglishNamesButton'
  )
  const copyNonMatchingSlugsButton = document.getElementById('copyNonMatchingSlugsButton')
  const copyNonMatchingIdsButton = document.getElementById('copyNonMatchingIdsButton')
  const copyAllMatchingButton = document.getElementById('copyAllMatchingButton')
  const copyMatchingNamesButton = document.getElementById('copyMatchingNamesButton')
  const copyMatchingEnglishNamesButton = document.getElementById('copyMatchingEnglishNamesButton')
  const copyMatchingSlugsButton = document.getElementById('copyMatchingSlugsButton')
  const copyMatchingIdsButton = document.getElementById('copyMatchingIdsButton')

  if (getUrlsButton) getUrlsButton.addEventListener('click', displayUrls)
  if (copyAllNonMatchingButton)
    copyAllNonMatchingButton.addEventListener('click', () =>
      copyAllColumns('nonMatchingTable', false)
    )
  if (copyNonMatchingNamesButton)
    copyNonMatchingNamesButton.addEventListener('click', () => copyNames(false))
  if (copyNonMatchingEnglishNamesButton)
    copyNonMatchingEnglishNamesButton.addEventListener('click', () => copyEnglishNames(false))
  if (copyNonMatchingSlugsButton)
    copyNonMatchingSlugsButton.addEventListener('click', () => copySlugs(false))
  if (copyNonMatchingIdsButton)
    copyNonMatchingIdsButton.addEventListener('click', () => copyIds(false))
  if (copyAllMatchingButton)
    copyAllMatchingButton.addEventListener('click', () => copyAllColumns('matchingTable', true))
  if (copyMatchingNamesButton)
    copyMatchingNamesButton.addEventListener('click', () => copyNames(true))
  if (copyMatchingEnglishNamesButton)
    copyMatchingEnglishNamesButton.addEventListener('click', () => copyEnglishNames(true))
  if (copyMatchingSlugsButton)
    copyMatchingSlugsButton.addEventListener('click', () => copySlugs(true))
  if (copyMatchingIdsButton) copyMatchingIdsButton.addEventListener('click', () => copyIds(true))
})
