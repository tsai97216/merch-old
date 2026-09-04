let currentVersion = 'v2.14.5';

export function getVersion() {
  return currentVersion;
}

export function setVersion(version) {
  currentVersion = version.startsWith('v') ? version : `v${version}`;
  document.documentElement.dataset.version = currentVersion;
  document.querySelectorAll('[data-version]').forEach((element) => {
    element.textContent = currentVersion;
  });
}
