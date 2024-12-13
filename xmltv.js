document.addEventListener('DOMContentLoaded', () => {
    const xmltvList = document.getElementById('xmltvList');
    const themeToggle = document.getElementById('themeToggle');

    // Configuración del tema
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Actualizar el icono del botón
        const icon = themeToggle.querySelector('i');
        if (theme === 'light') {
            icon.style.color = '#ffd700';
        } else {
            icon.style.color = '#ffffff';
        }
    }

    // Cargar tema guardado o usar el predeterminado
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Alternar tema
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });

    // Función para copiar texto al portapapeles
    async function copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Cambiar el texto del botón temporalmente
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copiado';
            
            // Restaurar el texto original después de 2 segundos
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        } catch (err) {
            console.error('Error al copiar:', err);
            button.innerHTML = '<i class="fas fa-times"></i> Error';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 2000);
        }
    }

    // Función para crear un elemento XML en la lista
    function createXMLElement(file) {
        const item = document.createElement('div');
        item.className = 'xmltv-item';
        
        // Obtener el nombre sin la extensión .xml
        const name = file.name.replace(/\.xml$/i, '');
        
        item.innerHTML = `
            <div class="xmltv-name">${name}</div>
            <div class="xmltv-url">${file.download_url}</div>
            <button class="copy-button">
                <i class="fas fa-copy"></i> Copiar URL
            </button>
        `;
        
        // Añadir evento al botón de copiar
        const copyButton = item.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            copyToClipboard(file.download_url, copyButton);
        });
        
        return item;
    }

    // Función para cargar los datos de GitHub
    async function loadXMLTVSources() {
        try {
            // Limpiar la lista
            xmltvList.innerHTML = '';

            // Primero cargar el XML de all_in_one
            const allInOneResponse = await fetch('https://api.github.com/repos/migpaniag/EPGS/contents/all_in_one');
            if (!allInOneResponse.ok) {
                throw new Error(`HTTP error! status: ${allInOneResponse.status}`);
            }
            
            const allInOneData = await allInOneResponse.json();
            const allInOneFiles = Array.isArray(allInOneData) ? allInOneData : [allInOneData];
            
            // Filtrar y añadir archivos XML de all_in_one
            allInOneFiles
                .filter(file => file.name.toLowerCase().endsWith('.xml'))
                .forEach(file => {
                    xmltvList.appendChild(createXMLElement(file));
                });

            // Luego cargar los XML de channels
            const channelsResponse = await fetch('https://api.github.com/repos/migpaniag/EPGS/contents/channels');
            if (!channelsResponse.ok) {
                throw new Error(`HTTP error! status: ${channelsResponse.status}`);
            }
            
            const channelsData = await channelsResponse.json();
            
            // Filtrar y añadir archivos XML de channels
            channelsData
                .filter(file => file.name.toLowerCase().endsWith('.xml'))
                .forEach(file => {
                    xmltvList.appendChild(createXMLElement(file));
                });

        } catch (error) {
            console.error('Error al cargar los datos:', error);
            xmltvList.innerHTML = `<p style="color: var(--text-primary); text-align: center;">Error al cargar las fuentes: ${error.message}</p>`;
        }
    }

    // Cargar los datos
    loadXMLTVSources();
});
