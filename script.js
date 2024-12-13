document.addEventListener('DOMContentLoaded', () => {
    const channelsList = document.querySelector('.channels-list');
    const programsContainer = document.querySelector('.programs-container');
    const currentDateElement = document.getElementById('currentDate');
    const timeSlots = document.querySelector('.time-slots');
    const modal = document.getElementById('programModal');
    const themeToggle = document.getElementById('themeToggle');
    let currentDate = new Date();

    // Configuración del tema
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        // Actualizar el icono del botón
        const icon = themeToggle.querySelector('i');
        if (theme === 'light') {
            icon.style.color = '#ffd700'; // Color dorado para modo claro
        } else {
            icon.style.color = '#ffffff'; // Color blanco para modo oscuro
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

    // Generar las franjas horarias del día
    function generateTimeSlots() {
        timeSlots.innerHTML = '';
        for (let hour = 0; hour < 24; hour++) {
            for (let minutes = 0; minutes < 60; minutes += 30) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                timeSlots.appendChild(timeSlot);
            }
        }
    }

    // Formatear y mostrar la fecha actual
    function updateDateDisplay() {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = currentDate.toLocaleDateString('es-ES', options)
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    // Función para parsear el formato de fecha del XML (YYYYMMDDHHMMSS)
    function parseXMLDate(dateString) {
        if (!dateString) return null;
        const year = dateString.substring(0, 4);
        const month = dateString.substring(4, 6);
        const day = dateString.substring(6, 8);
        const hour = dateString.substring(8, 10);
        const minute = dateString.substring(10, 12);
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    }

    // Calcular la posición horizontal y el ancho del programa
    function calculateProgramPosition(startTime, endTime) {
        const dayStart = new Date(startTime);
        dayStart.setHours(0, 0, 0, 0);
        
        const startMinutes = (startTime - dayStart) / (1000 * 60);
        const endMinutes = (endTime - dayStart) / (1000 * 60);
        const duration = endMinutes - startMinutes;
        
        // Cada hora ocupa 200px en el timeline (100px por slot de 30 minutos)
        const left = (startMinutes / 30) * 100;
        const width = Math.max((duration / 30) * 100, 100); // Mínimo 100px de ancho
        
        return { left, width };
    }

    // Mostrar modal con detalles del programa
    function showProgramDetails(program, channelName, startTime, endTime) {
        const title = program.getElementsByTagName('title')[0]?.textContent || 'Sin título';
        const description = program.getElementsByTagName('desc')[0]?.textContent || 'Sin descripción';

        modal.querySelector('.modal-title').textContent = title;
        modal.querySelector('.modal-time').textContent = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        modal.querySelector('.modal-channel').textContent = channelName;
        modal.querySelector('.modal-description').textContent = description;

        modal.classList.add('show');
        
        // Prevenir que el scroll de la página se mueva mientras el modal está abierto
        document.body.style.overflow = 'hidden';
    }

    // Cerrar modal
    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    // Cargar el XML y procesar los datos
    async function loadProgramData() {
        try {
            const response = await fetch('https://raw.githubusercontent.com/migpaniag/EPGS/main/all_in_one/all_in_one.xml', {
                headers: {
                    'Accept': 'application/xml'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
                throw new Error('Error al parsear XML');
            }
            
            // Limpiar los contenedores
            channelsList.innerHTML = '';
            programsContainer.innerHTML = '';
            
            // Procesar canales y programas
            const channels = xmlDoc.getElementsByTagName('channel');
            
            Array.from(channels).forEach(channel => {
                const channelId = channel.getAttribute('id');
                const channelName = channel.getElementsByTagName('display-name')[0]?.textContent || 'Canal sin nombre';
                
                // Crear elemento del canal
                const channelElement = document.createElement('div');
                channelElement.className = 'channel';
                channelElement.textContent = channelName;
                channelsList.appendChild(channelElement);
                
                // Crear fila de programas
                const programsRow = document.createElement('div');
                programsRow.className = 'programs-row';
                
                // Obtener programas del canal
                const programs = xmlDoc.querySelectorAll(`programme[channel="${channelId}"]`);
                
                programs.forEach(program => {
                    const startTime = parseXMLDate(program.getAttribute('start'));
                    const endTime = parseXMLDate(program.getAttribute('stop'));
                    
                    if (startTime && endTime && isSameDay(startTime, currentDate)) {
                        const { left, width } = calculateProgramPosition(startTime, endTime);
                        const programElement = createProgramElement(program, startTime, endTime, left, width);
                        
                        // Añadir evento click para mostrar detalles
                        programElement.addEventListener('click', () => {
                            showProgramDetails(program, channelName, startTime, endTime);
                        });
                        
                        programsRow.appendChild(programElement);
                    }
                });
                
                programsContainer.appendChild(programsRow);
            });
        } catch (error) {
            console.error('Error al cargar los datos:', error);
            programsContainer.innerHTML = `<p>Error al cargar la programación: ${error.message}</p>`;
        }
    }

    function createProgramElement(program, startTime, endTime, left, width) {
        const programElement = document.createElement('div');
        programElement.className = 'program';
        
        const title = program.getElementsByTagName('title')[0]?.textContent || 'Sin título';
        const description = program.getElementsByTagName('desc')[0]?.textContent || '';
        
        programElement.innerHTML = `
            <div class="program-title">${title}</div>
            <div class="program-time">
                ${formatTime(startTime)} - ${formatTime(endTime)}
            </div>
            ${description ? `<div class="program-desc">${description}</div>` : ''}
        `;
        
        // Establecer posición y ancho según la duración
        programElement.style.left = `${left}px`;
        programElement.style.width = `${width}px`;
        
        return programElement;
    }

    function formatTime(date) {
        return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }

    function isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    // Eventos para los botones de navegación por día
    document.getElementById('prevDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        updateDateDisplay();
        loadProgramData();
    });

    document.getElementById('nextDay').addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        updateDateDisplay();
        loadProgramData();
    });

    // Cerrar modal al hacer click fuera de él
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Inicializar
    generateTimeSlots();
    updateDateDisplay();
    loadProgramData();
});
