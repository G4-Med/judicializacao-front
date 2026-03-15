export function setTheme(theme: 'light' | 'dark') {
  const themeId = 'app-theme'
  const existing = document.getElementById(themeId)

  const themeFile =
    theme === 'dark'
      ? 'lara-dark-blue'
      : 'lara-light-blue'

  if (existing) {
    existing.setAttribute(
      'href',
      `https://unpkg.com/primereact/resources/themes/${themeFile}/theme.css`
    )
  } else {
    const link = document.createElement('link')
    link.id = themeId
    link.rel = 'stylesheet'
    link.href = `https://unpkg.com/primereact/resources/themes/${themeFile}/theme.css`

    document.head.appendChild(link)
  }

  localStorage.setItem('theme', theme)
}