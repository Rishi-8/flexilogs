export function ThemeScript() {
  const code = `
    try {
      var s = localStorage.getItem('flexilog:theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var dark = s ? s === 'dark' : prefersDark;
      if (dark) document.documentElement.classList.add('dark');
    } catch (e) {}
  `;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
