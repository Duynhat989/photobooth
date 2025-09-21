<template>
    <div class="preview-area">
        <div class="preview-header">
            <h3>Xem trước Photo Booth</h3>
            <div class="preview-controls">
                <button @click="zoomOut" :disabled="zoomLevel <= 0.25" class="zoom-btn">
                    <ZoomOut class="icon" />
                </button>
                <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
                <button @click="zoomIn" :disabled="zoomLevel >= 2" class="zoom-btn">
                    <ZoomIn class="icon" />
                </button>
                <button @click.stop="addTextElement" class="add-text-btn">
                    <Type class="icon" />
                    Thêm text
                </button>
                <button @click="addImageElement" class="add-image-btn">
                    <ImageIcon class="icon" />
                    Thêm hình
                </button>
                <button @click="exportPreviewHTML" class="add-preview-btn">
                    <Printer class="icon" />
                    Preview HTML
                </button>
            </div>
        </div>

        <div class="preview-container" ref="previewContainer" :class="[`paper-${printSettings.paperSize}`]"
            @click="handleContainerClick">
            <div class="photo-booth-preview" :style="{
                transform: `scale(${zoomLevel})`,
                width: getPreviewWidth,
                height: getPreviewHeight,
                background: getBackgroundStyle,
                marginTop: `${zoomLevel*100 - 45}rem`,
                alignContent: printSettings.imagePosition || 'start'
            }" :class="[
                `layout-${printSettings.layout}`,
                printSettings.addBorder ? 'with-border' : '',
                `style-${printSettings.style}`
            ]">

                <!-- Photo slots -->
                <div v-for="(photo, index) in displayPhotos" :key="`photo-${index}`" class="photo-slot"
                    :class="`slot-${index + 1}`" @mousedown="startPhotoDrag($event, index)"
                    :style="getPhotoStyle(index)">
                    <img v-if="photo" :src="photo" :alt="`Photo ${index + 1}`" draggable="false" />
                    <div v-else class="empty-slot">
                        <div class="empty-placeholder">
                            <Camera class="icon" />
                            <span>Trống</span>
                        </div>
                    </div>
                </div>

                <!-- Text elements -->
                <div v-for="textElement in printSettings.textElements || []" :key="textElement.id" class="text-element"
                    :style="getTextStyle(textElement)" @mousedown="startTextDrag($event, textElement.id)"
                    @dblclick="editText(textElement.id)">
                    {{ textElement.text }}
                    <button @mousedown.stop.prevent @click.stop="deleteTextElement(textElement.id)"
                        class="element-delete-btn">
                        <X class="icon" />
                    </button>
                </div>

                <!-- Image elements -->
                <div v-for="imageElement in printSettings.imageElements || []" :key="imageElement.id"
                    class="image-element" :style="getImageStyle(imageElement)"
                    @mousedown="startImageDrag($event, imageElement.id)" @dblclick="editImage(imageElement.id)">
                    <img :src="imageElement.src" :alt="imageElement.alt || 'Custom image'" draggable="false" />
                    <div class="resize-handles">
                        <div class="resize-handle nw" @mousedown="startResize($event, imageElement.id, 'nw')"></div>
                        <div class="resize-handle ne" @mousedown="startResize($event, imageElement.id, 'ne')"></div>
                        <div class="resize-handle sw" @mousedown="startResize($event, imageElement.id, 'sw')"></div>
                        <div class="resize-handle se" @mousedown="startResize($event, imageElement.id, 'se')"></div>
                    </div>
                    <button @mousedown.stop.prevent @click.stop="deleteImageElement(imageElement.id)"
                        class="element-delete-btn">
                        <X class="icon" />
                    </button>
                </div>

                <!-- System overlays -->
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
                <span>{{ getCurrentLayout?.label || 'Không xác định' }}</span>
            </div>
        </div>

        <!-- Text Edit Modal -->
        <div v-if="showTextModal" class="modal-overlay" @click="closeTextModal">
            <div class="text-modal" @click.stop>
                <div class="modal-header">
                    <h3>{{ editingText ? 'Chỉnh sửa text' : 'Thêm text mới' }}</h3>
                    <button @click="closeTextModal" class="close-btn">
                        <X class="icon" />
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Nội dung text</label>
                        <input v-model="textForm.text" type="text" placeholder="Nhập text..." class="text-input"
                            @keyup.enter="saveText" />
                    </div>
                    <div class="form-group">
                        <label>Font chữ</label>
                        <select v-model="textForm.fontFamily" class="select-input">
                            <optgroup label="Sans Serif - Hiện đại">
                                <option value="Arial">Arial</option>
                                <option value="Helvetica">Helvetica</option>
                                <option value="Verdana">Verdana</option>
                                <option value="Trebuchet MS">Trebuchet MS</option>
                                <option value="'Segoe UI', sans-serif">Segoe UI</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Lato', sans-serif">Lato</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                            </optgroup>
                            <optgroup label="Serif - Cổ điển">
                                <option value="Times New Roman">Times New Roman</option>
                                <option value="Georgia">Georgia</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Merriweather', serif">Merriweather</option>
                                <option value="'Crimson Text', serif">Crimson Text</option>
                                <option value="'Libre Baskerville', serif">Libre Baskerville</option>
                            </optgroup>
                            <optgroup label="Display - Trang trí">
                                <option value="Impact">Impact</option>
                                <option value="'Oswald', sans-serif">Oswald</option>
                                <option value="'Anton', sans-serif">Anton</option>
                                <option value="'Bebas Neue', sans-serif">Bebas Neue</option>
                                <option value="'Righteous', sans-serif">Righteous</option>
                                <option value="'Fredoka One', sans-serif">Fredoka One</option>
                            </optgroup>
                            <optgroup label="Script - Viết tay">
                                <option value="'Dancing Script', cursive">Dancing Script</option>
                                <option value="'Pacifico', cursive">Pacifico</option>
                                <option value="'Great Vibes', cursive">Great Vibes</option>
                                <option value="'Satisfy', cursive">Satisfy</option>
                                <option value="'Kalam', cursive">Kalam</option>
                            </optgroup>
                            <optgroup label="Monospace - Lập trình">
                                <option value="'Courier New', monospace">Courier New</option>
                                <option value="'Monaco', monospace">Monaco</option>
                                <option value="'Source Code Pro', monospace">Source Code Pro</option>
                            </optgroup>
                            <optgroup label="Vui nhộn">
                                <option value="Comic Sans MS">Comic Sans MS</option>
                                <option value="'Balsamiq Sans', cursive">Balsamiq Sans</option>
                                <option value="'Indie Flower', cursive">Indie Flower</option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Kích thước</label>
                        <input v-model.number="textForm.fontSize" type="range" min="12" max="72" class="range-input" />
                        <span>{{ textForm.fontSize }}px</span>
                    </div>
                    <div class="form-group">
                        <label>Màu chữ</label>
                        <div class="color-options">
                            <button v-for="color in colorOptions" :key="color.value"
                                :style="{ backgroundColor: color.value }"
                                :class="{ active: textForm.color === color.value }" class="color-btn"
                                :title="color.label" @click="textForm.color = color.value">
                            </button>
                        </div>
                        <div class="custom-color-section">
                            <label>Màu tùy chỉnh:</label>
                            <input type="color" v-model="textForm.color" class="color-picker">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="textForm.bold" />
                            <span class="checkbox-custom"></span>
                            Đậm
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="textForm.italic" />
                            <span class="checkbox-custom"></span>
                            Nghiêng
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="textForm.shadow" />
                            <span class="checkbox-custom"></span>
                            Đổ bóng
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="closeTextModal" class="secondary-btn">Hủy</button>
                    <button @click="saveText" class="primary-btn">
                        {{ editingText ? 'Cập nhật' : 'Thêm' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Image Edit Modal -->
        <div v-if="showImageModal" class="modal-overlay" @click="closeImageModal">
            <div class="text-modal" @click.stop>
                <div class="modal-header">
                    <h3>{{ editingImage ? 'Chỉnh sửa hình ảnh' : 'Thêm hình ảnh mới' }}</h3>
                    <button @click="closeImageModal" class="close-btn">
                        <X class="icon" />
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Chọn hình ảnh</label>
                        <div class="file-input-wrapper">
                            <input type="file" accept="image/*" @change="handleImageUpload" class="file-input"
                                ref="imageInput" id="imageUpload" />
                            <label for="imageUpload" class="file-input-label">
                                <ImageIcon class="icon" />
                                Chọn hình ảnh
                            </label>
                        </div>
                        <div v-if="imageForm.src" class="image-preview">
                            <img :src="imageForm.src" alt="Preview" />
                            <button @click="clearImage" class="clear-image-btn">
                                <X class="icon" />
                                Xóa ảnh
                            </button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Mô tả (tùy chọn)</label>
                        <input v-model="imageForm.alt" type="text" placeholder="Nhập mô tả..." class="text-input" />
                    </div>
                    <div class="form-group">
                        <label>Độ trong suốt</label>
                        <input v-model.number="imageForm.opacity" type="range" min="0.1" max="1" step="0.1"
                            class="range-input" />
                        <span>{{ Math.round(imageForm.opacity * 100) }}%</span>
                    </div>
                    <div class="form-group">
                        <label>Góc xoay</label>
                        <input v-model.number="imageForm.rotation" type="range" min="-180" max="180"
                            class="range-input" />
                        <span>{{ imageForm.rotation }}°</span>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="imageForm.shadow" />
                            <span class="checkbox-custom"></span>
                            Đổ bóng
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="imageForm.rounded" />
                            <span class="checkbox-custom"></span>
                            Bo góc
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button @click="closeImageModal" class="secondary-btn">Hủy</button>
                    <button @click="saveImage" class="primary-btn" :disabled="!imageForm.src">
                        {{ editingImage ? 'Cập nhật' : 'Thêm' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- Export image -->
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import {
    ZoomOut,
    ZoomIn,
    FileImage,
    Copy,
    Layout,
    Camera,
    Type,
    Printer,
    Image as ImageIcon,
    X
} from 'lucide-vue-next'
import HTMLExporter from '../../../utils/HTMLExporter'

// Props
const props = defineProps({
    selectedPhotos: {
        type: Array,
        default: () => []
    },
    printSettings: {
        type: Object,
        required: true
    },
    templates: {
        type: Array,
        default: () => []
    }
})

// Emits
const emit = defineEmits([
    'update-photos',
    'add-text',
    'update-text',
    'delete-text',
    'add-image',
    'update-image',
    'delete-image'
])

// Refs
const previewContainer = ref(null)
const imageInput = ref(null)

// Reactive data
const zoomLevel = ref(0.5)
const isDragging = ref(false)
const isResizing = ref(false)
const dragType = ref('')
const dragIndex = ref(-1)
const dragStartPos = ref({ x: 0, y: 0 })
const resizeHandle = ref('')
const showTextModal = ref(false)
const showImageModal = ref(false)
const editingText = ref(null)
const editingImage = ref(null)

const textForm = ref({
    text: '',
    fontFamily: 'Arial',
    fontSize: 24,
    color: '#000000',
    bold: false,
    italic: false,
    shadow: false,
    x: 50,
    y: 50
})

const imageForm = ref({
    src: '',
    alt: '',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    opacity: 1,
    rotation: 0,
    shadow: false,
    rounded: false
})

const colorOptions = ref([
    { value: '#000000', label: 'Đen' },
    { value: '#ffffff', label: 'Trắng' },
    { value: '#ff0000', label: 'Đỏ' },
    { value: '#00ff00', label: 'Xanh lá' },
    { value: '#0000ff', label: 'Xanh dương' },
    { value: '#ffff00', label: 'Vàng' },
    { value: '#ff00ff', label: 'Tím' },
    { value: '#00ffff', label: 'Cyan' },
    { value: '#ff8c00', label: 'Cam' },
    { value: '#ff69b4', label: 'Hồng' },
    { value: '#8a2be2', label: 'Tím đậm' },
    { value: '#32cd32', label: 'Xanh nõn chuối' },
    { value: '#dc143c', label: 'Đỏ thẫm' },
    { value: '#4682b4', label: 'Xanh thép' },
    { value: '#daa520', label: 'Vàng đồng' },
    { value: '#696969', label: 'Xám đậm' }
])

// Layout configurations
const layoutConfigs = {
    single: { columns: 1, rows: 1, slots: 1 },
    double: { columns: 1, rows: 2, slots: 2 },
    triple: { columns: 2, rows: 2, slots: 3 },
    quad: { columns: 2, rows: 2, slots: 4 },
    six: { columns: 2, rows: 3, slots: 6 },
    eight: { columns: 2, rows: 4, slots: 8 }
}

// Computed properties
const currentDate = computed(() => {
    return new Date().toLocaleDateString('vi-VN')
})

const getCurrentLayout = computed(() => {
    const layouts = [
        { value: 'single', label: '1 ảnh', photoCount: 1 },
        { value: 'double', label: '2 ảnh', photoCount: 2 },
        { value: 'triple', label: '3 ảnh', photoCount: 3 },
        { value: 'quad', label: '4 ảnh', photoCount: 4 },
        { value: 'six', label: '6 ảnh', photoCount: 6 },
        { value: 'eight', label: '8 ảnh', photoCount: 8 }
    ]
    return layouts.find(layout => layout.value === props.printSettings.layout)
})

const getPreviewWidth = computed(() => {
    const sizes = {
        '2x6': '400px',
        '4x6': '800px',
        '4x3': '960px'
    }
    return sizes[props.printSettings.paperSize] || '400px'
})

const getPreviewHeight = computed(() => {
    const sizes = {
        '2x6': '1200px',
        '4x6': '1200px',
        '4x3': '720px'
    }
    return sizes[props.printSettings.paperSize] || '1200px'
})

const getBackgroundStyle = computed(() => {
    const bg = props.printSettings.background
    return bg.value
})

const displayPhotos = computed(() => {
    const layout = layoutConfigs[props.printSettings.layout] || layoutConfigs.single
    const photos = [...props.selectedPhotos]

    while (photos.length < layout.slots) {
        photos.push(null)
    }

    return photos.slice(0, layout.slots)
})

// Methods
const zoomIn = () => {
    zoomLevel.value = Math.min(2, zoomLevel.value + 0.25)
}

const zoomOut = () => {
    zoomLevel.value = Math.max(0.25, zoomLevel.value - 0.25)
}

const getPhotoStyle = (index) => {
    const positions = props.printSettings.photoPositions || {}
    const pos = positions[index] || { x: 0, y: 0, scale: 1 }

    return {
        transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.scale})`,
        cursor: isDragging.value && dragIndex.value === index && dragType.value === 'photo' ? 'grabbing' : 'grab',
        transition: isDragging.value && dragIndex.value === index ? 'none' : 'transform 0.2s ease'
    }
}

const getTextStyle = (textElement) => {
    return {
        position: 'absolute',
        left: `${textElement.x}%`,
        top: `${textElement.y}%`,
        fontFamily: textElement.fontFamily,
        fontSize: `${textElement.fontSize}px`,
        color: textElement.color,
        fontWeight: textElement.bold ? 'bold' : 'normal',
        fontStyle: textElement.italic ? 'italic' : 'normal',
        textShadow: textElement.shadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none',
        cursor: isDragging.value && dragIndex.value === textElement.id && dragType.value === 'text' ? 'grabbing' : 'move',
        userSelect: 'none',
        zIndex: 10,
        transition: isDragging.value && dragIndex.value === textElement.id ? 'none' : 'all 0.2s ease'
    }
}

const getImageStyle = (imageElement) => {
    return {
        position: 'absolute',
        left: `${imageElement.x}%`,
        top: `${imageElement.y}%`,
        width: `${imageElement.width}px`,
        height: `${imageElement.height}px`,
        opacity: imageElement.opacity,
        transform: `rotate(${imageElement.rotation}deg)`,
        cursor: isDragging.value && dragIndex.value === imageElement.id && dragType.value === 'image' ? 'grabbing' : 'move',
        zIndex: 9,
        transition: isDragging.value && dragIndex.value === imageElement.id ? 'none' : 'all 0.2s ease'
    }
}

const startPhotoDrag = (event, index) => {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
    dragType.value = 'photo'
    dragIndex.value = index
    dragStartPos.value = { x: event.clientX, y: event.clientY }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
}

const startTextDrag = (event, textId) => {
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
    dragType.value = 'text'
    dragIndex.value = textId
    dragStartPos.value = { x: event.clientX, y: event.clientY }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
}

const startImageDrag = (event, imageId) => {
    if (event.target.classList.contains('resize-handle')) return

    event.preventDefault()
    event.stopPropagation()

    isDragging.value = true
    dragType.value = 'image'
    dragIndex.value = imageId
    dragStartPos.value = { x: event.clientX, y: event.clientY }

    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
}

const startResize = (event, imageId, handle) => {
    event.preventDefault()
    event.stopPropagation()
    isResizing.value = true
    dragType.value = 'resize'
    dragIndex.value = imageId
    resizeHandle.value = handle
    dragStartPos.value = { x: event.clientX, y: event.clientY }

    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', stopResize)
}

const handleDrag = (event) => {
    if (!isDragging.value) return

    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y

    if (dragType.value === 'photo') {
        const positions = { ...props.printSettings.photoPositions }
        if (!positions[dragIndex.value]) {
            positions[dragIndex.value] = { x: 0, y: 0, scale: 1 }
        }

        positions[dragIndex.value].x += deltaX / zoomLevel.value
        positions[dragIndex.value].y += deltaY / zoomLevel.value

        const newSettings = { ...props.printSettings, photoPositions: positions }
        emit('update-photos', newSettings)

    } else if (dragType.value === 'text') {
        const containerRect = previewContainer.value.getBoundingClientRect()
        const previewRect = previewContainer.value.querySelector('.photo-booth-preview').getBoundingClientRect()

        const relativeX = (event.clientX - previewRect.left) / previewRect.width * 100
        const relativeY = (event.clientY - previewRect.top) / previewRect.height * 100

        const newX = Math.max(-50, Math.min(150, relativeX))
        const newY = Math.max(-50, Math.min(150, relativeY))

        emit('update-text', dragIndex.value, { x: newX, y: newY })

    } else if (dragType.value === 'image') {
        const containerRect = previewContainer.value.getBoundingClientRect()
        const previewRect = previewContainer.value.querySelector('.photo-booth-preview').getBoundingClientRect()

        const relativeX = (event.clientX - previewRect.left) / previewRect.width * 100
        const relativeY = (event.clientY - previewRect.top) / previewRect.height * 100

        const newX = Math.max(-50, Math.min(150, relativeX))
        const newY = Math.max(-50, Math.min(150, relativeY))
        
        emit('update-image', dragIndex.value, { x: newX, y: newY })
    }

    dragStartPos.value = { x: event.clientX, y: event.clientY }
}

const handleResize = (event) => {
    if (!isResizing.value) return

    const deltaX = event.clientX - dragStartPos.value.x
    const deltaY = event.clientY - dragStartPos.value.y

    const imageElements = [...(props.printSettings.imageElements || [])]
    const imageIndex = imageElements.findIndex(el => el.id === dragIndex.value)

    if (imageIndex !== -1) {
        const element = imageElements[imageIndex]
        let newWidth = element.width
        let newHeight = element.height

        switch (resizeHandle.value) {
            case 'se':
                newWidth += deltaX
                newHeight += deltaY
                break
            case 'sw':
                newWidth -= deltaX
                newHeight += deltaY
                break
            case 'ne':
                newWidth += deltaX
                newHeight -= deltaY
                break
            case 'nw':
                newWidth -= deltaX
                newHeight -= deltaY
                break
        }

        newWidth = Math.max(50, Math.min(500, newWidth))
        newHeight = Math.max(50, Math.min(500, newHeight))

        emit('update-image', dragIndex.value, {
            width: newWidth,
            height: newHeight
        })
    }

    dragStartPos.value = { x: event.clientX, y: event.clientY }
}

const stopDrag = () => {
    isDragging.value = false
    dragType.value = ''
    dragIndex.value = -1

    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
}

const stopResize = () => {
    isResizing.value = false
    dragType.value = ''
    dragIndex.value = -1
    resizeHandle.value = ''

    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
}

const addTextElement = () => {
    resetTextForm()
    showTextModal.value = true
}

const addImageElement = () => {
    resetImageForm()
    showImageModal.value = true
    nextTick(() => {
        if (imageInput.value) {
            imageInput.value.focus()
        }
    })
}

const editText = (textId) => {
    const textElement = props.printSettings.textElements?.find(el => el.id === textId)
    console.log(111)
    if (textElement) {
        editingText.value = textId
        textForm.value = { ...textElement }
        showTextModal.value = true
    }
}

const editImage = (imageId) => {
    const imageElement = props.printSettings.imageElements?.find(el => el.id === imageId)
    if (imageElement) {
        editingImage.value = imageId
        imageForm.value = { ...imageElement }
        showImageModal.value = true
    }
}

const deleteTextElement = (textId) => {
    emit('delete-text', textId)
}

const deleteImageElement = (imageId) => {
    emit('delete-image', imageId)
}
// const handleContainerClick = (event) => {
//     if (!isDragging.value && !isResizing.value && event.target === event.currentTarget) {
//         const rect = event.currentTarget.getBoundingClientRect()
//         const previewRect = event.currentTarget.querySelector('.photo-booth-preview').getBoundingClientRect()

//         const x = ((event.clientX - previewRect.left) / previewRect.width) * 100
//         const y = ((event.clientY - previewRect.top) / previewRect.height) * 100

//         textForm.value.x = Math.max(0, Math.min(95, x))
//         textForm.value.y = Math.max(0, Math.min(95, y))

//         addTextElement()
//     }
// }

const handleImageUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file hình ảnh!')
        return
    }

    if (file.size > 5 * 1024 * 1024) {
        alert('File quá lớn! Vui lòng chọn file nhỏ hơn 5MB.')
        return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
        imageForm.value.src = e.target.result
        if (!imageForm.value.alt) {
            imageForm.value.alt = file.name
        }
    }
    reader.onerror = () => {
        alert('Có lỗi xảy ra khi đọc file!')
    }
    reader.readAsDataURL(file)
}

const clearImage = () => {
    imageForm.value.src = ''
    imageForm.value.alt = ''
    if (imageInput.value) {
        imageInput.value.value = ''
    }
}

const resetTextForm = () => {
    textForm.value = {
        text: '',
        fontFamily: 'Arial',
        fontSize: 24,
        color: '#000000',
        bold: false,
        italic: false,
        shadow: false,
        x: 50,
        y: 50
    }
    editingText.value = null
}

const resetImageForm = () => {
    imageForm.value = {
        src: '',
        alt: '',
        x: 50,
        y: 50,
        width: 100,
        height: 100,
        opacity: 1,
        rotation: 0,
        shadow: false,
        rounded: false
    }
    editingImage.value = null
    if (imageInput.value) {
        imageInput.value.value = ''
    }
}

const saveText = () => {
    if (!textForm.value.text.trim()) {
        alert('Vui lòng nhập nội dung text')
        return
    }

    const textData = {
        ...textForm.value,
        id: editingText.value || Date.now()
    }

    if (editingText.value) {
        emit('update-text', editingText.value, textData)
    } else {
        emit('add-text', textData)
    }

    closeTextModal()
}

const saveImage = () => {
    if (!imageForm.value.src) {
        alert('Vui lòng chọn hình ảnh')
        return
    }

    const imageData = {
        ...imageForm.value,
        id: editingImage.value || Date.now()
    }

    if (editingImage.value) {
        emit('update-image', editingImage.value, imageData)
    } else {
        emit('add-image', imageData)
    }

    closeImageModal()
}

const closeTextModal = () => {
    showTextModal.value = false
    resetTextForm()
}

const closeImageModal = () => {
    showImageModal.value = false
    resetImageForm()
}

const loadGoogleFonts = () => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Roboto:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Crimson+Text:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Oswald:wght@300;400;500;600;700&family=Anton&family=Bebas+Neue&family=Righteous&family=Fredoka+One&family=Dancing+Script:wght@400;500;600;700&family=Pacifico&family=Great+Vibes&family=Satisfy&family=Kalam:wght@300;400;700&family=Source+Code+Pro:wght@300;400;500;600;700&family=Balsamiq+Sans:wght@400;700&family=Indie+Flower&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
}
onMounted(() => {
    loadGoogleFonts()
})

onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', stopResize)
})


const exportPreviewHTML = () => {
    const exporter = new HTMLExporter();
    const previewEl = previewContainer.value?.querySelector('.photo-booth-preview');

    if (!previewEl) {
        alert('Không tìm thấy preview element');
        return;
    }

    const htmlContent = exporter.exportToHTML(previewEl, 'photo-booth-preview.html', {
        cssLinks: [
            "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&family=Roboto:wght@300;400;500;700&family=Lato:wght@300;400;700&family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Merriweather:wght@300;400;700&family=Crimson+Text:wght@400;600&family=Libre+Baskerville:wght@400;700&family=Oswald:wght@300;400;500;600;700&family=Anton&family=Bebas+Neue&family=Righteous&family=Fredoka+One&family=Dancing+Script:wght@400;500;600;700&family=Pacifico&family=Great+Vibes&family=Satisfy&family=Kalam:wght@300;400;700&family=Source+Code+Pro:wght@300;400;500;600;700&family=Balsamiq+Sans:wght@400;700&family=Indie+Flower&display=swap"
        ]
    }, false);

    window.electronAPI.printHTML(htmlContent);
    // const printWindow = window.open('', '_blank');
    // printWindow.document.open();
    // printWindow.document.write(htmlContent);
    // printWindow.document.close();

    // // Đợi load xong mới in
    // printWindow.onload = () => {
    //     printWindow.focus();
    //     printWindow.print();
    // };

};
</script>

<style scoped>
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

.zoom-btn,
.add-text-btn,
.add-image-btn,.add-preview-btn {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    gap: 0.5rem;
}

.zoom-btn:hover:not(:disabled) {
    border-color: #1e40af;
}

.zoom-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.add-text-btn {
    background: #5b7463;
    color: white;
    border-color: #5b7463;
}

.add-text-btn:hover {
    background: #15803d;
}

.add-image-btn {
    background: #5b7463;
    color: white;
    border-color: #5b7463;
}

.add-image-btn:hover {
    background: #15803d;
}

.add-preview-btn {
    background: #096bff;
    color: white;
    border-color: #096bff;
}

.add-preview-btn:hover {
    background: #0142a5;
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
    position: relative;
}

.photo-booth-preview {
    border-radius: 12px;
    position: relative;
    transform-origin: center;
    transition: transform 0.3s ease;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    padding: 10px;
    display: grid;
    gap: 10px;
    overflow: visible;
}

.paper-2x6 .photo-booth-preview {
    grid-template-columns: 1fr;
}

.paper-4x6 .photo-booth-preview,
.paper-4x3 .photo-booth-preview {
    grid-template-columns: 1fr 1fr;
}

.layout-single {
    grid-template-columns: 1fr !important;
    grid-template-rows: 1fr !important;
}

.layout-double {
    grid-template-columns: 1fr !important;
}

.layout-triple {
    grid-template-rows: auto auto !important;
}

.layout-triple .photo-slot:first-child {
    grid-column: 1 / -1;
}

.layout-six {
    grid-template-columns: 1fr 1fr !important;
}

.layout-eight {
    grid-template-columns: 1fr 1fr !important;
    grid-template-rows: 1fr 1fr 1fr 1fr !important;
}

.photo-slot {
    position: relative;
    border-radius: 8px;
    overflow: hidden;
    background: #f3f4f6;
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.photo-slot img {
    width: 100%;
    object-fit: contain;
}

.empty-slot {
    border: 2px dashed #d1d5db;
    background: #fafafa;
    display: flex;
    align-items: center;
    justify-content: center;
}

.empty-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: #9ca3af;
    font-size: 0.8rem;
}

.text-element {
    border-radius: 4px;
    padding: 4px 8px;
    min-width: 50px;
    min-height: 30px;
    display: flex;
    align-items: center;
    position: relative;
}

.text-element:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: #1e40af;
}

.image-element {
    position: relative;
    border: 2px dashed transparent;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-element:hover {
    border-color: #8b5cf6;
}

.image-element img {
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
}

.resize-handles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
}

.image-element:hover .resize-handles {
    pointer-events: auto;
}

.resize-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #8b5cf6;
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.image-element:hover .resize-handle {
    opacity: 1;
}

.resize-handle.nw {
    top: 0;
    left: 0;
    cursor: nw-resize;
}

.resize-handle.ne {
    top: 0;
    right: 0;
    cursor: ne-resize;
}

.resize-handle.sw {
    bottom: 0;
    left: 0;
    cursor: sw-resize;
}

.resize-handle.se {
    bottom: 0;
    right: 0;
    cursor: se-resize;
}

.element-delete-btn {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s;
    z-index: 20;
}

.text-element:hover .element-delete-btn,
.image-element:hover .element-delete-btn {
    opacity: 1;
}

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

.with-border .photo-slot {
    border-width: 3px !important;
    border-style: solid !important;
    border-color: white !important;
}

.date-overlay {
    position: absolute;
    bottom: 10px;
    right: 10px;
    color: rgb(0, 0, 0);
    padding: 0.25rem 0.5rem;
    font-family: "Great Vibes", cursive;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 5;
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
    z-index: 5;
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

.text-modal {
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
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h3 {
    margin: 0;
    color: #1e40af;
}

.close-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s;
}

.close-btn:hover {
    background: #f3f4f6;
}

.modal-body {
    padding: 1.5rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group:last-child {
    margin-bottom: 0;
}

.form-group label {
    display: block;
    color: #374151;
    font-weight: 500;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
}

.text-input,
.select-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.9rem;
}

.text-input:focus,
.select-input:focus {
    outline: none;
    border-color: #1e40af;
}

.range-input {
    width: 100%;
    margin: 0.5rem 0;
}

.file-input {
    display: none;
}

.file-input-wrapper {
    position: relative;
}

.file-input-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: #f8fafc;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: #6b7280;
    font-size: 0.9rem;
}

.file-input-label:hover {
    background: #e0e7ff;
    border-color: #8b5cf6;
    color: #8b5cf6;
}

.image-preview {
    margin-top: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 1rem;
    position: relative;
    background: #fafafa;
}

.image-preview img {
    max-width: 100%;
    max-height: 200px;
    object-fit: contain;
    border-radius: 4px;
    display: block;
    margin: 0 auto;
}

.clear-image-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 0.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    transition: all 0.2s;
}

.clear-image-btn:hover {
    background: #dc2626;
}

.color-options {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.color-btn {
    width: 40px;
    height: 40px;
    border: 2px solid #e5e7eb;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.color-btn:hover {
    transform: scale(1.1);
}

.color-btn.active {
    border-color: #1e40af;
    box-shadow: 0 0 0 2px rgba(30, 64, 175, 0.2);
}

.custom-color-section {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.custom-color-section label {
    margin: 0;
    font-size: 0.85rem;
}

.color-picker {
    width: 50px;
    height: 35px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    cursor: pointer;
}

.checkbox-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-right: 1rem;
    cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
    display: none;
}

.checkbox-custom {
    width: 18px;
    height: 18px;
    border: 2px solid #e5e7eb;
    border-radius: 3px;
    position: relative;
    transition: all 0.2s;
}

.checkbox-label input[type="checkbox"]:checked+.checkbox-custom {
    background: #1e40af;
    border-color: #1e40af;
}

.checkbox-label input[type="checkbox"]:checked+.checkbox-custom::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: bold;
    font-size: 10px;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

.secondary-btn,
.primary-btn {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
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
}

.primary-btn:hover:not(:disabled) {
    background: #1d4ed8;
}

.primary-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.icon {
    width: 20px;
    height: 20px;
}

.element-delete-btn .icon {
    width: 12px;
    height: 12px;
}

.select-input optgroup {
    font-weight: bold;
    color: #374151;
}

.select-input option {
    padding: 0.5rem;
}

.text-element,
.image-element {
    will-change: transform;
}

.photo-slot {
    will-change: transform;
}
</style>