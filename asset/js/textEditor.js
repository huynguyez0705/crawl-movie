const inputText = document.getElementById('inputText');
const wordCount = document.getElementById('wordCount');
const charCount = document.getElementById('charCount');
const lineCount = document.getElementById('lineCount');
const spaceCount = document.getElementById('spaceCount');

inputText.addEventListener('input', updateStats);

function updateStats() {
    const text = inputText.value;
    wordCount.textContent = text.trim() ? text.trim().split(/\s+/).length : 0;
    charCount.textContent = text.length;
    lineCount.textContent = text ? text.split('\n').length : 0;
    spaceCount.textContent = (text.match(/\s/g) || []).length;
}

function replaceSpecificSpace() {
    const replaceWith = document.getElementById('replaceSpaceWith').value;
    inputText.value = inputText.value.replace(/\s+/g, replaceWith);
    updateStats();
}

function removeVietnameseAccents() {
    let text = inputText.value;
    const accents = {
        'à': 'a', 'á': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
        'è': 'e', 'é': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
        'ì': 'i', 'í': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
        'ò': 'o', 'ó': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
        'ù': 'u', 'ú': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
        'ỳ': 'y', 'ý': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
        'ă': 'a', 'â': 'a', 'ê': 'e', 'ô': 'o', 'ơ': 'o', 'ư': 'u',
        'đ': 'd'
    };
    text = text.toLowerCase();
    for (let char in accents) {
        text = text.replace(new RegExp(char, 'g'), accents[char]);
    }
    for (let char in accents) {
        text = text.replace(new RegExp(char.toUpperCase(), 'g'), accents[char].toUpperCase());
    }
    inputText.value = text;
    updateStats();
}

function toUpperCase() {
    inputText.value = inputText.value.toUpperCase();
    updateStats();
}

function toLowerCase() {
    inputText.value = inputText.value.toLowerCase();
    updateStats();
}

function toTitleCase() {
    inputText.value = inputText.value.toLowerCase().replace(/(^|\s)\w/g, char => char.toUpperCase());
    updateStats();
}

function copyText() {
    inputText.select();
    document.execCommand('copy');
}

function resetText() {
    inputText.value = '';
    updateStats();
}

function findAndReplace() {
    const findText = document.getElementById('findText').value;
    const replaceText = document.getElementById('replaceText').value;
    inputText.value = inputText.value.split(findText).join(replaceText);
    updateStats();
}