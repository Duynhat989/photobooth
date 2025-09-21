/**
 * PhotoBoothComposer - Class để ghép ảnh và render preview thành image cuối cùng
 * Tương thích với CSS Grid Layout của PhotoPreview.vue
 */
class PhotoBoothComposer {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.loadedImages = new Map();
        this.loadedFonts = new Set();
    }

    /**
     * Khởi tạo canvas với kích thước phù hợp
     */
    initCanvas(width, height) {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d');
        }
        
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
        
        return this.canvas;
    }

    /**
     * Lấy kích thước canvas dựa trên paper size (theo CSS preview)
     */
    getPaperDimensions(paperSize, dpi = 300) {
        // Dựa trên CSS getPreviewWidth và getPreviewHeight
        const previewDimensions = {
            '2x6': { width: 400, height: 1200 },   // CSS: 400px x 1200px
            '4x6': { width: 800, height: 1200 },   // CSS: 800px x 1200px  
            '4x3': { width: 960, height: 720 }     // CSS: 960px x 720px
        };
        
        const preview = previewDimensions[paperSize] || previewDimensions['4x6'];
        
        // Scale to high DPI for printing
        const scale = dpi / 150; // 150 DPI is base preview resolution
        return {
            width: Math.round(preview.width * scale),
            height: Math.round(preview.height * scale)
        };
    }

    /**
     * Lấy grid configuration từ CSS
     */
    getGridConfig(paperSize, layout) {
        // Từ CSS: .paper-2x6, .paper-4x6, .paper-4x3
        const paperGrids = {
            '2x6': { columns: 1 },     // CSS: grid-template-columns: 1fr
            '4x6': { columns: 2 },     // CSS: grid-template-columns: 1fr 1fr
            '4x3': { columns: 2 }      // CSS: grid-template-columns: 1fr 1fr
        };

        // Từ CSS: .layout-single, .layout-double, etc.
        const layoutOverrides = {
            'single': { 
                columns: 1, 
                rows: 1, 
                slots: 1,
                gridTemplateColumns: '1fr',
                gridTemplateRows: '1fr'
            },
            'double': { 
                columns: 1, 
                rows: 2, 
                slots: 2,
                gridTemplateColumns: '1fr',
                gridTemplateRows: 'auto auto'
            },
            'triple': { 
                columns: 2, 
                rows: 2, 
                slots: 3,
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: 'auto auto',
                specialLayout: true // .layout-triple .photo-slot:first-child { grid-column: 1 / -1; }
            },
            'quad': { 
                columns: 2, 
                rows: 2, 
                slots: 4,
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr'
            },
            'six': { 
                columns: 2, 
                rows: 3, 
                slots: 6,
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr'
            },
            'eight': { 
                columns: 2, 
                rows: 4, 
                slots: 8,
                gridTemplateColumns: '1fr 1fr',
                gridTemplateRows: '1fr 1fr 1fr 1fr'
            }
        };

        const baseConfig = paperGrids[paperSize] || paperGrids['4x6'];
        const layoutConfig = layoutOverrides[layout] || layoutOverrides['single'];
        
        return {
            ...baseConfig,
            ...layoutConfig
        };
    }

    /**
     * Load hình ảnh và cache
     */
    async loadImage(src) {
        if (this.loadedImages.has(src)) {
            return this.loadedImages.get(src);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.loadedImages.set(src, img);
                resolve(img);
            };
            
            img.onerror = () => {
                reject(new Error(`Không thể load image: ${src}`));
            };
            
            img.src = src;
        });
    }

    /**
     * Load Google Fonts nếu cần
     */
    async loadFont(fontFamily) {
        if (this.loadedFonts.has(fontFamily)) {
            return;
        }

        const googleFonts = [
            'Open Sans', 'Roboto', 'Lato', 'Montserrat', 'Poppins',
            'Playfair Display', 'Merriweather', 'Crimson Text', 'Libre Baskerville',
            'Oswald', 'Anton', 'Bebas Neue', 'Righteous', 'Fredoka One',
            'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Kalam',
            'Source Code Pro', 'Balsamiq Sans', 'Indie Flower'
        ];

        if (googleFonts.some(font => fontFamily.includes(font))) {
            try {
                await document.fonts.load(`16px "${fontFamily}"`);
                this.loadedFonts.add(fontFamily);
            } catch (error) {
                console.warn(`Không thể load font: ${fontFamily}`);
            }
        }
    }

    /**
     * Vẽ background theo CSS
     */
    drawBackground(layoutInfo) {
        const { width, height } = this.canvas;
        const { background } = layoutInfo.printSettings;
        
        // Từ CSS: getBackgroundStyle computed
        const colors = {
            white: '#ffffff',
            black: '#000000', 
            gray: '#6b7280',
            blue: '#3b82f6',
            red: '#ef4444',
            green: '#22c55e',
            yellow: '#eab308',
            purple: '#a855f7'
        };
        
        this.ctx.fillStyle = colors[background] || '#ffffff';
        this.ctx.fillRect(0, 0, width, height);
    }

    /**
     * Tính toán CSS Grid layout cho photo slots
     */
    calculateGridSlots(layoutInfo) {
        const { layout, paperSize } = layoutInfo.printSettings;
        const { width, height } = this.canvas;
        const config = this.getGridConfig(paperSize, layout);
        
        // Scale padding và gap theo canvas size, không phải width cố định
        const baseSize = Math.min(width, height);
        const padding = Math.max(20, baseSize * 0.02); // Minimum 20px hoặc 2% of canvas
        const gap = Math.max(10, baseSize * 0.01);     // Minimum 10px hoặc 1% of canvas
        
        const contentWidth = width - (padding * 2);
        const contentHeight = height - (padding * 2);
        
        // Debug log
        console.log('Canvas:', width, 'x', height);
        console.log('Layout:', layout, 'Config:', config);
        console.log('Content area:', contentWidth, 'x', contentHeight);
        
        // Tính column widths và row heights chính xác
        const columnWidth = (contentWidth - (gap * (config.columns - 1))) / config.columns;
        const rowHeight = (contentHeight - (gap * (config.rows - 1))) / config.rows;
        
        console.log('Slot size:', columnWidth, 'x', rowHeight);
        
        const slots = [];
        
        for (let i = 0; i < config.slots; i++) {
            let slot;
            
            if (layout === 'triple') {
                // CSS: .layout-triple .photo-slot:first-child { grid-column: 1 / -1; }
                if (i === 0) {
                    // First slot spans full width
                    slot = {
                        x: padding,
                        y: padding,
                        width: contentWidth,
                        height: rowHeight,
                        index: i,
                        gridColumn: '1 / -1',
                        gridRow: '1'
                    };
                } else {
                    // Remaining slots in second row (2 slots chia đôi)
                    const col = (i - 1) % 2;
                    slot = {
                        x: padding + col * (columnWidth + gap),
                        y: padding + rowHeight + gap,
                        width: columnWidth,
                        height: rowHeight,
                        index: i,
                        gridColumn: col + 1,
                        gridRow: '2'
                    };
                }
            } else {
                // Standard grid layout
                const col = i % config.columns;
                const row = Math.floor(i / config.columns);
                
                slot = {
                    x: padding + col * (columnWidth + gap),
                    y: padding + row * (rowHeight + gap),
                    width: columnWidth,
                    height: rowHeight,
                    index: i,
                    gridColumn: col + 1,
                    gridRow: row + 1
                };
            }
            
            console.log(`Slot ${i}:`, slot);
            slots.push(slot);
        }
        
        return slots;
    }

    /**
     * Vẽ ảnh vào slot với positioning từ CSS
     */
    async drawPhoto(photo, slot, layoutInfo) {
        if (!photo) {
            this.drawEmptySlot(slot, layoutInfo);
            return;
        }
        
        try {
            const img = await this.loadImage(photo);
            const { photoPositions } = layoutInfo.printSettings;
            const position = photoPositions?.[slot.index] || { x: 0, y: 0, scale: 1 };
            
            // CSS: .photo-slot { border-radius: 8px; overflow: hidden; }
            const borderRadius = Math.max(4, (this.canvas.width / 400) * 8); // Scale border radius
            
            // Debug log
            console.log(`Drawing photo ${slot.index}:`, {
                slot: { x: slot.x, y: slot.y, w: slot.width, h: slot.height },
                position,
                imgSize: { w: img.width, h: img.height }
            });
            
            // Clip to slot với border radius
            this.ctx.save();
            this.roundedRect(slot.x, slot.y, slot.width, slot.height, borderRadius);
            this.ctx.clip();
            
            // CSS: .photo-slot img { width: 100%; object-fit: contain; }
            // Tính toán fit image theo object-fit: contain
            const imgAspect = img.width / img.height;
            const slotAspect = slot.width / slot.height;
            
            let baseWidth, baseHeight;
            if (imgAspect > slotAspect) {
                // Image rộng hơn slot - fit theo width
                baseWidth = slot.width;
                baseHeight = baseWidth / imgAspect;
            } else {
                // Image cao hơn slot - fit theo height  
                baseHeight = slot.height;
                baseWidth = baseHeight * imgAspect;
            }
            
            // Apply user scale
            const finalWidth = baseWidth * position.scale;
            const finalHeight = baseHeight * position.scale;
            
            // Position trong slot: center + user offset
            // User position.x, position.y là offset từ center (pixels)
            const centerX = slot.x + slot.width / 2;
            const centerY = slot.y + slot.height / 2;
            
            const drawX = centerX - finalWidth / 2 + position.x;
            const drawY = centerY - finalHeight / 2 + position.y;
            
            console.log(`Final draw:`, {
                base: { w: baseWidth, h: baseHeight },
                final: { w: finalWidth, h: finalHeight },
                draw: { x: drawX, y: drawY }
            });
            
            // Vẽ ảnh
            this.ctx.drawImage(img, drawX, drawY, finalWidth, finalHeight);
            
            this.ctx.restore();
            
            // Vẽ effects sau khi restore clip
            this.applySlotStyle(slot, layoutInfo);
            
        } catch (error) {
            console.error(`Lỗi khi vẽ ảnh slot ${slot.index}:`, error);
            this.drawEmptySlot(slot, layoutInfo);
        }
    }

    /**
     * Vẽ slot trống theo CSS
     */
    drawEmptySlot(slot, layoutInfo) {
        const borderRadius = 8 * (this.canvas.width / 400);
        
        // CSS: .empty-slot { border: 2px dashed #d1d5db; background: #fafafa; }
        this.ctx.save();
        
        // Background
        this.ctx.fillStyle = '#fafafa';
        this.roundedRect(slot.x, slot.y, slot.width, slot.height, borderRadius);
        this.ctx.fill();
        
        // Dashed border
        this.ctx.setLineDash([10, 10]);
        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // CSS: .empty-placeholder icon và text
        const centerX = slot.x + slot.width / 2;
        const centerY = slot.y + slot.height / 2;
        
        this.ctx.fillStyle = '#9ca3af';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('📷', centerX, centerY - 10);
        
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Trống', centerX, centerY + 15);
        
        this.ctx.restore();
        
        this.applySlotStyle(slot, layoutInfo);
    }

    /**
     * Áp dụng slot style theo CSS classes
     */
    applySlotStyle(slot, layoutInfo) {
        const { style, addBorder } = layoutInfo.printSettings;
        const borderRadius = 8 * (this.canvas.width / 400);
        
        this.ctx.save();
        
        if (addBorder || style !== 'modern') {
            // CSS: .with-border .photo-slot, .style-classic .photo-slot, etc.
            let borderWidth = 3;
            let borderColor = '#ffffff';
            
            if (style === 'classic') {
                // CSS: .style-classic .photo-slot { border: 3px solid white; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
                borderWidth = 3;
                borderColor = '#ffffff';
                // Add shadow
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowOffsetY = 2;
            } else if (style === 'vintage') {
                // CSS: .style-vintage .photo-slot { border: 5px solid #f7e6a3; filter: sepia(0.2) contrast(1.1); }
                borderWidth = 5;
                borderColor = '#f7e6a3';
            } else if (style === 'polaroid') {
                // CSS: .style-polaroid .photo-slot { border: 15px solid white; border-bottom: 25px solid white; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 15;
                this.roundedRect(slot.x, slot.y, slot.width, slot.height, 0);
                this.ctx.stroke();
                
                // Extra bottom border for polaroid
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(slot.x - 15, slot.y + slot.height - 10, slot.width + 30, 25);
                
                // Shadow
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                this.ctx.shadowBlur = 12;
                this.ctx.shadowOffsetY = 4;
            } else if (style === 'film-strip') {
                // CSS: .style-film-strip .photo-slot { border: 2px solid #666; border-radius: 0; }
                borderWidth = 2;
                borderColor = '#666666';
                this.ctx.strokeStyle = borderColor;
                this.ctx.lineWidth = borderWidth;
                this.ctx.strokeRect(slot.x, slot.y, slot.width, slot.height);
                this.ctx.restore();
                return;
            }
            
            if (style !== 'polaroid' && style !== 'film-strip') {
                this.ctx.strokeStyle = borderColor;
                this.ctx.lineWidth = borderWidth;
                this.roundedRect(slot.x, slot.y, slot.width, slot.height, 
                    style === 'modern' ? borderRadius : 4);
                this.ctx.stroke();
            }
        }
        
        this.ctx.restore();
    }

    /**
     * Vẽ text elements theo CSS positioning
     */
    async drawTextElements(layoutInfo) {
        const { textElements } = layoutInfo.printSettings;
        if (!textElements || textElements.length === 0) return;
        
        for (const textElement of textElements) {
            await this.drawTextElement(textElement, layoutInfo);
        }
    }

    /**
     * Vẽ một text element theo CSS
     */
    async drawTextElement(textElement, layoutInfo) {
        const { width, height } = this.canvas;
        
        await this.loadFont(textElement.fontFamily);
        
        // CSS: position: absolute; left: x%; top: y%;
        const x = (textElement.x / 100) * width;
        const y = (textElement.y / 100) * height;
        
        // CSS font styling
        let fontStyle = '';
        if (textElement.italic) fontStyle += 'italic ';
        if (textElement.bold) fontStyle += 'bold ';
        
        this.ctx.font = `${fontStyle}${textElement.fontSize}px "${textElement.fontFamily}"`;
        this.ctx.fillStyle = textElement.color;
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        
        // CSS: text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        if (textElement.shadow) {
            this.ctx.save();
            this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = 4;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
        }
        
        this.ctx.fillText(textElement.text, x, y);
        
        if (textElement.shadow) {
            this.ctx.restore();
        }
    }

    /**
     * Vẽ image elements theo CSS
     */
    async drawImageElements(layoutInfo) {
        const { imageElements } = layoutInfo.printSettings;
        if (!imageElements || imageElements.length === 0) return;
        
        for (const imageElement of imageElements) {
            await this.drawImageElement(imageElement, layoutInfo);
        }
    }

    /**
     * Vẽ một image element theo CSS styling
     */
    async drawImageElement(imageElement, layoutInfo) {
        if (!imageElement.src) return;
        
        try {
            const img = await this.loadImage(imageElement.src);
            const { width, height } = this.canvas;
            
            // CSS: position: absolute; left: x%; top: y%;
            const x = (imageElement.x / 100) * width;
            const y = (imageElement.y / 100) * height;
            
            this.ctx.save();
            
            // CSS transformations
            this.ctx.globalAlpha = imageElement.opacity;
            
            const centerX = x + imageElement.width / 2;
            const centerY = y + imageElement.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((imageElement.rotation * Math.PI) / 180);
            
            // CSS shadow
            if (imageElement.shadow) {
                this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
                this.ctx.shadowBlur = 8;
                this.ctx.shadowOffsetX = 4;
                this.ctx.shadowOffsetY = 4;
            }
            
            // CSS border-radius
            if (imageElement.rounded) {
                const radius = 4;
                this.roundedRect(-imageElement.width / 2, -imageElement.height / 2, 
                               imageElement.width, imageElement.height, radius);
                this.ctx.clip();
            }
            
            this.ctx.drawImage(
                img,
                -imageElement.width / 2,
                -imageElement.height / 2,
                imageElement.width,
                imageElement.height
            );
            
            this.ctx.restore();
            
        } catch (error) {
            console.error('Lỗi khi vẽ image element:', error);
        }
    }

    /**
     * Vẽ overlays theo CSS
     */
    drawOverlays(layoutInfo) {
        const { addDate, addWatermark } = layoutInfo.printSettings;
        const { width, height } = this.canvas;
        
        if (addDate) {
            // CSS: .date-overlay
            const dateText = new Date().toLocaleDateString('vi-VN');
            const padding = 10 * (width / 400);
            const fontSize = 16 * (width / 400);
            
            this.ctx.save();
            this.ctx.font = `600 ${fontSize}px Arial`;
            
            const metrics = this.ctx.measureText(dateText);
            const textWidth = metrics.width;
            const textHeight = fontSize;
            
            // CSS: background: rgba(0, 0, 0, 0.7); border-radius: 4px;
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.roundedRect(
                width - textWidth - padding * 3,
                height - textHeight - padding * 2,
                textWidth + padding * 2,
                textHeight + padding,
                4
            );
            this.ctx.fill();
            
            // CSS: color: white; font-weight: 600;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'bottom';
            this.ctx.fillText(dateText, width - padding, height - padding);
            
            this.ctx.restore();
        }
        
        if (addWatermark) {
            // CSS: .watermark-overlay
            const watermarkText = 'Photo Booth';
            const padding = 10 * (width / 400);
            const fontSize = 16 * (width / 400);
            
            this.ctx.save();
            this.ctx.font = `600 ${fontSize}px Arial`;
            
            const metrics = this.ctx.measureText(watermarkText);
            const textWidth = metrics.width;
            const textHeight = fontSize;
            
            // CSS: background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(4px);
            this.ctx.fillStyle = 'rgba(255,255,255,0.9)';
            this.roundedRect(padding, padding, textWidth + padding * 2, textHeight + padding, 4);
            this.ctx.fill();
            
            // CSS: color: #374151; font-weight: 600;
            this.ctx.fillStyle = '#374151';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(watermarkText, padding * 2, padding * 2);
            
            this.ctx.restore();
        }
    }

    /**
     * Áp dụng global style effects theo CSS
     */
    applyStyleEffects(layoutInfo) {
        const { style } = layoutInfo.printSettings;
        
        if (style === 'vintage') {
            // CSS: filter: sepia(0.2) contrast(1.1);
            // Simulate sepia effect
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = 'rgba(255, 240, 200, 0.2)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        } else if (style === 'film-strip') {
            // CSS: .style-film-strip { background: #1a1a1a; border-left: 15px solid #333; border-right: 15px solid #333; }
            const borderWidth = 15 * (this.canvas.width / 400);
            
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(0, 0, borderWidth, this.canvas.height);
            this.ctx.fillRect(this.canvas.width - borderWidth, 0, borderWidth, this.canvas.height);
            
            // Sprocket holes
            const holeSize = 8 * (this.canvas.width / 400);
            const holeSpacing = 20 * (this.canvas.width / 400);
            this.ctx.fillStyle = '#1a1a1a';
            
            for (let y = holeSpacing; y < this.canvas.height; y += holeSpacing) {
                this.roundedRect(5, y, holeSize, holeSize, holeSize / 2);
                this.ctx.fill();
                this.roundedRect(this.canvas.width - 15, y, holeSize, holeSize, holeSize / 2);
                this.ctx.fill();
            }
        }
    }

    /**
     * Helper: vẽ rectangle với border radius
     */
    roundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    /**
     * Render layout thành canvas theo đúng CSS
     */
    async renderToCanvas(layoutInfo, options = {}) {
        const { dpi = 300, format = 'image/jpeg', quality = 0.9 } = options;
        
        try {
            const dimensions = this.getPaperDimensions(layoutInfo.printSettings.paperSize, dpi);
            this.initCanvas(dimensions.width, dimensions.height);
            
            // 1. Vẽ background
            this.drawBackground(layoutInfo);
            
            // 2. Áp dụng global style effects (film-strip background)
            if (layoutInfo.printSettings.style === 'film-strip') {
                this.applyStyleEffects(layoutInfo);
            }
            
            // 3. Tính toán CSS Grid slots
            const slots = this.calculateGridSlots(layoutInfo);
            
            // 4. Vẽ từng photo slot
            const photos = layoutInfo.selectedPhotos || [];
            for (let i = 0; i < slots.length; i++) {
                await this.drawPhoto(photos[i], slots[i], layoutInfo);
            }
            
            // 5. Vẽ text elements
            await this.drawTextElements(layoutInfo);
            
            // 6. Vẽ image elements  
            await this.drawImageElements(layoutInfo);
            
            // 7. Vẽ overlays
            this.drawOverlays(layoutInfo);
            
            // 8. Áp dụng other style effects
            if (layoutInfo.printSettings.style === 'vintage') {
                this.applyStyleEffects(layoutInfo);
            }
            
            return this.canvas;
            
        } catch (error) {
            console.error('Lỗi khi render canvas:', error);
            throw error;
        }
    }

    /**
     * Export thành data URL
     */
    async exportToDataURL(layoutInfo, options = {}) {
        const canvas = await this.renderToCanvas(layoutInfo, options);
        const { format = 'image/jpeg', quality = 0.9 } = options;
        
        return canvas.toDataURL(format, quality);
    }

    /**
     * Export thành Blob
     */
    async exportToBlob(layoutInfo, options = {}) {
        const canvas = await this.renderToCanvas(layoutInfo, options);
        const { format = 'image/jpeg', quality = 0.9 } = options;
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, format, quality);
        });
    }

    /**
     * Download file
     */
    async downloadImage(layoutInfo, filename = 'photo-booth', options = {}) {
        const blob = await this.exportToBlob(layoutInfo, options);
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.${options.format?.split('/')[1] || 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.loadedImages.clear();
        this.loadedFonts.clear();
    }

    /**
     * Destroy instance
     */
    destroy() {
        this.clearCache();
        this.canvas = null;
        this.ctx = null;
    }
}

// Export

export default PhotoBoothComposer
// Usage example:
/*
const composer = new PhotoBoothComposer();

const layoutInfo = {
    selectedPhotos: ['photo1.jpg', 'photo2.jpg'],
    printSettings: {
        paperSize: '4x6',
        layout: 'double', 
        background: 'white',
        style: 'modern',
        addBorder: true,
        addDate: true,
        addWatermark: false,
        photoPositions: {
            0: { x: 10, y: 5, scale: 1.2 },
            1: { x: -5, y: 10, scale: 0.9 }
        },
        textElements: [{
            id: 1,
            text: 'Chúc mừng năm mới!',
            x: 50,
            y: 80,
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ff0000',
            bold: true,
            italic: false,
            shadow: true
        }],
        imageElements: [{
            id: 1,
            src: 'decoration.png',
            x: 10,
            y: 10,
            width: 100,
            height: 100,
            opacity: 0.8,
            rotation: 15,
            shadow: false,
            rounded: true
        }]
    }
};

// Export to data URL
composer.exportToDataURL(layoutInfo, { 
    dpi: 300, 
    format: 'image/jpeg', 
    quality: 0.95 
}).then(dataURL => {
    console.log('Exported:', dataURL);
});

// Download image
composer.downloadImage(layoutInfo, 'my-photo-booth', {
    dpi: 300,
    format: 'image/png'
});

// Integrate with Vue component
export default {
    methods: {
        async exportPreview() {
            const composer = new PhotoBoothComposer();
            
            const layoutInfo = {
                selectedPhotos: this.selectedPhotos,
                printSettings: this.printSettings
            };
            
            try {
                await composer.downloadImage(layoutInfo, 'photo-booth-export', {
                    dpi: 300,
                    format: 'image/jpeg',
                    quality: 0.95
                });
            } catch (error) {
                console.error('Export failed:', error);
                alert('Có lỗi khi export ảnh!');
            } finally {
                composer.destroy();
            }
        }
    }
};
*/