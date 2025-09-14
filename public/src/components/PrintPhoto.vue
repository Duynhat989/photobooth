<template>
    <div class="print-photo">
        <div class="header">
            <button @click="goBack" class="back-btn">
                <ArrowLeft class="icon" />
                Quay lại
            </button>
            <h2>In ảnh Photo Booth</h2>
            <div class="photo-count">
                {{ selectedPhotos.length }} ảnh
            </div>
        </div>

        <div class="content">
            <div class="print-settings">
                <div class="settings-group">
                    <h3>Cài đặt in</h3>

                    <div class="setting-item">
                        <label>Kích thước giấy</label>
                        <select v-model="printSettings.paperSize" class="select-input">
                            <option value="2x6">2x6 inch(5x15 cm)</option>
                            <option value="4x6">4x6 inch (10x15 cm)</option>
                            <option value="4x3">4x3 inch (10x8 cm)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>Số bản in</label>
                        <div class="quantity-control">
                            <button @click="decreaseQuantity" class="qty-btn">
                                <Minus class="icon" />
                            </button>
                            <input v-model.number="printSettings.copies" type="number" min="1" max="10"
                                class="qty-input" />
                            <button @click="increaseQuantity" class="qty-btn">
                                <Plus class="icon" />
                            </button>
                        </div>
                    </div>
                </div>
                <div class="settings-group">
                    <h3>Ví trí ảnh</h3>
                    <div class="background-options">
                        <button v-for="(local, index) in localImages" :key="index"
                            :class="{ active: localImageChoose === local.value }" class="bg-btn"
                            @click="localImageChoose = local.value">
                            <span>{{ local.name }}</span>
                        </button>
                    </div>
                </div>
                <div class="settings-group">
                    <h3>Nền Photo Booth</h3>
                    <div class="background-options">
                        <button v-for="bg in backgroundOptions" :key="bg.value"
                            @click="printSettings.background = bg.value"
                            :class="{ active: printSettings.background === bg.value }" class="bg-btn"
                            :style="{ background: bg.preview }">
                            <span>{{ bg.label }}</span>
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>Style Photo Booth</h3>
                    <div class="style-options">
                        <button v-for="style in styleOptions" :key="style.value"
                            @click="printSettings.style = style.value"
                            :class="{ active: printSettings.style === style.value }" class="style-btn">
                            <div class="style-preview" :class="`style-${style.value}`"></div>
                            <span>{{ style.label }}</span>
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>Tùy chọn khác</h3>

                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="printSettings.addDate" class="checkbox-input" />
                            <span class="checkbox-custom"></span>
                            Thêm ngày tháng
                        </label>
                    </div>

                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="printSettings.addWatermark" class="checkbox-input" />
                            <span class="checkbox-custom"></span>
                            Thêm watermark
                        </label>
                    </div>

                    <div class="setting-item">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="printSettings.addBorder" class="checkbox-input" />
                            <span class="checkbox-custom"></span>
                            Thêm viền ảnh
                        </label>
                    </div>
                </div>
            </div>

            <div class="preview-area">
                <div class="preview-header">
                    <h3>Xem trước Photo Booth</h3>
                    <div class="preview-controls">
                        <button @click="zoomOut" :disabled="zoomLevel <= 0.5" class="zoom-btn">
                            <ZoomOut class="icon" />
                        </button>
                        <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                        <button @click="zoomIn" :disabled="zoomLevel >= 2" class="zoom-btn">
                            <ZoomIn class="icon" />
                        </button>
                    </div>
                </div>

                <div class="preview-container" ref="previewContainer" :class="[
                    `paper-${printSettings.paperSize}`
                ]">
                    <div class="photo-booth-preview" :style="{
                        transform: `scale(${zoomLevel})`,
                        width: printSettings.paperSize === '2x6' ? '400px' : printSettings.paperSize === '4x6' ? '800px' : '1600px',
                        alignContent: localImageChoose,
                        background: getBackgroundStyle,
                    }" :class="[
                        `layout-${printSettings.layout}`,
                        printSettings.addBorder ? 'with-border' : ''
                    ]">
                        <div v-for="(photo, index) in selectedPhotos" :key="index" class="photo-slot"
                            :class="`slot-${index + 1}`">
                            <img :src="photo" :alt="`Photo ${index + 1}`" />
                        </div>

                        <div v-if="printSettings.addDate" class="date-overlay">
                            {{ currentDate }}
                        </div>

                        <div v-if="printSettings.addWatermark" class="watermark-overlay">
                            Photo Booth
                        </div>
                    </div>
                </div>

                <div class="print-summary">
                    <div class="summary-item">
                        <FileImage class="icon" />
                        <span>{{ selectedPhotos.length }} ảnh</span>
                    </div>
                    <div class="summary-item">
                        <Copy class="icon" />
                        <span>{{ printSettings.copies }} bản</span>
                    </div>
                    <div class="summary-item">
                        <Layout class="icon" />
                        <span>{{ getCurrentLayout?.label }}</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div class="cost-estimate">
                <span class="cost-label">Ước tính chi phí:</span>
                <span class="cost-value">{{ formatCurrency(estimatedCost) }}</span>
            </div>

            <div class="action-buttons">
                <button @click="saveSettings" class="secondary-btn">
                    <Save class="icon" />
                    Lưu cài đặt
                </button>

                <button @click="exportPhotos" class="secondary-btn">
                    <Download class="icon" />
                    Tải về
                </button>

                <button @click="startPrinting" :disabled="isPrinting || selectedPhotos.length === 0"
                    class="primary-btn">
                    <component :is="isPrinting ? Loader2 : Printer" class="icon" :class="{ spinning: isPrinting }" />
                    {{ isPrinting ? 'Đang in...' : 'Bắt đầu in' }}
                </button>
            </div>
        </div>

        <!-- Print Progress Modal -->
        <div v-if="showPrintProgress" class="modal-overlay">
            <div class="progress-modal">
                <div class="modal-header">
                    <h3>Đang in Photo Booth</h3>
                </div>

                <div class="modal-body">
                    <div class="progress-info">
                        <div class="progress-bar">
                            <div class="progress-fill" :style="{ width: printProgress + '%' }"></div>
                        </div>
                        <p>{{ Math.round(printProgress) }}% hoàn thành</p>
                        <p class="current-task">{{ currentPrintTask }}</p>
                    </div>
                </div>

                <div class="modal-footer">
                    <button @click="cancelPrinting" class="cancel-btn">
                        <X class="icon" />
                        Hủy in
                    </button>
                </div>
            </div>
        </div>

        <!-- Success Modal -->
        <div v-if="showSuccess" class="modal-overlay">
            <div class="success-modal">
                <div class="success-content">
                    <CheckCircle class="success-icon" />
                    <h3>In Photo Booth thành công!</h3>
                    <p>{{ printSettings.copies }} bản đã được in thành công</p>

                    <div class="action-buttons">
                        <button @click="printMore" class="secondary-btn">
                            In thêm
                        </button>
                        <button @click="finishPrinting" class="primary-btn">
                            Hoàn tất
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import {
    ArrowLeft,
    Minus,
    Plus,
    ZoomOut,
    ZoomIn,
    FileImage,
    Copy,
    Printer,
    Save,
    Download,
    Loader2,
    X,
    CheckCircle,
    Layout,
    Camera
} from 'lucide-vue-next'

// Props
const props = defineProps({
    selectedPhotos: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits(['back', 'done'])

// Refs
const previewContainer = ref(null)

// Reactive data
const printSettings = ref({
    paperSize: '2x6',
    copies: 1,
    layout: 'single',
    background: 'white',
    style: 'classic',
    addDate: false,
    addWatermark: false,
    addBorder: true
})

const zoomLevel = ref(0.5)
const isPrinting = ref(false)
const showPrintProgress = ref(false)
const showSuccess = ref(false)
const printProgress = ref(0)
const currentPrintTask = ref('')



const localImages = ref([
    {
        name: "Trên",
        value: 'start'
    },
    {
        name: "Giữa",
        value: 'center'
    },
    {
        name: "Dưới",
        value: 'end'
    }
])

const localImageChoose = ref('start')
// Layout options based on photo count
const layoutOptions = ref([
    {
        value: 'single',
        label: '1 ảnh',
        photoCount: 1,
        minPhotos: 1,
        maxPhotos: 1
    },
    {
        value: 'double',
        label: '2 ảnh',
        photoCount: 2,
        minPhotos: 1,
        maxPhotos: 2
    },
    {
        value: 'triple',
        label: '3 ảnh',
        photoCount: 3,
        minPhotos: 1,
        maxPhotos: 3
    },
    {
        value: 'quad',
        label: '4 ảnh',
        photoCount: 4,
        minPhotos: 1,
        maxPhotos: 4
    },
    {
        value: 'six',
        label: '6 ảnh',
        photoCount: 6,
        minPhotos: 1,
        maxPhotos: 6
    },
    {
        value: 'eight',
        label: '8 ảnh',
        photoCount: 8,
        minPhotos: 1,
        maxPhotos: 8
    }
])

// Background options
const backgroundOptions = ref([
    {
        value: 'white',
        label: 'Trắng',
        preview: '#ffffff'
    },
    {
        value: 'black',
        label: 'Đen',
        preview: '#000000'
    },
    {
        value: 'gradient-blue',
        label: 'Gradient Xanh',
        preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    },
    {
        value: 'gradient-pink',
        label: 'Gradient Hồng',
        preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
    },
    {
        value: 'gradient-gold',
        label: 'Gradient Vàng',
        preview: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
    },
    {
        value: 'pattern-dots',
        label: 'Chấm bi',
        preview: '#f0f0f0'
    },
    {
        value: 'pattern-stripes',
        label: 'Sọc',
        preview: 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)'
    }
])

// Style options
const styleOptions = ref([
    {
        value: 'classic',
        label: 'Cổ điển'
    },
    {
        value: 'modern',
        label: 'Hiện đại'
    },
    {
        value: 'vintage',
        label: 'Vintage'
    },
    {
        value: 'polaroid',
        label: 'Polaroid'
    },
    {
        value: 'film-strip',
        label: 'Film Strip'
    }
])

// Computed properties
const currentDate = computed(() => {
    return new Date().toLocaleDateString('vi-VN')
})

const getCurrentLayout = computed(() => {
    return layoutOptions.value.find(layout => layout.value === printSettings.value.layout)
})

const getBackgroundStyle = computed(() => {
    const bg = printSettings.value.background

    switch (bg) {
        case 'white':
            return '#ffffff'
        case 'black':
            return '#000000'
        case 'gradient-blue':
            return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        case 'gradient-pink':
            return 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        case 'gradient-gold':
            return 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
        case 'pattern-dots':
            return `radial-gradient(circle, #333 2px, transparent 2px), #f0f0f0`
        case 'pattern-stripes':
            return 'repeating-linear-gradient(45deg, #f0f0f0, #f0f0f0 10px, #e0e0e0 10px, #e0e0e0 20px)'
        default:
            return '#ffffff'
    }
})

const estimatedCost = computed(() => {
    const baseCost = 5000 // 5000 VND per photo booth print
    const qualityMultiplier = {
        'draft': 0.8,
        'normal': 1.0,
        'high': 1.5
    }
    return printSettings.value.copies * baseCost * qualityMultiplier[printSettings.value.quality]
})

// Methods
const decreaseQuantity = () => {
    if (printSettings.value.copies > 1) {
        printSettings.value.copies--
    }
}

const increaseQuantity = () => {
    if (printSettings.value.copies < 10) {
        printSettings.value.copies++
    }
}

const zoomIn = () => {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.25)
}

const zoomOut = () => {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
}

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount)
}

const saveSettings = () => {
    localStorage.setItem('photoBoothPrintSettings', JSON.stringify(printSettings.value))
    alert('Cài đặt đã được lưu!')
}

const exportPhotos = () => {
    // Export photo booth as image
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Set canvas size based on paper size
    canvas.width = 1200
    canvas.height = 1800

    // Draw background
    ctx.fillStyle = getBackgroundStyle.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // This would require more complex implementation to actually render the photos
    // For now, just trigger download of individual photos
    props.selectedPhotos.forEach((photo, index) => {
        const link = document.createElement('a')
        link.href = photo
        link.download = `photo-booth-${index + 1}.jpg`
        link.click()
    })
}

const startPrinting = async () => {
    if (props.selectedPhotos.length === 0) {
        alert('Vui lòng chọn ít nhất một ảnh để in!')
        return
    }

    isPrinting.value = true
    showPrintProgress.value = true
    printProgress.value = 0

    // Simulate printing process
    const steps = [
        'Chuẩn bị layout...',
        'Xử lý ảnh...',
        'Áp dụng nền...',
        'Thêm hiệu ứng...',
        'Đang in...'
    ]

    for (let i = 0; i < steps.length; i++) {
        currentPrintTask.value = steps[i]
        await delay(1500)
        printProgress.value = ((i + 1) / steps.length) * 100
    }

    isPrinting.value = false
    showPrintProgress.value = false
    showSuccess.value = true
}

const cancelPrinting = () => {
    isPrinting.value = false
    showPrintProgress.value = false
    printProgress.value = 0
}

const printMore = () => {
    showSuccess.value = false
    emit('back')
}

const finishPrinting = () => {
    showSuccess.value = false
    emit('done')
}

const delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const goBack = () => {
    emit('back')
}
watch(printSettings, (newValu) => {
    if (props.selectedPhotos.length > 4 && printSettings.value.paperSize == '2x6') {
        alert("Vui lòng chọn ít ảnh hơn")
        printSettings.value.paperSize = '4x6'
    }
}, { deep: true })
// Lifecycle
onMounted(() => {
    // Load saved settings if available
    const savedSettings = localStorage.getItem('photoBoothPrintSettings')
    if (savedSettings) {
        printSettings.value = { ...printSettings.value, ...JSON.parse(savedSettings) }
    }

    // Auto-select appropriate layout based on photo count
    const photoCount = props.selectedPhotos.length
    if (photoCount > 0) {
        const appropriateLayout = layoutOptions.value.find(layout =>
            layout.photoCount >= photoCount
        )
        console.log(appropriateLayout)
        if (appropriateLayout) {
            printSettings.value.layout = appropriateLayout.value
        }
        if (photoCount > 4) {
            printSettings.value.paperSize = '4x6'
        }
    } else {
        // Nếu không có ảnh, mặc định chọn layout single
        printSettings.value.layout = 'single'
    }
})
</script>

<style scoped>
.print-photo {
    height: 100vh;
    background: white;
    display: flex;
    flex-direction: column;
}

.header {
    background: #1e40af;
    color: white;
    padding: 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.back-btn {
    background: none;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: background-color 0.2s;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
}

.photo-count {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
}

.content {
    flex: 1;
    display: flex;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
}

.print-settings {
    width: 350px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-y: auto;
}

.settings-group {
    margin-bottom: 2rem;
}

.settings-group:last-child {
    margin-bottom: 0;
}

.settings-group h3 {
    color: #1e40af;
    font-size: 1.1rem;
    margin-bottom: 1rem;
    font-weight: 600;
}

.setting-item {
    margin-bottom: 1rem;
}

.setting-item:last-child {
    margin-bottom: 0;
}

.setting-item label {
    display: block;
    color: #374151;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.select-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    background: white;
    font-size: 0.9rem;
}

.select-input:focus {
    outline: none;
    border-color: #1e40af;
}

.quantity-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.qty-btn {
    background: #1e40af;
    color: white;
    border: none;
    border-radius: 6px;
    width: 36px;
    height: 36px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.qty-btn:hover {
    background: #1d4ed8;
}

.qty-input {
    width: 60px;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    text-align: center;
    font-weight: 600;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
}

.checkbox-input {
    display: none;
}

.checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-radius: 4px;
    position: relative;
    transition: all 0.2s;
}

.checkbox-input:checked+.checkbox-custom {
    background: #1e40af;
    border-color: #1e40af;
}

.checkbox-input:checked+.checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 12px;
}

.layout-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.layout-btn {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.layout-btn:hover {
    border-color: #1e40af;
}

.layout-btn.active {
    border-color: #1e40af;
    background: #eff6ff;
}

.layout-preview {
    width: 40px;
    height: 30px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    position: relative;
    background: white;
    display: flex;
    flex-wrap: wrap;
    padding: 2px;
    gap: 1px;
}

.layout-photo-slot {
    background: #f3f4f6;
    border-radius: 2px;
    flex: 1;
    min-height: 6px;
}

.preview-single .layout-photo-slot {
    width: 100%;
    height: 100%;
}

.preview-double .layout-photo-slot {
    width: calc(50% - 0.5px);
    height: 100%;
}

.preview-triple .layout-photo-slot {
    width: calc(33.33% - 1px);
    height: 100%;
}

.preview-quad .layout-photo-slot {
    width: calc(50% - 0.5px);
    height: calc(50% - 0.5px);
}

.preview-six .layout-photo-slot {
    width: calc(33.33% - 1px);
    height: calc(50% - 0.5px);
}

.preview-eight .layout-photo-slot {
    width: calc(25% - 1px);
    height: calc(50% - 0.5px);
}

.background-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.bg-btn {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 60px;
    position: relative;
    overflow: hidden;
}

.bg-btn:hover {
    border-color: #1e40af;
}

.bg-btn.active {
    border-color: #1e40af;
    box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.1);
}

.bg-btn span {
    background: rgba(255, 255, 255, 0.9);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #374151;
    backdrop-filter: blur(4px);
}

.style-options {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
}

.style-btn {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    text-align: center;
}

.style-btn:hover {
    border-color: #1e40af;
}

.style-btn.active {
    border-color: #1e40af;
    background: #eff6ff;
}

.style-preview {
    width: 30px;
    height: 20px;
    border-radius: 4px;
    position: relative;
}

.style-classic {
    background: linear-gradient(to bottom, #f8fafc, #e2e8f0);
    border: 1px solid #cbd5e1;
}

.style-modern {
    background: linear-gradient(135deg, #667eea, #764ba2);
}

.style-vintage {
    background: linear-gradient(to bottom, #f7e6a3, #d4a574);
    filter: sepia(0.3);
}

.style-polaroid {
    background: white;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.style-film-strip {
    background: #1a1a1a;
    border-left: 3px solid #333;
    border-right: 3px solid #333;
}

.preview-area {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.preview-header h3 {
    color: #1e40af;
    font-size: 1.1rem;
}

.preview-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.zoom-btn {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.zoom-btn:hover:not(:disabled) {
    border-color: #1e40af;
}

.zoom-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.zoom-level {
    font-weight: 600;
    color: #374151;
}

.preview-container {
    flex: 1;
    background: #f8fafc;
    border-radius: 12px;
    padding: 2rem;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

.photo-booth-preview {
    height: 1200px;
    border-radius: 12px;
    position: relative;
    transform-origin: center;
    transition: transform 0.3s ease;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    padding: 5px;
    display: grid;
    gap: 5px;
    padding-bottom: 100px;
}

.paper-2x6 .photo-booth-preview {
    display: block;
}

/* Layout styles */
.paper-4x6 .layout-single {
    grid-template-columns: auto;
    grid-auto-rows: auto;
    align-content: center;
}

.paper-4x6 .layout-double {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr 1fr;
}

.paper-4x6 .layout-triple {
    grid-template-columns: auto auto;
    grid-auto-rows: auto;
    align-content: start;
}

.paper-4x6 .layout-triple .photo-slot:first-child {
    grid-column: 1 / -1;
    grid-row: 1;
}

.paper-4x6 .layout-quad {
    grid-template-columns: auto auto;
    grid-auto-rows: auto;
    align-content: center;
    /* gom nội dung lên trên */
}

.layout-six {
    grid-template-columns: auto auto;
    grid-auto-rows: auto;
    padding: 40px 5px;
    align-content: start;
}

.layout-six .photo-slot {}

.layout-eight {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr 1fr 1fr;
}

/* ban 2x6 */



.photo-slot {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
}

.photo-slot img {
    width: 100%;
    height: auto;
    object-fit: contain;
}

.empty-slot {
    border: 2px dashed #d1d5db;
    background: #fafafa;
}

.empty-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #9ca3af;
    font-size: 0.8rem;
}

.empty-placeholder .icon {
    width: 24px;
    height: 24px;
}

/* Style variations */
.style-classic .photo-slot {
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.style-modern .photo-slot {
    border-radius: 12px;
    border: none;
}

.style-vintage .photo-slot {
    border: 5px solid #f7e6a3;
    border-radius: 4px;
    filter: sepia(0.2) contrast(1.1);
}

.style-polaroid .photo-slot {
    border: 15px solid white;
    border-bottom: 25px solid white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    border-radius: 0;
}

.style-film-strip {
    background: #1a1a1a !important;
    border-left: 15px solid #333;
    border-right: 15px solid #333;
}

.style-film-strip .photo-slot {
    border: 2px solid #666;
    border-radius: 0;
}

.style-film-strip .photo-slot::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 50%;
    width: 6px;
    height: 6px;
    background: #333;
    border-radius: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.style-film-strip .photo-slot::after {
    content: '';
    position: absolute;
    right: -10px;
    top: 50%;
    width: 6px;
    height: 6px;
    background: #333;
    border-radius: 50%;
    transform: translateY(-50%);
    z-index: 10;
}

.with-border .photo-slot {
    border-width: 3px !important;
    border-style: solid !important;
    border-color: white !important;
}

.date-overlay {
    position: absolute;
    bottom: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
}

.watermark-overlay {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: #374151;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    backdrop-filter: blur(4px);
}

/* Background pattern styles */
.photo-booth-preview[style*="radial-gradient"] {
    background-size: 20px 20px !important;
    background-position: 0 0, 10px 10px !important;
}

.print-summary {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;
    padding: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #374151;
    font-weight: 500;
}

.footer {
    background: #f8fafc;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e5e7eb;
}

.cost-estimate {
    display: flex;
    flex-direction: column;
}

.cost-label {
    color: #6b7280;
    font-size: 0.9rem;
}

.cost-value {
    color: #1e40af;
    font-weight: bold;
    font-size: 1.2rem;
}

.action-buttons {
    display: flex;
    gap: 1rem;
}

.secondary-btn,
.primary-btn {
    padding: 1rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
    border: none;
}

.secondary-btn {
    background: white;
    border: 1px solid #e5e7eb;
    color: #374151;
}

.secondary-btn:hover {
    background: #f9fafb;
    border-color: #1e40af;
}

.primary-btn {
    background: #1e40af;
    color: white;
    font-weight: 600;
}

.primary-btn:hover:not(:disabled) {
    background: #1d4ed8;
}

.primary-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.spinning {
    animation: spin 1s linear infinite;
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.progress-modal,
.success-modal {
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow: auto;
}

.modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
    text-align: center;
}

.modal-body {
    padding: 1.5rem;
}

.progress-info {
    text-align: center;
    margin-bottom: 2rem;
}

.progress-bar {
    width: 100%;
    height: 12px;
    background: #e5e7eb;
    border-radius: 6px;
    overflow: hidden;
    margin-bottom: 1rem;
}

.progress-fill {
    height: 100%;
    background: #1e40af;
    transition: width 0.3s ease;
}

.current-task {
    color: #1e40af;
    font-weight: 600;
    margin-top: 0.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: center;
}

.cancel-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
}

.cancel-btn:hover {
    background: #dc2626;
}

.success-modal {
    max-width: 400px;
}

.success-content {
    padding: 2rem;
    text-align: center;
}

.success-icon {
    width: 64px;
    height: 64px;
    color: #16a34a;
    margin: 0 auto 1rem;
}

.success-content h3 {
    color: #16a34a;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.success-content p {
    color: #6b7280;
    margin-bottom: 2rem;
}

.success-content .action-buttons {
    justify-content: center;
}

.icon {
    width: 20px;
    height: 20px;
}

@media (max-width: 768px) {
    .content {
        flex-direction: column;
    }

    .print-settings {
        width: 100%;
    }

    .settings-group {
        margin-bottom: 1rem;
    }

    .layout-options,
    .background-options,
    .style-options {
        grid-template-columns: repeat(3, 1fr);
    }

    .photo-booth-preview {
        width: 300px;
        height: 450px;
        padding: 15px;
    }

    .preview-container {
        min-height: 300px;
    }

    .print-summary {
        flex-direction: column;
        gap: 0.5rem;
    }

    .footer {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
    }

    .action-buttons {
        flex-direction: column;
    }

    .progress-modal,
    .success-modal {
        margin: 1rem;
        width: calc(100% - 2rem);
    }
}

@media (max-width: 480px) {

    .layout-options,
    .background-options,
    .style-options {
        grid-template-columns: repeat(2, 1fr);
    }

    .photo-booth-preview {
        width: 250px;
        height: 375px;
        padding: 10px;
    }

    .bg-btn,
    .style-btn,
    .layout-btn {
        padding: 0.75rem;
        font-size: 0.8rem;
    }

    .summary-item {
        font-size: 0.9rem;
    }
}
</style>>