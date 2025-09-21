/**
 * HTMLExporter - Export preview HTML thành file HTML hoặc PDF
 * Lấy nguyên DOM element của preview và export
 */
class HTMLExporter {
    constructor() {
        this.loadedLibraries = new Set();
    }

    /**
     * Load html2canvas library
     */
    async loadHtml2Canvas() {
        if (this.loadedLibraries.has('html2canvas')) {
            return window.html2canvas;
        }

        return new Promise((resolve, reject) => {
            if (window.html2canvas) {
                this.loadedLibraries.add('html2canvas');
                resolve(window.html2canvas);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = () => {
                this.loadedLibraries.add('html2canvas');
                resolve(window.html2canvas);
            };
            script.onerror = () => reject(new Error('Không thể load html2canvas'));
            document.head.appendChild(script);
        });
    }

    /**
     * Load jsPDF library
     */
    async loadJsPDF() {
        if (this.loadedLibraries.has('jspdf')) {
            return window.jspdf;
        }

        return new Promise((resolve, reject) => {
            if (window.jspdf) {
                this.loadedLibraries.add('jspdf');
                resolve(window.jspdf);
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            script.onload = () => {
                this.loadedLibraries.add('jspdf');
                resolve(window.jspdf);
            };
            script.onerror = () => reject(new Error('Không thể load jsPDF'));
            document.head.appendChild(script);
        });
    }

    /**
     * Lấy HTML content từ preview element
     */
    getPreviewHTML(previewElement, options = {}) {
        const { includeStyles = true, cleanUp = true } = options;

        if (!previewElement) {
            throw new Error('Preview element không tồn tại');
        }

        // Clone element để không ảnh hưởng bản gốc
        const clonedElement = previewElement.cloneNode(true);

        if (cleanUp) {
            // Remove các elements không cần thiết
            const deleteButtons = clonedElement.querySelectorAll('.element-delete-btn');
            deleteButtons.forEach(btn => btn.remove());

            const resizeHandles = clonedElement.querySelectorAll('.resize-handles');
            resizeHandles.forEach(handle => handle.remove());

            // Remove hover effects
            clonedElement.classList.remove('hover');
            const hoverElements = clonedElement.querySelectorAll(':hover');
            hoverElements.forEach(el => el.classList.remove('hover'));
        }

        let htmlContent = clonedElement.outerHTML;

        if (includeStyles) {
            // Lấy tất cả CSS styles
            const styles = this.extractStyles(previewElement);
            htmlContent = `
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Photo Booth Preview</title>
                    <style>
                        ${styles}
                        
                        /* Additional print styles */
                        @media print {
                            body { margin: 0; padding: 20px; }
                            .photo-booth-preview { 
                                box-shadow: none !important; 
                                page-break-inside: avoid;
                            }
                        }
                        
                        /* Hide UI elements */
                        .element-delete-btn,
                        .resize-handles {
                            display: none !important;
                        }
                        .photo-booth-preview{
                            transform: scale(1) !important;
                            margin-top: 0 !important;
                        }
                    </style>
                </head>
                <body>
                    <div class="export-container">
                        ${clonedElement.outerHTML}
                    </div>
                </body>
                </html>`;
        }

        return htmlContent;
    }

    /**
     * Extract tất cả CSS styles liên quan
     */
    extractStyles(element) {
        const styles = [];

        // Lấy tất cả stylesheets
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                Array.from(sheet.cssRules || []).forEach(rule => {
                    if (rule.type === CSSRule.STYLE_RULE) {
                        // Kiểm tra nếu rule áp dụng cho element hoặc children
                        try {
                            if (element.querySelector(rule.selectorText) ||
                                element.matches?.(rule.selectorText)) {
                                styles.push(rule.cssText);
                            }
                        } catch (e) {
                            // Ignore invalid selectors
                        }
                    }
                });
            } catch (e) {
                // Ignore CORS errors
            }
        });

        // Thêm computed styles cho element chính
        const computedStyle = window.getComputedStyle(element);
        const importantStyles = [
            'width', 'height', 'background', 'border', 'border-radius',
            'padding', 'margin', 'display', 'grid-template-columns',
            'grid-template-rows', 'gap', 'align-items', 'justify-content'
        ];

        const elementStyles = importantStyles
            .map(prop => `${prop}: ${computedStyle.getPropertyValue(prop)}`)
            .join('; ');

        styles.push(`.photo-booth-preview { ${elementStyles} }`);

        return styles.join('\n');
    }

    /**
     * Export thành HTML file
     */
    exportToHTML(previewElement, filename = 'photo-booth-preview.html', options = {}, is_download = false) {
        try {
            let htmlContent = this.getPreviewHTML(previewElement, options);

            // Thêm link CSS nếu có
            if (options.cssLinks && Array.isArray(options.cssLinks)) {
                const cssLinksHTML = options.cssLinks
                    .map(href => `<link rel="stylesheet" href="${href}">`)
                    .join('\n');
                htmlContent = htmlContent.replace(
                    /<\/head>/i,
                    `${cssLinksHTML}\n</head>`
                );
            }
            if (is_download) {
                const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                URL.revokeObjectURL(url);
            }

            return htmlContent;
        } catch (error) {
            console.error('Lỗi khi export HTML:', error);
            throw error;
        }
    }


    /**
     * Export thành PNG/JPEG với html2canvas
     */
    async exportToImage(previewElement, options = {}) {
        const {
            filename = 'photo-booth-preview.png',
            format = 'png',
            quality = 1.0,
            scale = 2,
            width = null,
            height = null
        } = options;

        try {
            const html2canvas = await this.loadHtml2Canvas();

            // Tạm ẩn các UI elements
            const deleteButtons = previewElement.querySelectorAll('.element-delete-btn');
            const resizeHandles = previewElement.querySelectorAll('.resize-handles');

            deleteButtons.forEach(btn => btn.style.display = 'none');
            resizeHandles.forEach(handle => handle.style.display = 'none');

            const canvas = await html2canvas(previewElement, {
                scale: scale,
                useCORS: true,
                allowTaint: true,
                backgroundColor: null,
                width: width,
                height: height,
                logging: false
            });

            // Khôi phục UI elements
            deleteButtons.forEach(btn => btn.style.display = '');
            resizeHandles.forEach(handle => handle.style.display = '');

            // Convert to blob and download
            return new Promise(resolve => {
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);

                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    URL.revokeObjectURL(url);
                    resolve(canvas.toDataURL(`image/${format}`, quality));
                }, `image/${format}`, quality);
            });

        } catch (error) {
            console.error('Lỗi khi export image:', error);
            throw error;
        }
    }

    /**
     * Export thành PDF
     */
    async exportToPDF(previewElement, options = {}) {
        const {
            filename = 'photo-booth-preview.pdf',
            format = 'a4',
            orientation = 'portrait',
            quality = 1.0,
            margin = 10
        } = options;

        try {
            const [html2canvas, jsPDF] = await Promise.all([
                this.loadHtml2Canvas(),
                this.loadJsPDF()
            ]);

            // Capture element as canvas
            const canvas = await html2canvas(previewElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff'
            });

            // Create PDF
            const { jsPDF: PDF } = jsPDF;
            const pdf = new PDF(orientation, 'mm', format);

            const imgData = canvas.toDataURL('image/jpeg', quality);

            // Calculate dimensions
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pageWidth - (margin * 2);
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let yPosition = margin;

            // Add image to PDF
            if (imgHeight <= pageHeight - (margin * 2)) {
                // Fits on one page
                pdf.addImage(imgData, 'JPEG', margin, yPosition, imgWidth, imgHeight);
            } else {
                // Multiple pages needed
                let remainingHeight = imgHeight;
                let sourceY = 0;

                while (remainingHeight > 0) {
                    const pageImgHeight = Math.min(remainingHeight, pageHeight - (margin * 2));
                    const sourceHeight = (pageImgHeight / imgHeight) * canvas.height;

                    // Create cropped canvas
                    const croppedCanvas = document.createElement('canvas');
                    const croppedCtx = croppedCanvas.getContext('2d');
                    croppedCanvas.width = canvas.width;
                    croppedCanvas.height = sourceHeight;

                    croppedCtx.drawImage(
                        canvas,
                        0, sourceY, canvas.width, sourceHeight,
                        0, 0, canvas.width, sourceHeight
                    );

                    const croppedImgData = croppedCanvas.toDataURL('image/jpeg', quality);
                    pdf.addImage(croppedImgData, 'JPEG', margin, margin, imgWidth, pageImgHeight);

                    remainingHeight -= pageImgHeight;
                    sourceY += sourceHeight;

                    if (remainingHeight > 0) {
                        pdf.addPage();
                    }
                }
            }

            // Save PDF
            pdf.save(filename);

            return pdf;

        } catch (error) {
            console.error('Lỗi khi export PDF:', error);
            throw error;
        }
    }

    /**
     * Print trực tiếp
     */
    async printPreview(previewElement, options = {}) {
        const {
            removeUIElements = true,
            addPrintStyles = true
        } = options;

        try {
            const htmlContent = this.getPreviewHTML(previewElement, {
                includeStyles: true,
                cleanUp: removeUIElements
            });

            // Mở window mới để print
            const printWindow = window.open('', '_blank');

            printWindow.document.write(htmlContent);

            if (addPrintStyles) {
                const printStyles = `
                    <style>
                        @media print {
                            body { 
                                margin: 0 !important; 
                                padding: 0 !important; 
                                background: white !important;
                            }
                            .photo-booth-preview { 
                                box-shadow: none !important;
                                border: none !important;
                                margin: 0 !important;
                                width: 100% !important;
                                height: auto !important;
                            }
                            .element-delete-btn,
                            .resize-handles,
                            .resize-handle {
                                display: none !important;
                            }
                        }
                    </style>
                `;
                printWindow.document.head.insertAdjacentHTML('beforeend', printStyles);
            }

            printWindow.document.close();

            // Wait for content to load then print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 500);
            };

        } catch (error) {
            console.error('Lỗi khi print:', error);
            throw error;
        }
    }
}
export default HTMLExporter
// Usage examples:
/*
// Trong Vue component (PhotoPreview.vue)
const exporter = new HTMLExporter();

// 1. Export HTML file
const exportHTML = () => {
    const previewEl = document.querySelector('.photo-booth-preview');
    exporter.exportToHTML(previewEl, 'my-photo-booth.html');
};

// 2. Export PNG image với html2canvas
const exportImage = async () => {
    const previewEl = document.querySelector('.photo-booth-preview');
    await exporter.exportToImage(previewEl, {
        filename: 'photo-booth.png',
        format: 'png',
        scale: 3, // High DPI
        quality: 1.0
    });
};

// 3. Export PDF
const exportPDF = async () => {
    const previewEl = document.querySelector('.photo-booth-preview');
    await exporter.exportToPDF(previewEl, {
        filename: 'photo-booth.pdf',
        format: 'a4',
        orientation: 'portrait',
        quality: 0.9
    });
};

// 4. Print trực tiếp
const printPreview = async () => {
    const previewEl = document.querySelector('.photo-booth-preview');
    await exporter.printPreview(previewEl);
};

// 5. Thêm vào methods trong Vue component
export default {
    methods: {
        async exportPreviewHTML() {
            const exporter = new HTMLExporter();
            const previewEl = this.$refs.previewContainer?.querySelector('.photo-booth-preview');
            
            if (!previewEl) {
                alert('Không tìm thấy preview element');
                return;
            }
            
            try {
                exporter.exportToHTML(previewEl, 'photo-booth-preview.html');
            } catch (error) {
                console.error('Export failed:', error);
                alert('Có lỗi khi export HTML!');
            }
        },
        
        async exportPreviewImage() {
            const exporter = new HTMLExporter();
            const previewEl = this.$refs.previewContainer?.querySelector('.photo-booth-preview');
            
            if (!previewEl) {
                alert('Không tìm thấy preview element');
                return;
            }
            
            try {
                await exporter.exportToImage(previewEl, {
                    filename: 'photo-booth.png',
                    scale: 3,
                    quality: 1.0
                });
            } catch (error) {
                console.error('Export failed:', error);
                alert('Có lỗi khi export image!');
            }
        }
    }
};
*/