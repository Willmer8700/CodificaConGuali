document.addEventListener('DOMContentLoaded', () => {
    const gamePanel = document.getElementById('game-panel');
    const configPanel = document.getElementById('config-panel');
    const grid = document.getElementById('grid');
    const configGrid = document.getElementById('config-grid');
    const robot = document.getElementById('robot');
    const movesList = document.getElementById('moves');
    const message = document.getElementById('message');
    const importFileInput = document.getElementById('importFile');
    const importTrackBtn = document.getElementById('importTrackBtn');

    importTrackBtn?.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput?.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        fetch('/admin/import-track', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            alert(data);
            location.reload();
        })
        .catch(error => console.error('Error al importar:', error));
    });

    const exportTrackBtn = document.getElementById('exportTrackBtn');
    const trackSelector = document.getElementById('trackSelector');

    exportTrackBtn?.addEventListener('click', () => {
        const selectedTrackId = trackSelector.value;

        if (selectedTrackId) {
            window.location.href = `/admin/export-track?trackId=${selectedTrackId}`;
        } else {
            alert('Por favor, selecciona una pista de la lista para exportar.');
        }
    });

    let moves = [];
    let position = { row: 4, col: 0 };
    let direction = 0; 
    const cellSize = 60;
    const cellBorder = 1;
    const innerOffset = (cellSize - 2 * cellBorder - 50) / 2;

    if (window.location.pathname === '/configurar') {
        gamePanel.style.display = 'none';
        configPanel.style.display = 'block';
        setupConfigGrid(); 
    } else {
        gamePanel.style.display = 'block';
        configPanel.style.display = 'none';
    }

    if (!grid || !robot || !configGrid) {
        console.error('Required elements not found');
        return;
    }

    robot.style.display = 'block';
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = row;
            cell.dataset.col = col;
            grid.appendChild(cell);
        }
    }

    let trackPath = grid.dataset.track ? JSON.parse(grid.dataset.track) : [];
    if (!Array.isArray(trackPath)) {
        console.warn('Track path is invalid, using default empty array');
        trackPath = [];
    }

    trackPath.forEach(pos => {
        const index = pos[0] * 5 + pos[1];
        if (grid.children[index]) {
            grid.children[index].classList.add('path');
        }
    });

    const startCell = grid.children[position.row * 5 + position.col];
    startCell.appendChild(robot);

    document.getElementById('forward')?.addEventListener('click', () => addMove('forward'));
    document.getElementById('left')?.addEventListener('click', () => addMove('left'));
    document.getElementById('right')?.addEventListener('click', () => addMove('right'));
    document.getElementById('loop-start')?.addEventListener('click', () => addMove('loop-start'));
    document.getElementById('reset')?.addEventListener('click', reset);
    document.getElementById('clear')?.addEventListener('click', clearMoves);
    document.getElementById('execute')?.addEventListener('click', executeMoves);
    
    document.getElementById('config')?.addEventListener('click', () => {
        window.location.href = '/configurar';
    });
    
    document.getElementById('saveTrack')?.addEventListener('click', () => {
        const path = [];
        configGrid.querySelectorAll('.cell.path').forEach(cell => {
            path.push([parseInt(cell.dataset.row), parseInt(cell.dataset.col)]);
        });

        if (path.length > 0) {
            const hasStart = path.some(p => p[0] === 4 && p[1] === 0);
            if (!hasStart) {
                alert('La traza debe incluir el punto de inicio (4,0) - la esquina inferior izquierda.');
                return;
            }

            const sortedPath = sortPathFromStart(path);
            const trackData = {
                name: prompt('Nombre de la pista:') || 'Nueva Pista',
                path: JSON.stringify(sortedPath) 
            };

            fetch('/save-track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(trackData)
            }).then(response => response.text())
              .then(data => {
                  alert(data);
                  window.location.href = '/'; 
              })
              .catch(error => console.error('Error:', error));
        } else {
            alert('Diseña al menos una pista.');
        }
    });

    document.getElementById('clearGrid')?.addEventListener('click', () => {
        configGrid.innerHTML = '';
        setupConfigGrid();
    });

    // --- FUNCIONES DEL JUEGO ---
    function addMove(type) { moves.push(type); const li=document.createElement('li'); li.textContent=type; movesList.appendChild(li); }
    function reset() { moves=[]; movesList.innerHTML=''; position={row:4,col:0}; direction=0; const startCell=grid.children[20]; startCell.appendChild(robot); robot.style.transform='rotate(0deg)'; message.textContent=''; }
    function clearMoves() { moves=[]; movesList.innerHTML=''; }


    function executeMoves() { 
        let i = 0; 
        const interval = setInterval(() => { 
            if (i >= moves.length) { 
                clearInterval(interval); 
                
                if (isAtEnd(position, trackPath)) { 
                    message.textContent = '¡Misión satisfactoria!';
                    logGameResult("SUCCESS");
                } else { 
                    message.textContent = 'Inténtalo de nuevo'; 
                    logGameResult("FAIL");
                } 
                return; 
            } 
            
            let move = moves[i]; 
            if (move === 'forward') {
                moveForward(); 
            } else if (move === 'left') { 
                direction = (direction + 3) % 4; 
                robot.style.transform = `rotate(${direction * -90}deg)`;
            } else if (move === 'right') { 
                direction = (direction + 1) % 4; 
                robot.style.transform = `rotate(${direction * 90}deg)`;
            } 
            i++; 
        }, 500); 
    }

    function moveForward() { 
        let newRow = position.row; 
        let newCol = position.col; 
        if (direction === 0 && position.row > 0) newRow--;
        else if (direction === 1 && position.col < 4) newCol++;
        else if (direction === 2 && position.row < 4) newRow++;
        else if (direction === 3 && position.col > 0) newCol--;
        
        if ((newRow !== position.row || newCol !== position.col) && isOnPath({ row: newRow, col: newCol })) { 
            position.row = newRow; 
            position.col = newCol; 
            const newCell = grid.children[position.row * 5 + position.col]; 
            newCell.appendChild(robot); 
        } 
    }

    function setupConfigGrid() { 
        configGrid.innerHTML=''; 
        for(let row=0; row<5; row++) { 
            for(let col=0; col<5; col++) { 
                const cell = document.createElement('div'); 
                cell.classList.add('cell'); 
                cell.dataset.row = row; 
                cell.dataset.col = col; 
                cell.addEventListener('click', () => { 
                    cell.classList.toggle('path'); 
                    cell.style.backgroundColor = cell.classList.contains('path') ? '#4CAF50' : ''; 
                }); 
                configGrid.appendChild(cell); 
            } 
        } 
    } 
    
    function sortPathFromStart(path) { 
        const start = [4, 0]; 
        const visited = new Set(); 
        const sortedPath = []; 
        let current = path.find(p => p[0] === start[0] && p[1] === start[1]); 
        if (!current) return path; 
        sortedPath.push([...current]); 
        visited.add(`${current[0]},${current[1]}`); 
        while (sortedPath.length < path.length) { 
            const lastPoint = sortedPath[sortedPath.length - 1]; 
            const nextPoint = path.find(p => { 
                const key = `${p[0]},${p[1]}`; 
                if (visited.has(key)) return false; 
                const rowDiff = Math.abs(p[0] - lastPoint[0]); 
                const colDiff = Math.abs(p[1] - lastPoint[1]); 
                return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1); 
            }); 
            if (nextPoint) { 
                sortedPath.push([...nextPoint]); 
                visited.add(`${nextPoint[0]},${nextPoint[1]}`); 
            } else { 
                const remaining = path.filter(p => !visited.has(`${p[0]},${p[1]}`)); 
                sortedPath.push(...remaining.map(p => [...p])); 
                break; 
            } 
        } 
        return sortedPath; 
    } 
    
    function isOnPath(pos) { return trackPath.some(p => p[0] === pos.row && p[1] === pos.col); }
    function isAtEnd(pos, path) { if (!path || path.length === 0) return false; const end = path[path.length - 1]; return pos.row === end[0] && pos.col === end[1]; }

    function logGameResult(result) {
    const trackNameSpan = document.getElementById('trackNameSpan');
    let trackName = 'Pista Desconocida'; // Valor por defecto

    if (trackNameSpan) {
        trackName = trackNameSpan.textContent.trim(); // Obtiene el texto y quita espacios extra
        console.log("Nombre de pista encontrado en span:", trackName); // Log para verificar
    } else {
        console.error("¡ERROR: No se encontró el elemento con ID 'trackNameSpan'!"); // Log si no encuentra el span
    }

    // Verificación adicional: si el nombre está vacío después de quitar espacios
    if (!trackName) {
        trackName = 'Pista Sin Nombre'; // Un fallback por si el span está vacío
        console.warn("El span del nombre de la pista estaba vacío. Usando valor por defecto.");
    }

    const payload = {
        trackName: trackName,
        result: result
    };

    console.log("Enviando payload a /log-result:", payload); // Log para ver qué se envía

    fetch('/log-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => { // Añadimos chequeo de la respuesta del servidor
        if (!response.ok) {
            // Si el servidor responde con error (como 400), muestra más detalles
            console.error("Error del servidor:", response.status, response.statusText);
            return response.text().then(text => { throw new Error(text || 'Error desconocido del servidor') });
        }
        return response.text(); // Si la respuesta es OK (2xx)
    })
    .then(data => console.log('Resultado del juego registrado:', data))
    .catch(error => {
        console.error('Error al registrar resultado:', error.message || error);
    });
    }

});