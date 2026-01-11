// Canvas and context
const canvas = document.getElementById('memeCanvas');
const ctx = canvas.getContext('2d');
const canvasPlaceholder = document.getElementById('canvasPlaceholder');

// State
let image = null;
let textBoxes = [];
let nextId = 1;
let selectedTextBox = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let currentFontSize = 40;
let currentTextColor = '#FFFFFF';
let clickTimeout = null;

// DOM elements
const imageInput = document.getElementById('imageInput');
const textInput = document.getElementById('textInput');
// Handle textarea instead of input for multi-line support
const addTextBtn = document.getElementById('addTextBtn');
const fontSizeInput = document.getElementById('fontSizeInput');
const fontSizeDisplay = document.getElementById('fontSizeDisplay');
const textColorInput = document.getElementById('textColorInput');
const textBoxesList = document.getElementById('textBoxesList');
const downloadBtn = document.getElementById('downloadBtn');
const layerCount = document.getElementById('layerCount');
const colorValue = document.querySelector('.color-value');
const templatesGrid = document.getElementById('templatesGrid');

// Template images
const templateImages = [
    { name: 'Bell Curve', path: 'assets/bell-curve-v0-ua8cx3e0fa3f1.jpg' },
    { name: 'Big Brain Wojak', path: 'assets/big-brain-wojak.gif' },
    { name: 'Puppet Awkward', path: 'assets/puppet-awkward.gif' }
];

// Initialize
fontSizeInput.value = currentFontSize;
fontSizeDisplay.textContent = currentFontSize;
if (colorValue) {
    colorValue.textContent = currentTextColor.toUpperCase();
}

// Load templates
function loadTemplates() {
    templatesGrid.innerHTML = templateImages.map((template, index) => `
        <div class="template-item" data-index="${index}">
            <img src="${template.path}" alt="${template.name}" class="template-thumbnail">
            <div class="template-overlay">
                <span class="template-name">${template.name}</span>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.template-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            loadTemplateImage(templateImages[index].path);
        });
    });
}

function loadTemplateImage(path) {
    const img = new Image();
    img.onload = () => {
        image = img;
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.style.display = 'block';
        canvasPlaceholder.style.display = 'none';
        drawCanvas();
    };
    img.onerror = () => {
        alert('Failed to load template image. Please check if the file exists.');
    };
    img.src = path;
}

// Initialize templates on load
loadTemplates();

// Image loading
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        loadImage(file);
    }
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            image = img;
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.style.display = 'block';
            canvasPlaceholder.style.display = 'none';
            drawCanvas();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Text management
addTextBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:111',message:'addTextBtn click',data:{text,hasImage:!!image,selectedTextBoxId:selectedTextBox?.id,textBoxesCount:textBoxes.length,nextId,buttonText:addTextBtn.querySelector('span').textContent},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (text && image) {
        // Only update if button says "Update Text" (explicit edit mode)
        const buttonText = addTextBtn.querySelector('span').textContent;
        if (selectedTextBox && buttonText.includes('Update')) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:116',message:'Updating existing textBox',data:{selectedTextBoxId:selectedTextBox.id,textBoxesCount:textBoxes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            // Update existing text box (only when explicitly in edit mode)
            updateTextBox(selectedTextBox.id, text);
            selectedTextBox = null;
            updateTextBoxesList();
            updateControlsForSelectedTextBox();
            textInput.value = '';
            addTextBtn.querySelector('span').textContent = 'Add Text to Canvas';
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:127',message:'Adding new textBox',data:{textBoxesCount:textBoxes.length,nextId,wasSelected:!!selectedTextBox},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            // Clear selection when adding new text
            selectedTextBox = null;
            updateTextBoxesList();
            // Add new text box
            addTextBox(text);
            textInput.value = '';
        }
    } else if (!image) {
        alert('Please upload an image first!');
    }
});

function addTextBox(text) {
    // Calculate position based on displayed canvas size, not actual canvas size
    // This ensures text stays within visible bounds
    const canvasRect = canvas.getBoundingClientRect();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:141',message:'addTextBox entry',data:{textLength:text.length,canvasWidth:canvas.width,canvasHeight:canvas.height,canvasDisplayWidth:canvasRect.width,canvasDisplayHeight:canvasRect.height,currentFontSize,textBoxesCount:textBoxes.length,nextId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;
    
    // Position text in center of visible canvas area
    // Account for padding/margins to keep text visible
    const padding = 50; // Padding from edges
    const visibleWidth = canvas.width - (padding * 2 * scaleX);
    const visibleHeight = canvas.height - (padding * 2 * scaleY);
    const centerX = (canvas.width / 2);
    const centerY = (canvas.height / 2);
    
    // Preserve newlines for multi-line text rendering
    const textBox = {
        id: nextId++,
        text: text, // Keep text with newlines for multi-line rendering
        originalText: text, // Keep original for editing
        x: centerX,
        y: centerY,
        fontSize: currentFontSize,
        color: currentTextColor
    };
    
    // Constrain text position to stay within visible bounds
    // Measure text to ensure it fits
    ctx.save();
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    const lines = text.split('\n');
    let maxWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) maxWidth = metrics.width;
    });
    const totalHeight = lines.length * textBox.fontSize * 1.2;
    ctx.restore();
    
    // Calculate padding in canvas coordinates
    // Account for stroke width which extends beyond text bounds
    const strokeWidth = Math.max(3, textBox.fontSize / 8);
    // Use dynamic padding that increases with font size to ensure text stays visible
    const basePaddingPercent = 0.05; // Base 5% padding
    const fontSizePaddingFactor = Math.min(textBox.fontSize / 1000, 0.1); // Additional padding based on font size, max 10%
    const paddingPercent = basePaddingPercent + fontSizePaddingFactor;
    
    const canvasPaddingX = Math.max(canvas.width * paddingPercent, strokeWidth * 2);
    const canvasPaddingY = Math.max(canvas.height * paddingPercent, strokeWidth * 2);
    
    // Calculate available space for text
    const availableWidth = canvas.width - (canvasPaddingX * 2);
    const availableHeight = canvas.height - (canvasPaddingY * 2);
    
    // Adjust position if text would go outside bounds
    const textHalfWidth = maxWidth / 2;
    const textHalfHeight = totalHeight / 2;
    
    // Calculate safe bounds for text center position
    // Text center can be positioned such that text edges stay within padding
    const minX = canvasPaddingX + textHalfWidth;
    const maxX = canvas.width - canvasPaddingX - textHalfWidth;
    const minY = canvasPaddingY + textHalfHeight;
    const maxY = canvas.height - canvasPaddingY - textHalfHeight;
    
    // If text is too large to fit, center it anyway
    let finalX = centerX;
    let finalY = centerY;
    
    // Only constrain if bounds are valid and text fits
    if (minX <= maxX && maxWidth <= availableWidth) {
        // Text fits - constrain position to keep it within bounds
        finalX = Math.max(minX, Math.min(maxX, centerX));
    } else if (minX > maxX) {
        // Text is wider than canvas - center it
        finalX = canvas.width / 2;
    } else {
        // Text fits but center is outside bounds - clamp to bounds
        finalX = Math.max(minX, Math.min(maxX, centerX));
    }
    
    if (minY <= maxY && totalHeight <= availableHeight) {
        // Text fits - constrain position to keep it within bounds
        finalY = Math.max(minY, Math.min(maxY, centerY));
    } else if (minY > maxY) {
        // Text is taller than canvas - center it
        finalY = canvas.height / 2;
    } else {
        // Text fits but center is outside bounds - clamp to bounds
        finalY = Math.max(minY, Math.min(maxY, centerY));
    }
    
    textBox.x = finalX;
    textBox.y = finalY;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:200',message:'textBox constraint calculation',data:{textBoxId:textBox.id,fontSize:textBox.fontSize,textBoxX:textBox.x,textBoxY:textBox.y,canvasWidth:canvas.width,canvasHeight:canvas.height,maxWidth,totalHeight,canvasPaddingX,canvasPaddingY,minX,maxX,minY,maxY,textFitsWidth:maxWidth <= (canvas.width - canvasPaddingX * 2),textFitsHeight:totalHeight <= (canvas.height - canvasPaddingY * 2)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    textBoxes.push(textBox);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:183',message:'textBox pushed',data:{textBoxesCount:textBoxes.length,allIds:textBoxes.map(tb=>tb.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    updateTextBoxesList();
    drawCanvas();
}

function removeTextBox(id) {
    textBoxes = textBoxes.filter(tb => tb.id !== id);
    if (selectedTextBox && selectedTextBox.id === id) {
        selectedTextBox = null;
    }
    updateTextBoxesList();
    drawCanvas();
}

function updateTextBox(id, newText) {
    const textBox = textBoxes.find(tb => tb.id === id);
    if (textBox) {
        textBox.text = newText; // Keep newlines for multi-line rendering
        textBox.originalText = newText; // Keep original for editing
        updateTextBoxesList();
        drawCanvas();
    }
}

// Font size
fontSizeInput.addEventListener('input', (e) => {
    currentFontSize = parseInt(e.target.value);
    fontSizeDisplay.textContent = currentFontSize;
    if (selectedTextBox) {
        selectedTextBox.fontSize = currentFontSize;
        drawCanvas();
    }
});

// Text color
textColorInput.addEventListener('input', (e) => {
    currentTextColor = e.target.value;
    if (colorValue) {
        colorValue.textContent = currentTextColor.toUpperCase();
    }
    if (selectedTextBox) {
        selectedTextBox.color = currentTextColor;
        drawCanvas();
    }
});

// Update controls when text box is selected
function updateControlsForSelectedTextBox() {
    // This function is now only used for style updates, not text editing
    updateStyleControlsOnly();
}

// Text boxes list UI
function updateTextBoxesList() {
    if (layerCount) {
        layerCount.textContent = textBoxes.length;
    }
    
    if (textBoxes.length === 0) {
        textBoxesList.innerHTML = `
            <div class="empty-state">
                <p>No text layers yet</p>
                <span>Add text to get started</span>
            </div>
        `;
        return;
    }
    
    textBoxesList.innerHTML = textBoxes.map(textBox => `
        <div class="text-layer-item ${selectedTextBox && selectedTextBox.id === textBox.id ? 'active' : ''}" data-id="${textBox.id}" onclick="selectTextBox(${textBox.id})">
            <div class="text-layer-content">${escapeHtml(textBox.text)}</div>
            <div class="text-layer-actions">
                <button class="layer-action-btn edit-layer-btn" onclick="event.stopPropagation(); editTextBox(${textBox.id})">Edit</button>
                <button class="layer-action-btn delete-layer-btn" onclick="event.stopPropagation(); removeTextBox(${textBox.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function selectTextBox(id) {
    const textBox = textBoxes.find(tb => tb.id === id);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:241',message:'selectTextBox called',data:{id,found:!!textBox,currentSelectedId:selectedTextBox?.id,textBoxesCount:textBoxes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (textBox) {
        selectedTextBox = textBox;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:244',message:'selectedTextBox set',data:{selectedId:textBox.id,textBoxesCount:textBoxes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        updateTextBoxesList();
        updateStyleControlsOnly();
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function editTextBox(id) {
    const textBox = textBoxes.find(tb => tb.id === id);
    if (textBox) {
        // Select the text box and populate the input field for editing
        selectedTextBox = textBox;
        updateTextBoxesList();
        // Populate text input with original text (with newlines if any)
        textInput.value = textBox.originalText || textBox.text;
        textInput.placeholder = 'Edit text...\nPress Enter for new lines';
        fontSizeInput.value = textBox.fontSize;
        fontSizeDisplay.textContent = textBox.fontSize;
        textColorInput.value = textBox.color || '#FFFFFF';
        if (colorValue) {
            colorValue.textContent = (textBox.color || '#FFFFFF').toUpperCase();
        }
        currentFontSize = textBox.fontSize;
        currentTextColor = textBox.color || '#FFFFFF';
        // Change button text to "Update"
        addTextBtn.querySelector('span').textContent = 'Update Text';
        // Focus the text input for easy editing
        setTimeout(() => {
            textInput.focus();
            textInput.select();
        }, 10);
    }
}

function updateStyleControlsOnly() {
    if (selectedTextBox) {
        // Only update style controls, not text input
        fontSizeInput.value = selectedTextBox.fontSize;
        fontSizeDisplay.textContent = selectedTextBox.fontSize;
        textColorInput.value = selectedTextBox.color || '#FFFFFF';
        if (colorValue) {
            colorValue.textContent = (selectedTextBox.color || '#FFFFFF').toUpperCase();
        }
        currentFontSize = selectedTextBox.fontSize;
        currentTextColor = selectedTextBox.color || '#FFFFFF';
    } else {
        // Reset to defaults when nothing is selected
        fontSizeInput.value = currentFontSize;
        fontSizeDisplay.textContent = currentFontSize;
        textColorInput.value = currentTextColor;
        if (colorValue) {
            colorValue.textContent = currentTextColor.toUpperCase();
        }
    }
}

// Make functions globally available for onclick handlers
window.removeTextBox = removeTextBox;
window.editTextBox = editTextBox;
window.selectTextBox = selectTextBox;

// Canvas rendering
function drawCanvas() {
    if (!image) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw image
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Draw all text boxes
    textBoxes.forEach(textBox => {
        drawText(textBox);
    });
}

function drawText(textBox) {
    ctx.save();
    
    // Set font
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Set text styling
    ctx.fillStyle = textBox.color || '#FFFFFF';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, textBox.fontSize / 8);
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    
    // Handle multi-line text
    const lines = textBox.text.split('\n');
    const lineHeight = textBox.fontSize * 1.2; // Line spacing
    const totalHeight = lines.length * lineHeight;
    const startY = textBox.y - (totalHeight / 2) + (lineHeight / 2);
    
    // #region agent log
    let maxLineWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
    });
    fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:310',message:'drawText rendering',data:{textBoxId:textBox.id,textBoxX:textBox.x,textBoxY:textBox.y,canvasWidth:canvas.width,canvasHeight:canvas.height,maxLineWidth,totalHeight,lineCount:lines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Draw each line
    lines.forEach((line, index) => {
        const y = startY + (index * lineHeight);
        // Draw text with stroke (border) and fill
        ctx.strokeText(line, textBox.x, y);
        ctx.fillText(line, textBox.x, y);
    });
    
    ctx.restore();
}

// Hit detection
function isPointInText(x, y, textBox) {
    ctx.save();
    ctx.font = `bold ${textBox.fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Handle multi-line text
    const lines = textBox.text.split('\n');
    const lineHeight = textBox.fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    
    // Find the widest line
    let maxWidth = 0;
    lines.forEach(line => {
        const metrics = ctx.measureText(line);
        if (metrics.width > maxWidth) {
            maxWidth = metrics.width;
        }
    });
    
    // Calculate bounding box for all lines
    const left = textBox.x - maxWidth / 2;
    const right = textBox.x + maxWidth / 2;
    const top = textBox.y - totalHeight / 2;
    const bottom = textBox.y + totalHeight / 2;
    
    ctx.restore();
    
    return x >= left && x <= right && y >= top && y <= bottom;
}

// Drag functionality
function getCanvasCoordinates(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.addEventListener('mousedown', (e) => {
    if (!image) return;
    
    const coords = getCanvasCoordinates(e);
    
    // Check if clicking on a text box (check in reverse order for top-most)
    for (let i = textBoxes.length - 1; i >= 0; i--) {
        if (isPointInText(coords.x, coords.y, textBoxes[i])) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/2dbf4958-234a-4fe1-94cc-85b88c7bc41e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:420',message:'Canvas click on textBox',data:{clickedId:textBoxes[i].id,previousSelectedId:selectedTextBox?.id,textBoxesCount:textBoxes.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            selectedTextBox = textBoxes[i];
            dragOffset.x = coords.x - selectedTextBox.x;
            dragOffset.y = coords.y - selectedTextBox.y;
            updateTextBoxesList();
            updateStyleControlsOnly(); // Only update style, not text input
            
            // Delay dragging to allow for double-click
            clickTimeout = setTimeout(() => {
                isDragging = true;
                canvas.style.cursor = 'grabbing';
            }, 200);
            
            e.preventDefault();
            return;
        }
    }
    
    // Clicked on empty space
    if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
    }
    selectedTextBox = null;
    updateTextBoxesList();
    updateStyleControlsOnly();
    // Clear text input and reset button
    textInput.value = '';
    textInput.placeholder = 'Enter your meme text\nPress Enter for new lines';
    addTextBtn.querySelector('span').textContent = 'Add Text to Canvas';
});

// Removed double-click editing - only Edit button allows editing

canvas.addEventListener('mousemove', (e) => {
    if (!image) return;
    
    const coords = getCanvasCoordinates(e);
    
    if (isDragging && selectedTextBox) {
        // Cancel click timeout if we start dragging
        if (clickTimeout) {
            clearTimeout(clickTimeout);
            clickTimeout = null;
        }
        selectedTextBox.x = coords.x - dragOffset.x;
        selectedTextBox.y = coords.y - dragOffset.y;
        drawCanvas();
    } else {
        // Check if hovering over text
        let hovering = false;
        for (let i = textBoxes.length - 1; i >= 0; i--) {
            if (isPointInText(coords.x, coords.y, textBoxes[i])) {
                canvas.style.cursor = 'grab';
                hovering = true;
                break;
            }
        }
        if (!hovering) {
            canvas.style.cursor = 'move';
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (clickTimeout) {
        clearTimeout(clickTimeout);
        clickTimeout = null;
    }
    isDragging = false;
    canvas.style.cursor = 'move';
});

canvas.addEventListener('mouseleave', () => {
    isDragging = false;
    canvas.style.cursor = 'move';
});

// Touch support
canvas.addEventListener('touchstart', (e) => {
    if (!image) return;
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchmove', (e) => {
    if (!image) return;
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
});

canvas.addEventListener('touchend', (e) => {
    if (!image) return;
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
});

// Download
downloadBtn.addEventListener('click', () => {
    if (!image || textBoxes.length === 0) {
        alert('Please add an image and at least one text box!');
        return;
    }
    downloadMeme();
});

function downloadMeme() {
    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.download = 'meme.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}

// Resizer functionality
const resizer = document.getElementById('resizer');
const leftPanel = document.getElementById('leftPanel');
const rightPanel = document.getElementById('rightPanel');
let isResizing = false;
let startX = 0;
let startLeftWidth = 0;
let startRightWidth = 0;

resizer.addEventListener('mousedown', (e) => {
    isResizing = true;
    startX = e.clientX;
    startLeftWidth = leftPanel.offsetWidth;
    startRightWidth = rightPanel.offsetWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
});

function handleResize(e) {
    if (!isResizing) return;
    
    const diff = e.clientX - startX;
    const newLeftWidth = startLeftWidth + diff;
    const newRightWidth = startRightWidth - diff;
    
    // Apply min/max constraints
    const minPanelWidth = 300;
    const maxRightWidth = 800;
    const workspaceWidth = document.querySelector('.workspace').offsetWidth;
    const maxLeftWidth = workspaceWidth - minPanelWidth - resizer.offsetWidth;
    
    if (newLeftWidth >= minPanelWidth && newLeftWidth <= maxLeftWidth && 
        newRightWidth >= minPanelWidth && newRightWidth <= maxRightWidth) {
        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
        rightPanel.style.width = `${newRightWidth}px`;
    }
}

function stopResize() {
    isResizing = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
}

// Touch support for resizer
resizer.addEventListener('touchstart', (e) => {
    isResizing = true;
    const touch = e.touches[0];
    startX = touch.clientX;
    startLeftWidth = leftPanel.offsetWidth;
    startRightWidth = rightPanel.offsetWidth;
    document.addEventListener('touchmove', handleResizeTouch);
    document.addEventListener('touchend', stopResize);
    e.preventDefault();
});

function handleResizeTouch(e) {
    if (!isResizing) return;
    
    const touch = e.touches[0];
    const diff = touch.clientX - startX;
    const newLeftWidth = startLeftWidth + diff;
    const newRightWidth = startRightWidth - diff;
    
    // Apply min/max constraints
    const minPanelWidth = 300;
    const maxRightWidth = 800;
    const workspaceWidth = document.querySelector('.workspace').offsetWidth;
    const maxLeftWidth = workspaceWidth - minPanelWidth - resizer.offsetWidth;
    
    if (newLeftWidth >= minPanelWidth && newLeftWidth <= maxLeftWidth && 
        newRightWidth >= minPanelWidth && newRightWidth <= maxRightWidth) {
        leftPanel.style.flex = `0 0 ${newLeftWidth}px`;
        rightPanel.style.width = `${newRightWidth}px`;
    }
}
