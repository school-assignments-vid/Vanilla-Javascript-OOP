(async function() {
    // --- UI Elements ---
    const editorEl = container.querySelector('#monaco-container');
    const welcomeEl = container.querySelector('#welcome-container');
    const fileListEl = container.querySelector('#file-list');
    const tabsContainer = container.querySelector('#tabs-container');
    const langDisplay = container.querySelector('#lang-display');
    const activeFilenameDisplay = container.querySelector('#active-filename-display');
    const sidebar = container.querySelector('#sidebar');
    
    // Buttons
    const downloadBtn = container.querySelector('#download-btn');
    const downloadZipBtn = container.querySelector('#download-zip-btn');
    const newFileBtn = container.querySelector('#new-file-btn');
    const welcomeNewFileBtn = container.querySelector('#welcome-new-file');
    const copyBtn = container.querySelector('#copy-btn');

    // --- Config ---
    const MONACO_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs';
    const JSZIP_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min';

    // --- State ---
    const WELCOME_ID = 'Welcome';

    let files = {
        'main.ts': {
            name: 'main.ts',
            language: 'typescript',
            content: '// Welcome to ZenOS Text Editor\nconsole.log("Hello World");'
        }
    };
    
    let openTabs = [WELCOME_ID];
    let activeTabId = WELCOME_ID;
    let selectedFileId = null;
    let isRenaming = false;

    // --- Icons & Extensions ---
    const extData = {
        'ts':  { lang: 'typescript', class: 'icon-ts', icon: '<path d="M1.5 0h13a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13a1.5 1.5 0 0 1-1.5-1.5v-13a1.5 1.5 0 0 1 1.5-1.5zm6.75 12v-1.125h-1.125v-3.75h1.125v-1.125h-3.375v1.125h1.125v3.75h-1.125v1.125zm5.063 0a2.25 2.25 0 0 1-2.25-2.25h1.125a1.125 1.125 0 0 0 1.125 1.125 1.125 1.125 0 0 0 1.125-1.125c0-.621-.504-1.125-1.125-1.125h-.563v-1.125h.563c.621 0 1.125-.504 1.125-1.125a1.125 1.125 0 0 0-1.125-1.125 1.125 1.125 0 0 0-1.125 1.125h-1.125a2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25c0 .59-.221 1.127-.584 1.536.363.41.584.947.584 1.536a2.25 2.25 0 0 1-2.25 2.25z"/>' },
        'js':  { lang: 'javascript', class: 'icon-js', icon: '<path d="M1.5 0h13a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5h-13a1.5 1.5 0 0 1-1.5-1.5v-13a1.5 1.5 0 0 1 1.5-1.5zm6.75 12v-1.125h-1.125v-3.75h1.125v-1.125h-3.375v1.125h1.125v3.75h-1.125v1.125zm4.875 0a2.25 2.25 0 0 1-2.25-2.25h1.125a1.125 1.125 0 0 0 1.125 1.125 1.125 1.125 0 0 0 1.125-1.125c0-.621-.504-1.125-1.125-1.125h-.563v-1.125h.563c.621 0 1.125-.504 1.125-1.125a1.125 1.125 0 0 0-1.125-1.125 1.125 1.125 0 0 0-1.125 1.125h-1.125a2.25 2.25 0 0 1 2.25-2.25 2.25 2.25 0 0 1 2.25 2.25c0 .59-.221 1.127-.584 1.536.363.41.584.947.584 1.536a2.25 2.25 0 0 1-2.25 2.25z"/>' },
        'html': { lang: 'html', class: 'icon-html', icon: '<path d="M1.5 0h13l-1.5 13.5-5 1.5-5-1.5zm2.5 3v2h5.5l-.5 4h-4v2l5.5 1.5 1.5-10.5z"/>' },
        'css': { lang: 'css', class: 'icon-css', icon: '<path d="M1.5 0h13l-1.5 13.5-5 1.5-5-1.5zm2.5 3v2h5.5l-.5 4h-4v2l5.5 1.5 1.5-10.5z"/>' },
        'json': { lang: 'json', class: 'icon-json', icon: '<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 12v-1.5h-1v1.5H6v-2h3v2h-1.5zm2-3.5h-5v-1h5v1zm0-3.5h-5v-1h5v1z"/>' },
        'md':  { lang: 'markdown', class: 'icon-md', icon: '<path d="M14.5 2H1.5A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2zM4 11H2V5h2v6zm2-4V5h2v2h2V5h2v2h-1v4h-2V7H8v4H6V7z"/>' },
        'default': { lang: 'plaintext', class: 'icon-default', icon: '<path d="M9 1H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5l-6-4zm-1 5V2.5L11.5 6H8z"/>' },
        'welcome': { lang: 'markdown', class: 'icon-welcome', icon: '<path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm1 12H7V7h2v5zm0-7H7V3h2v2z"/>' }
    };

    function getFileInfo(filename) {
        if (filename === WELCOME_ID) return extData['welcome'];
        if (!filename.includes('.')) return extData['default'];
        const ext = filename.split('.').pop().toLowerCase();
        return extData[ext] || extData['default'];
    }

    function loadLoader() {
        return new Promise((resolve, reject) => {
            if (window.require) return resolve();
            const script = document.createElement('script');
            script.src = `${MONACO_CDN}/loader.js`;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    try {
        await loadLoader();
        require.config({ paths: { 'vs': MONACO_CDN, 'jszip': JSZIP_PATH } });

        require(['vs/editor/editor.main', 'jszip'], function(monaco, JSZip) {
            
            // --- Editor Setup ---
            function getMonacoTheme() {
                const sysTheme = registry.get("theme.mode");
                return sysTheme === 'light' ? 'vs' : 'vs-dark';
            }

            const editor = monaco.editor.create(editorEl, {
                value: '',
                language: 'plaintext',
                theme: getMonacoTheme(),
                automaticLayout: false,
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: '"Cascadia Code", "Consolas", monospace',
                scrollBeyondLastLine: false
            });

            new ResizeObserver(() => editor.layout()).observe(editorEl);

            registry.subscribe("theme.mode", () => {
                monaco.editor.setTheme(getMonacoTheme());
            });

            // --- State Management ---
            function saveActiveFileState() {
                if (activeTabId !== WELCOME_ID && files[activeTabId]) {
                    files[activeTabId].content = editor.getValue();
                }
            }

            function openTab(id) {
                if (isRenaming) return;
                
                saveActiveFileState();
                
                if (!openTabs.includes(id)) {
                    openTabs.push(id);
                }
                
                activeTabId = id;

                // View Switching Logic
                if (id === WELCOME_ID) {
                    editorEl.style.display = 'none';
                    welcomeEl.classList.remove('hidden');
                    langDisplay.textContent = '';
                } else {
                    welcomeEl.classList.add('hidden');
                    editorEl.style.display = 'block';
                    
                    const f = files[id];
                    if (f) {
                        const model = editor.getModel();
                        monaco.editor.setModelLanguage(model, f.language);
                        editor.setValue(f.content);
                        langDisplay.textContent = f.language;
                        
                        // Also select in sidebar
                        selectedFileId = id;
                    }
                }

                renderAll();
                
                if (id !== WELCOME_ID) {
                    editor.layout();
                }
            }

            function selectFile(fileId) {
                if (isRenaming) return;
                selectedFileId = fileId;
                renderSidebar();
                sidebar.focus();
            }

            function startRename(fileId) {
                if (!files[fileId]) return;
                isRenaming = true;
                selectedFileId = fileId;
                renderSidebar();
            }

            function commitRename(oldName, newName) {
                isRenaming = false;
                if (!newName || newName === oldName || files[newName]) {
                    renderSidebar();
                    return;
                }

                const info = getFileInfo(newName);
                files[newName] = {
                    name: newName,
                    language: info.lang,
                    content: files[oldName].content
                };

                const idx = openTabs.indexOf(oldName);
                if (idx !== -1) openTabs[idx] = newName;

                if (activeTabId === oldName) {
                    activeTabId = newName;
                    const model = editor.getModel();
                    monaco.editor.setModelLanguage(model, info.lang);
                    langDisplay.textContent = info.lang;
                }
                
                if (selectedFileId === oldName) selectedFileId = newName;

                delete files[oldName];
                renderAll();
            }

            function createNewFile() {
                let counter = 1;
                while (files[`NewFile${counter}.txt`]) counter++;
                const name = `NewFile${counter}.txt`;

                files[name] = {
                    name: name,
                    language: 'plaintext',
                    content: ''
                };
                
                if (activeTabId === WELCOME_ID) {
                    openTab(name);
                }
                
                startRename(name);
            }

            // --- Renderers ---
            function renderAll() {
                renderSidebar();
                renderTabs();
                renderToolbar();
            }

            function renderToolbar() {
                activeFilenameDisplay.textContent = activeTabId || 'No File Open';
                
                // Fix: Check if activeTabId corresponds to a real file before accessing properties
                if (activeTabId && files[activeTabId]) {
                    langDisplay.textContent = files[activeTabId].language;
                } else {
                    langDisplay.textContent = '';
                }
            }

            function renderTabs() {
                tabsContainer.innerHTML = '';
                openTabs.forEach(id => {
                    const isActive = id === activeTabId;
                    const el = document.createElement('div');
                    el.className = `tab ${isActive ? 'active' : ''}`;
                    
                    const info = getFileInfo(id);
                    const iconSvg = `<svg viewBox="0 0 16 16" class="file-icon ${info.class}" style="margin-right:6px;">${info.icon}</svg>`;
                    
                    el.innerHTML = `
                        ${iconSvg}
                        <span class="tab-name">${id}</span>
                        <div class="tab-close">×</div>
                    `;

                    el.addEventListener('click', () => openTab(id));
                    
                    el.querySelector('.tab-close').addEventListener('click', (e) => {
                        e.stopPropagation();
                        const idx = openTabs.indexOf(id);
                        openTabs.splice(idx, 1);
                        
                        if (id === activeTabId) {
                            if (openTabs.length > 0) openTab(openTabs[openTabs.length - 1]);
                            else openTab(WELCOME_ID);
                        } else {
                            renderAll();
                        }
                    });

                    tabsContainer.appendChild(el);
                });
            }

            function renderSidebar() {
                fileListEl.innerHTML = '';
                const fileNames = Object.keys(files).sort((a, b) => {
                    if (a === WELCOME_ID) return -1;
                    if (b === WELCOME_ID) return 1;
                    return a.localeCompare(b);
                });

                fileNames.forEach(fid => {
                    const isSelected = fid === selectedFileId;
                    const el = document.createElement('div');
                    el.className = `file-item ${isSelected ? 'selected' : ''}`;
                    
                    const info = getFileInfo(fid);
                    const iconHtml = `<svg class="file-icon ${info.class}" viewBox="0 0 16 16">${info.icon}</svg>`;

                    if (isRenaming && isSelected) {
                        el.innerHTML = `${iconHtml}<input type="text" class="rename-input" value="${fid}">`;
                        fileListEl.appendChild(el);
                        
                        const input = el.querySelector('input');
                        input.focus();
                        input.select();
                        
                        const finish = () => commitRename(fid, input.value);
                        input.addEventListener('keydown', (e) => {
                            if (e.key === 'Enter') finish();
                            if (e.key === 'Escape') { isRenaming = false; renderSidebar(); }
                            e.stopPropagation(); 
                        });
                        input.addEventListener('blur', finish);
                        input.addEventListener('click', e => e.stopPropagation());
                        input.addEventListener('dblclick', e => e.stopPropagation());

                    } else {
                        el.innerHTML = `${iconHtml}<span>${fid}</span>`;
                        el.addEventListener('click', () => selectFile(fid));
                        el.addEventListener('dblclick', () => openTab(fid));
                        fileListEl.appendChild(el);
                    }
                });
            }

            // --- Events ---
            sidebar.addEventListener('keydown', (e) => {
                if (e.key === 'F2') {
                    if (selectedFileId && !isRenaming) {
                        startRename(selectedFileId);
                    }
                }
            });

            newFileBtn.addEventListener('click', createNewFile);
            welcomeNewFileBtn.addEventListener('click', createNewFile);
            
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(editor.getValue());
                    copyBtn.style.color = 'var(--zen-success)';
                    setTimeout(() => copyBtn.style.color = '', 1000);
                } catch(e) {}
            });
            
            downloadBtn.addEventListener('click', () => {
                if (activeTabId === WELCOME_ID) return;
                saveActiveFileState();
                const f = files[activeTabId];
                if (!f) return;
                
                const blob = new Blob([f.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = activeTabId;
                a.click();
                URL.revokeObjectURL(url);
            });

            downloadZipBtn.addEventListener('click', async () => {
                saveActiveFileState();
                const zip = new JSZip();
                Object.values(files).forEach(f => zip.file(f.name, f.content));
                const blob = await zip.generateAsync({type:"blob"});
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "project.zip";
                a.click();
                URL.revokeObjectURL(url);
            });

            // --- Startup ---
            // Trigger the openTab logic to ensure the correct view (Welcome) is shown
            openTab(WELCOME_ID);
        });

    } catch (e) { console.error(e); }
})();