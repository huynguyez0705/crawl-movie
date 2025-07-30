const inputText = document.getElementById('inputText')
const wordCount = document.getElementById('wordCount')
const charCount = document.getElementById('charCount')
const lineCount = document.getElementById('lineCount')
const spaceCount = document.getElementById('spaceCount')

inputText.addEventListener('input', updateStats)

function updateStats() {
	const text = inputText.value
	wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0
	charCount.textContent = text.length
	lineCount.textContent = text ? text.split('\n').length : 0
	spaceCount.textContent = (text.match(/\s/g) || []).length
}

function replaceSpecificSpace() {
	const replaceWith = document.getElementById('replaceSpaceWith').value
	inputText.value = inputText.value.replace(/\s+/g, replaceWith)
	updateStats()
}

function removeVietnameseAccents() {
	let text = inputText.value
	const accents = {
		ạ: 'a',
		á: 'a',
		à: 'a',
		ả: 'a',
		ã: 'a',
		ă: 'a',
		ắ: 'a',
		ằ: 'a',
		ẳ: 'a',
		ẵ: 'a',
		â: 'a',
		ấ: 'a',
		ầ: 'a',
		ẩ: 'a',
		ẫ: 'a',
		é: 'e',
		è: 'e',
		ẻ: 'e',
		ẽ: 'e',
		ê: 'e',
		ề: 'e',
		ể: 'e',
		ễ: 'e',
		ế: 'e',
		í: 'i',
		ì: 'i',
		ỉ: 'i',
		ĩ: 'i',
		ó: 'o',
		ò: 'o',
		ỏ: 'o',
		õ: 'o',
		ô: 'o',
		ố: 'o',
		ồ: 'o',
		ổ: 'o',
		ỗ: 'o',
		ơ: 'o',
		ớ: 'o',
		ờ: 'o',
		ở: 'o',
		ỡ: 'o',
		ú: 'u',
		ù: 'u',
		ủ: 'u',
		ũ: 'u',
		ư: 'u',
		ứ: 'u',
		ừ: 'u',
		ử: 'u',
		ữ: 'u',
		ý: 'y',
		ỳ: 'y',
		ị: 'i',
		ỹ: 'y',
		đ: 'd',
		ỷ: 'y',
		ệ: 'e',
		ự: 'u',
		ặ: 'a'
	}
	text = text.toLowerCase()
	for (let char in accents) {
		text = text.replace(new RegExp(char, 'g'), accents[char])
	}
	for (let char in accents) {
		text = text.replace(new RegExp(char.toUpperCase(), 'g'), accents[char].toUpperCase())
	}
	inputText.value = text
	updateStats()
}

function toUpperCase() {
	inputText.value = inputText.value.toUpperCase()
	updateStats()
}

function toLowerCase() {
	inputText.value = inputText.value.toLowerCase()
	updateStats()
}

function toTitleCase() {
	inputText.value = inputText.value.toLowerCase().replace(/(^|\s)\w/g, char => char.toUpperCase())
	updateStats()
}

function copyText() {
	inputText.select()
	document.execCommand('copy')
}

function resetText() {
	inputText.value = ''
	updateStats()
}

function findAndReplace() {
	const findText = document.getElementById('findText').value
	const replaceText = document.getElementById('replaceText').value
	inputText.value = inputText.value.split(findText).join(replaceText)
	updateStats()
}
