let currentVersion = 'v2.19.9';

export function getVersion() {
  return currentVersion;
}

export function setVersion(version) {
  currentVersion = String(version).startsWith('v') ? String(version) : `v${version}`;
  document.documentElement.dataset.version = currentVersion;
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = currentVersion;
  });
}
