<template>
    <div class="print-settings">
        <div class="settings-group">
            <h3>Cài đặt in</h3>

            <div class="setting-item">
                <label>Kích thước giấy</label>
                <select v-model="localSettings.paperSize" class="select-input">
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
                    <input v-model.number="localSettings.copies" type="number" min="1" max="10" class="qty-input" />
                    <button @click="increaseQuantity" class="qty-btn">
                        <Plus class="icon" />
                    </button>
                </div>
            </div>
        </div>

        <!-- <div class="settings-group">
            <h3>Layout ảnh</h3>
            <div class="layout-options">
                <button v-for="layout in availableLayouts" :key="layout.value"
                    @click="localSettings.layout = layout.value"
                    :class="{ active: localSettings.layout === layout.value }" class="layout-btn">
                    <div class="layout-preview" :class="`preview-${layout.value}`">
                        <div v-for="n in layout.photoCount" :key="n" class="layout-photo-slot"></div>
                    </div>
                    <span>{{ layout.label }}</span>
                </button>
            </div>
        </div> -->

        <div class="settings-group">
            <h3>Vị trí ảnh</h3>
            <div class="background-options">
                <button v-for="(position, index) in positionOptions" :key="index"
                    :class="{ active: localSettings.imagePosition === position.value }" class="bg-btn"
                    @click="localSettings.imagePosition = position.value">
                    <span>{{ position.name }}</span>
                </button>
            </div>
        </div>

        <div class="settings-group">
            <div class="photobooth">
                <h3>Nền Photo Booth</h3>
                <div class="preview-booth" :style="`background:${bgColor}`">
                    <input type="color" v-model="bgColor" /> [{{ bgColor }}]
                </div>
            </div>
        </div>

        <div class="settings-group">
            <h3>Style Photo Booth</h3>
            <div class="style-options">
                <button v-for="style in styleOptions" :key="style.value" @click="localSettings.style = style.value"
                    :class="{ active: localSettings.style === style.value }" class="style-btn">
                    <div class="style-preview" :class="`style-${style.value}`"></div>
                    <span>{{ style.label }}</span>
                </button>
            </div>
        </div>

        <div class="settings-group">
            <h3>Tùy chọn khác</h3>

            <div class="setting-more">
                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="localSettings.addDate" class="checkbox-input" />
                        <span class="checkbox-custom"></span>
                        &ensp; Thêm ngày
                    </label>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="localSettings.addWatermark" class="checkbox-input" />
                        <span class="checkbox-custom"></span>
                        &ensp; Watermark
                    </label>
                </div>

                <div class="setting-item">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="localSettings.addBorder" class="checkbox-input" />
                        <span class="checkbox-custom"></span>
                        &ensp; Viền
                    </label>
                </div>
            </div>
        </div>

        <div class="settings-group">
            <h3>Templates</h3>
            <div class="template-controls">
                <div class="template-input">
                    <input v-model="templateName" placeholder="Tên template" class="template-name-input" />
                    <button @click="saveTemplate" :disabled="!templateName.trim()" class="save-template-btn">
                        <BookmarkPlus class="icon" />
                        Lưu
                    </button>
                </div>
                <TemplateView v-if="isShowTemplate" @back="isShowTemplate = false" @loadTemplate="loadTemplate" />
                <button @click="isShowTemplate = true" class="save-template-btn">
                    <BookmarkPlus class="icon" />
                    Mẫu có sẵn
                </button>
                <!-- <div v-if="templates.length > 0" class="saved-templates">
                    <div v-for="template in templates" :key="template.id" class="template-item">
                        <button @click="loadTemplate(template)" class="template-load-btn">
                            <Bookmark class="icon" />
                            {{ template.name }}
                        </button>
                        <button @click="deleteTemplate(template.id)" class="template-delete-btn">
                            <Trash2 class="icon" />
                        </button>
                    </div>
                </div> -->
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Minus, Plus, BookmarkPlus, Bookmark, Trash2 } from 'lucide-vue-next'
import { isEqual } from 'lodash-es' // hoặc tự viết hàm so sánh đơn giản
import TemplateView from './TemplateView.vue'
// Props
const props = defineProps({
    settings: {
        type: Object,
        required: true
    },
    selectedPhotos: {
        type: Array,
        default: () => []
    }
})
// Emits
const emit = defineEmits(['update:settings', 'save-template', 'load-template'])

const bgColor = ref('')

watch(bgColor, (newVal) => {
    localSettings.value.background = { value: bgColor.value, label: bgColor.value, preview: bgColor.value }
})
const isShowTemplate = ref(false)
// Local reactive data
const localSettings = ref({ ...props.settings })
const templateName = ref('')

// Watch for external settings changes
watch(() => props.settings, (newSettings) => {
    localSettings.value = { ...newSettings }
}, { deep: true })

// Watch for local settings changes and emit
watch(localSettings, (newSettings) => {
    if (!isEqual(newSettings, props.settings)) {
        emit('update:settings', { ...newSettings })
    }
}, { deep: true })

// Options data
const positionOptions = ref([
    { name: "Trên", value: 'start' },
    { name: "Giữa", value: 'center' },
    { name: "Dưới", value: 'end' }
])
const styleOptions = ref([
    { value: 'classic', label: 'Cổ điển' },
    { value: 'modern', label: 'Hiện đại' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'polaroid', label: 'Polaroid' },
    { value: 'film-strip', label: 'Film Strip' }
])

const layoutOptions = ref([
    { value: 'single', label: '1 ảnh', photoCount: 1, minPhotos: 1, maxPhotos: 1 },
    { value: 'double', label: '2 ảnh', photoCount: 2, minPhotos: 1, maxPhotos: 2 },
    { value: 'triple', label: '3 ảnh', photoCount: 3, minPhotos: 1, maxPhotos: 3 },
    { value: 'quad', label: '4 ảnh', photoCount: 4, minPhotos: 1, maxPhotos: 4 },
    { value: 'six', label: '6 ảnh', photoCount: 6, minPhotos: 1, maxPhotos: 6 },
    { value: 'eight', label: '8 ảnh', photoCount: 8, minPhotos: 1, maxPhotos: 8 }
])

// Computed
const availableLayouts = computed(() => {
    return layoutOptions.value.filter(layout =>
        props.selectedPhotos.length >= layout.minPhotos &&
        props.selectedPhotos.length <= layout.maxPhotos
    )
})

// Methods
const decreaseQuantity = () => {
    if (localSettings.value.copies > 1) {
        localSettings.value.copies--
    }
}

const increaseQuantity = () => {
    if (localSettings.value.copies < 10) {
        localSettings.value.copies++
    }
}

const saveTemplate = () => {
    if (templateName.value.trim()) {
        emit('save-template', templateName.value.trim())
        templateName.value = ''
    }
}

const loadTemplate = (template) => {
    isShowTemplate.value = false
    emit('load-template', template)
}

// Watch for paper size changes
watch(() => localSettings.value.paperSize, (newSize) => {
    if (props.selectedPhotos.length > 4 && newSize === '2x6') {
        alert("Vui lòng chọn ít ảnh hơn cho kích thước 2x6")
        localSettings.value.paperSize = '4x6'
    }
})

onMounted(() => {
    bgColor.value = "#ffffff"
})

</script>

<style scoped>
.print-settings {
    width: 350px;
    background: #f8fafc;
    border-radius: 12px;
    padding: 1.5rem;
    overflow-y: auto;
}

.photobooth {}

.preview-booth {
    padding: 10px;
    border: 1px solid gray;
    color: black;
    text-align: center;
}

.settings-group {
    margin-bottom: 2rem;
}
.setting-more{
    display: flex;
    gap: 5px;
}
.setting-more .setting-item{
    width: calc((100% - 20px)/3);
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.bg-btn {
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 45px;
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
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
}

.style-btn {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    padding: 0.5rem;
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
    background: #f8fafc;
    border: 1px solid #cbd5e1;
}

.style-modern {
    background: #3b82f6;
}

.style-vintage {
    background: #d4a574;
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

.template-controls {
    space-y: 1rem;
}

.template-input {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.template-name-input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 0.9rem;
}

.template-name-input:focus {
    outline: none;
    border-color: #1e40af;
}

.save-template-btn {
    background: #16a34a;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.save-template-btn:hover:not(:disabled) {
    background: #15803d;
}

.save-template-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.saved-templates {
    /* space-y: 0.5rem; */
}

.template-item {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 5px;
}

.template-load-btn {
    flex: 1;
    background: white;
    border: 1px solid #e5e7eb;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    transition: all 0.2s;
}

.template-load-btn:hover {
    border-color: #1e40af;
    background: #f0f9ff;
}

.template-delete-btn {
    background: #ef4444;
    color: white;
    border: none;
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.template-delete-btn:hover {
    background: #dc2626;
}

.icon {
    width: 16px;
    height: 16px;
}
</style>