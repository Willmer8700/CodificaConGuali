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
    
    // ✅ NUEVO: Variable para controlar el estado del loop
    let isInsideLoop = false;

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
    
    // ✅ CORREGIDO: Loop con alternancia entre loop-start y loop-end
    document.getElementById('loop-start')?.addEventListener('click', () => {
        if (!isInsideLoop) {
            addMove('loop-start');
            isInsideLoop = true;
        } else {
            addMove('loop-end');
            isInsideLoop = false;
        }
    });
    
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
    function addMove(type) { 
        moves.push(type); 
        const li = document.createElement('li'); 
        li.textContent = type; 
        movesList.appendChild(li); 
    }
    
    // ✅ CORREGIDO: Reset también resetea el estado del loop
    function reset() { 
        moves = []; 
        movesList.innerHTML = ''; 
        position = { row: 4, col: 0 }; 
        direction = 0; 
        isInsideLoop = false; // Resetear estado de loop
        const startCell = grid.children[20]; 
        startCell.appendChild(robot); 
        robot.style.transform = 'rotate(0deg)'; 
        message.textContent = ''; 
    }
    
    function clearMoves() { 
        moves = []; 
        movesList.innerHTML = ''; 
        isInsideLoop = false; // Resetear estado de loop al limpiar
    }

    // ✅ CORREGIDO: Ejecutar movimientos con procesamiento de loops
    function executeMoves() { 
        const expandedMoves = expandLoops(moves);
        let i = 0;
        let hasFailed = false;
        
        const interval = setInterval(() => { 
            if (i >= expandedMoves.length || hasFailed) { 
                clearInterval(interval); 
                
                if (!hasFailed && isAtEnd(position, trackPath)) { 
                    // ✅ CASO: VICTORIA
                    message.textContent = '¡Misión satisfactoria!';
                    if (typeof window.showSuccessModal === 'function') {
                        window.showSuccessModal();
                    }
                    logGameResult("SUCCESS");
                    
                    // ✅ AGREGAR: Reiniciar después de ganar
                    setTimeout(() => {
                        resetToStart();
                    }, 1000);
                    
                } else if (!hasFailed) { 
                    // ✅ CASO: Se quedó a medio camino
                    message.textContent = 'Inténtalo de nuevo';
                    if (typeof window.showFailureModal === 'function') {
                        window.showFailureModal();
                    }
                    logGameResult("FAIL");
                    
                    // ✅ Reiniciar después de perder
                    setTimeout(() => {
                        resetToStart();
                    }, 1000);
                }
                return; 
            } 
            
            let move = expandedMoves[i]; 
            
            if (move === 'forward') {
                const success = moveForward();
                if (!success) {
                    // ✅ CASO: Se salió de la pista
                    hasFailed = true;
                    message.textContent = '¡El robot salió de la pista!';
                    if (typeof window.showFailureModal === 'function') {
                        window.showFailureModal();
                    }
                    logGameResult("FAIL");
                    clearInterval(interval);
                    
                    // ✅ Reiniciar después de salirse
                    setTimeout(() => {
                        resetToStart();
                    }, 1000);
                    return;
                }
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

    // ✅ NUEVO: Función para expandir loops
    function expandLoops(movesList) {
        const expanded = [];
        let i = 0;
        
        while (i < movesList.length) {
            if (movesList[i] === 'loop-start') {
                // Encontrar el loop-end correspondiente
                const loopStart = i;
                let loopEnd = -1;
                let depth = 1;
                
                for (let j = i + 1; j < movesList.length; j++) {
                    if (movesList[j] === 'loop-start') depth++;
                    if (movesList[j] === 'loop-end') {
                        depth--;
                        if (depth === 0) {
                            loopEnd = j;
                            break;
                        }
                    }
                }
                
                if (loopEnd !== -1) {
                    // Extraer comandos dentro del loop
                    const loopCommands = movesList.slice(loopStart + 1, loopEnd);
                    // Repetir 2 veces (puedes cambiar esto)
                    for (let repeat = 0; repeat < 2; repeat++) {
                        expanded.push(...loopCommands);
                    }
                    i = loopEnd + 1;
                } else {
                    // Si no hay loop-end, ignorar el loop-start
                    i++;
                }
            } else if (movesList[i] !== 'loop-end') {
                // Agregar movimientos normales (ignorar loop-end sueltos)
                expanded.push(movesList[i]);
                i++;
            } else {
                i++;
            }
        }
        
        return expanded;
    }

    // ✅ CORREGIDO: moveForward ahora retorna true/false y permite salirse
    function moveForward() { 
        let newRow = position.row; 
        let newCol = position.col; 
        
        // Calcular nueva posición según dirección
        if (direction === 0) newRow--; // Arriba
        else if (direction === 1) newCol++; // Derecha
        else if (direction === 2) newRow++; // Abajo
        else if (direction === 3) newCol--; // Izquierda
        
        // ✅ Verificar si está dentro del grid
        const isInsideGrid = newRow >= 0 && newRow < 5 && newCol >= 0 && newCol < 5;
        
        if (!isInsideGrid) {
            // ✅ SALIÓ DEL GRID - No mover y retornar false
            return false;
        }
        
        // ✅ Mover el robot a la nueva posición
        position.row = newRow; 
        position.col = newCol; 
        const newCell = grid.children[position.row * 5 + position.col]; 
        newCell.appendChild(robot);
        
        // ✅ Verificar si está en el path
        const onPath = isOnPath(position);
        
        if (!onPath) {
            // ✅ SALIÓ DE LA PISTA - Retornar false
            return false;
        }
        
        // ✅ Movimiento exitoso
        return true;
    }

    // ✅ NUEVO: Función para reiniciar a la posición inicial
    function resetToStart() {
        position = { row: 4, col: 0 };
        direction = 0;
        const startCell = grid.children[20];
        startCell.appendChild(robot);
        robot.style.transform = 'rotate(0deg)';
    }

    function setupConfigGrid() { 
        configGrid.innerHTML = ''; 
        for (let row = 0; row < 5; row++) { 
            for (let col = 0; col < 5; col++) { 
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
    
    function isOnPath(pos) { 
        return trackPath.some(p => p[0] === pos.row && p[1] === pos.col); 
    }
    
    function isAtEnd(pos, path) { 
        if (!path || path.length === 0) return false; 
        const end = path[path.length - 1]; 
        return pos.row === end[0] && pos.col === end[1]; 
    }

    function logGameResult(result) {
        const trackNameSpan = document.getElementById('trackNameSpan');
        let trackName = 'Pista Desconocida';

        if (trackNameSpan) {
            trackName = trackNameSpan.textContent.trim();
            console.log("Nombre de pista encontrado en span:", trackName);
        } else {
            console.error("¡ERROR: No se encontró el elemento con ID 'trackNameSpan'!");
        }

        if (!trackName) {
            trackName = 'Pista Sin Nombre';
            console.warn("El span del nombre de la pista estaba vacío. Usando valor por defecto.");
        }

        const payload = {
            trackName: trackName,
            result: result
        };

        console.log("Enviando payload a /log-result:", payload);

        fetch('/log-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                console.error("Error del servidor:", response.status, response.statusText);
                return response.text().then(text => { throw new Error(text || 'Error desconocido del servidor') });
            }
            return response.text();
        })
        .then(data => console.log('Resultado del juego registrado:', data))
        .catch(error => {
            console.error('Error al registrar resultado:', error.message || error);
        });
    }
});