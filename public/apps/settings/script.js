// Window.ts executes this script with 'container' and 'registry' arguments available in scope.

if (!container || !registry) {
    console.error("Settings App: Missing container or registry reference.");
    return;
}

const themeSelect = container.querySelector('#theme-select');
const wallpaperInput = container.querySelector('#wallpaper-input');
const saveBtn = container.querySelector('#save-wallpaper');

// --- Populate Values from Registry ---
const mappings = {
    '#sys-name': 'system.os.name',
    '#sys-ver': 'system.os.version',
    '#sys-build': 'system.os.build',
    '#sys-cpu': 'hardware.cpu',
    '#sys-ram': 'hardware.ram',
    '#sys-host': 'network.hostname'
};

Object.entries(mappings).forEach(([selector, regKey]) => {
    const el = container.querySelector(selector);
    if (el) el.textContent = registry.get(regKey) || 'Unknown';
});

const currentTheme = registry.get('theme.mode') || 'dark';
const currentWallpaper = registry.get('desktop.wallpaper') || '';

if (themeSelect) themeSelect.value = currentTheme;
if (wallpaperInput) wallpaperInput.value = currentWallpaper;

// --- Event Listeners ---

if (themeSelect) {
    themeSelect.addEventListener('change', (e) => {
        const mode = e.target.value;
        registry.set('theme.mode', mode);
        
        if (mode === 'light') {
            document.body.classList.add('light');
        } else {
            document.body.classList.remove('light');
        }
    });
}

if (saveBtn && wallpaperInput) {
    saveBtn.addEventListener('click', () => {
        const val = wallpaperInput.value.trim();
        if (val) {
            registry.set('desktop.wallpaper', val);
        }
    });
}

// Subscribe to changes (e.g. if changed via terminal)
// Using a simple check to avoid overwriting user input while typing
registry.subscribe('desktop.wallpaper', (val) => {
    if (wallpaperInput && document.activeElement !== wallpaperInput) {
        wallpaperInput.value = val;
    }
});