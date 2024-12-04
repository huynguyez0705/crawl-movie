const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
	fetchData: (baseUrl, startPage, endPage) => ipcRenderer.invoke('fetch-data', baseUrl, startPage, endPage)
})
