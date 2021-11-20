let contextMenuId
let showIgnoredPosts

chrome.storage.local.get((config) => {
  showIgnoredPosts = config.showIgnoredPosts || false
  contextMenuId = chrome.contextMenus.create({
    type: 'checkbox',
    title: 'Show ignored posts',
    checked: showIgnoredPosts,
    onclick: () => {
      chrome.storage.local.set({showIgnoredPosts: !showIgnoredPosts})
    },
    documentUrlPatterns: [
      'https://www.cookdandbombd.co.uk/forums/index.php?topic*',
      'https://www.cookdandbombd.co.uk/forums/index.php?action=post*'
    ],
  })

  chrome.storage.onChanged.addListener((changes) => {
    if ('showIgnoredPosts' in changes) {
      showIgnoredPosts = changes['showIgnoredPosts'].newValue
      chrome.contextMenus.update(contextMenuId, {
        checked: showIgnoredPosts,
      })
    }
  })
})
