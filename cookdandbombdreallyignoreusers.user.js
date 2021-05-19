// ==UserScript==
// @name        Cook'd and Bomb'd Really Ignore Users
// @description Really ignores ignored users
// @namespace   https://github.com/insin/greasemonkey/
// @version     2
// @match       https://www.cookdandbombd.co.uk/forums/index.php/board*
// @match       https://www.cookdandbombd.co.uk/forums/index.php/topic*
// @match       https://www.cookdandbombd.co.uk/forums/index.php?action=post*
// @match       https://www.cookdandbombd.co.uk/forums/index.php?action=profile;area=lists;sa=ignore*
// @match       https://www.cookdandbombd.co.uk/forums/index.php?action=unread*
// @grant       GM.registerMenuCommand
// ==/UserScript==

const IGNORED_USERS_STORAGE = 'cab_ignoredUsers'

let config = {
  addIgnoreUserControlToPosts: true,
  hidePostsQuotingIgnoredUsers: true,
  hideTopicsCreatedByIgnoredUsers: true,
  showIgnoredPosts: false,
}

let posts = []

function addStyle(css) {
  let $style = document.createElement('style')
  $style.appendChild(document.createTextNode(css))
  document.head.appendChild($style)
}

function addIgnoredPostsStyle() {
  addStyle(`
    .cab_ignoredPost {
      display: none;
    }
    .cab_ignoredPost.cab_show {
      display: block;
    }
    .cab_ignoredPost.cab_show {
      background-color: #fdd !important;
    }
    .cab_ignoredPost.cab_show {
      background-color: #fdd !important;
      border-radius: 0.7em;
    }
    .cab_ignoredPost.cab_show span.topslice,
		.cab_ignoredPost.cab_show span.topslice span,
    .cab_ignoredPost.cab_show span.botslice,
		.cab_ignoredPost.cab_show span.botslice span {
      background-image: none !important;
		}
  `)
}

function getIgnoredUsers() {
  return JSON.parse(localStorage[IGNORED_USERS_STORAGE] || '[]')
}

function storeIgnoredUsers(ignoredUsers) {
  localStorage[IGNORED_USERS_STORAGE] = JSON.stringify(ignoredUsers)
}

function toggleShowIgnoredPosts(showIgnoredPosts) {
  config.showIgnoredPosts = showIgnoredPosts
  posts.forEach(post => post.updateClassNames())
}

function TopicPage() {
  addIgnoredPostsStyle()

  let isLoggedIn = document.querySelector('#guest_form') == null

  let ignoredUsers
  let ignoredUserIds
  let ignoredUserNames

  function setIgnoredUsers(ignoreList) {
    ignoredUsers = ignoreList
    ignoredUserIds = ignoredUsers.map(user => user.id)
    ignoredUserNames = ignoredUsers.map(user => user.name)
  }

  function configureIgnoreControl({$a, $img, userId, userName}) {
    let isUserIgnored = ignoredUserIds.includes(userId)
    $a.href = `https://www.cookdandbombd.co.uk/forums/index.php?action=profile;area=lists;sa=ignore&${isUserIgnored ? `unignore=${userId}` : `ignore=${userName}`}`
    $a.title = `${isUserIgnored ? 'Remove from' : 'Add to'} ignore list`
    $img.alt = `${isUserIgnored ? 'Remove from' : 'Add to'} ignore list`
    $img.src = `/forums/Themes/default/images/buttons/${isUserIgnored ? 'close' : 'ignore'}.gif`
  }

  function Post($wrapper) {
    let $userLink = $wrapper.querySelector('div.poster h4 a')

    let userId = $userLink.href.match(/;u=(\d+)/)[1]
    let userName = $userLink.textContent
    let quotedUserNames = Array.from($wrapper.querySelectorAll('div.topslice_quote a')).map($a => $a.textContent.match(/Quote from: (.+) on /)[1])

    let api = {
      updateClassNames() {
        let isUserIgnored = ignoredUserIds.includes(userId)
        let quotesIgnoredUser = config.hidePostsQuotingIgnoredUsers && quotedUserNames.some(userName => ignoredUserNames.includes(userName))
        let isPostIgnored = isUserIgnored || quotesIgnoredUser
        $wrapper.parentElement.classList.toggle('cab_ignoredPost', isPostIgnored)
        $wrapper.parentElement.classList.toggle('cab_show', config.showIgnoredPosts && isPostIgnored)
      }
    }

    // Add an ignore/unignore link to user profiles in posts
    if (config.addIgnoreUserControlToPosts) {
      let $a = document.createElement('a')
      let $img = document.createElement('img')
      $a.appendChild($img)
      let $li = document.createElement('li')
      $li.appendChild($a)
      configureIgnoreControl({$a, $img, userId, userName})
      $wrapper.querySelector('div.poster li.profile ul').appendChild($li)

      // For logged-out users, manage the ignore list independently
      if (!isLoggedIn) {
        console.log('not logged in')
        $a.addEventListener('click', (e) => {
          console.log('clicked')
          e.preventDefault()
          // Get a fresh copy in case it's been changed in another tab
          let ignoredUsers = getIgnoredUsers()
          let index = ignoredUsers.findIndex(user => user.id === userId)
          if (index != -1) {
            ignoredUsers.splice(index, 1)
          }
          else {
            ignoredUsers.push({id: userId, name: userName})
          }
          setIgnoredUsers(ignoredUsers)
          storeIgnoredUsers(ignoredUsers)
          configureIgnoreControl({$a, $img, userId, userName})
          posts.forEach(post => post.updateClassNames())
        })
      }
    }

    api.updateClassNames()
    return api
  }

  setIgnoredUsers(getIgnoredUsers())
  posts = Array.from(document.querySelectorAll('div.post_wrapper')).map($wrapper => Post($wrapper))
  document.body.classList.add('cab_reallyIgnoreUsers')
}

function PostPage() {
  addIgnoredPostsStyle()

  let ignoredUserNames = getIgnoredUsers().map(user => user.name)

  function Post($wrapper) {
    let $userHeader = $wrapper.querySelector('h5')

    let userName = $userHeader.textContent.match(/Posted by: (.+)/)[1]
    let isUserIgnored = ignoredUserNames.includes(userName)
    let quotedUserNames = Array.from($wrapper.querySelectorAll('div.topslice_quote a')).map($a => $a.textContent.match(/Quote from: (.+) on /)[1])
    let quotesIgnoredUser = config.hidePostsQuotingIgnoredUsers && quotedUserNames.some(userName => ignoredUserNames.includes(userName))
    let isPostIgnored = isUserIgnored || quotesIgnoredUser

    let api = {
      updateClassNames() {
        $wrapper.classList.toggle('cab_ignoredPost', isPostIgnored)
        $wrapper.classList.toggle('cab_show', config.showIgnoredPosts && isPostIgnored)
      }
    }

    api.updateClassNames()
    return api
  }

  posts = Array.from(document.querySelectorAll('div.core_posts')).map($wrapper => Post($wrapper))
  document.body.classList.add('cab_reallyIgnoreUsers')
}

function IgnoreListPage() {
  let params = new URLSearchParams(location.search)

  // Automatically ignore a user if ignore=name is provided in the URL
  if (params.has('ignore')) {
    let $newIgnoreInput = document.querySelector('#new_ignore')
    $newIgnoreInput.value = params.get('ignore')
    $newIgnoreInput.form.submit()
    return
  }

  // Automatically unignore a user if unignore=id is provided in the URL
  if (params.has('unignore')) {
    let $removeLink = Array.from((document.querySelectorAll('.table_grid tr td:last-child a'))).find(a => a.href.includes(`remove=${params.get('unignore')}`))
    if ($removeLink) {
      $removeLink.click()
      return
    }
  }

  // Otherwise sync with the ignore list
  let ignoredUsers = Array.from(document.querySelectorAll('.table_grid tr td:first-child a')).map($a => ({
    id: $a.href.match(/;u=(\d+)/)[1],
    name: $a.textContent,
  }))
  storeIgnoredUsers(ignoredUsers)
}

function ForumPage() {
  addStyle(`
    .cab_ignoredUser {
      display: none;
    }
  `)

  let ignoredUserIds = getIgnoredUsers().map(user => user.id)

  for (let $topicRow of document.querySelectorAll('#main_content_section .table_grid tbody tr')) {
    let $userLink = $topicRow.querySelector('td.subject p a')
    let userId = $userLink?.href.match(/;u=(\d+)/)?.[1]
    if (ignoredUserIds.includes(userId)) {
      $topicRow.classList.add('cab_ignoredUser')
    }
  }
}

if (location.search.includes('?action=profile;area=lists;sa=ignore')) {
  IgnoreListPage()
}
else if (location.search.includes('?action=unread') || location.pathname.includes('index.php/board')) {
  if (config.hideTopicsCreatedByIgnoredUsers) {
    ForumPage()
  }
}
else if (!document.body.classList.contains('cab_reallyIgnoreUsers')) {
  let page = location.search.includes('?action=post') ? PostPage : TopicPage
  if (typeof GM != 'undefined') {
    page()
    GM.registerMenuCommand('Toggle ignored post display', () => {
      toggleShowIgnoredPosts(!config.showIgnoredPosts)
    })
  }
  else {
    chrome.storage.local.get((storedConfig) => {
      Object.assign(config, storedConfig)
      page()
    })
    chrome.storage.onChanged.addListener((changes) => {
      if ('showIgnoredPosts' in changes) {
        toggleShowIgnoredPosts(changes['showIgnoredPosts'].newValue)
      }
    })
  }
}