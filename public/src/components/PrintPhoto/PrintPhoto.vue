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
            <PrintSettingsView v-model:settings="printSettings" :selected-photos="selectedPhotos"
                :templates="savedTemplates" @save-template="saveTemplate" @update:settings="updatePhotos"
                @load-template="loadTemplate" />

            <PhotoPreview :selected-photos="selectedPhotos" :print-settings="printSettings"
                @update-photos="updatePhotos" @add-text="addText" @update-text="updateText" @delete-text="deleteText"
                @add-image="addImage" @update-image="updateImage" @delete-image="deleteImage" />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ArrowLeft } from 'lucide-vue-next'
import PrintSettingsView from './PrintSettings.vue'
import PhotoPreview from './PhotoPreview.vue' // Component đã cải tiến
import request from '@/../utils/request'
import photobooth from '@/modules/photobooth.module'

const props = defineProps({
    selectedPhotos: { type: Array, default: () => [] }
})

const emit = defineEmits(['back', 'done'])

const printSettings = ref({
    paperSize: '2x6',
    copies: 1,
    layout: 'single',
    background: 'white',
    style: 'classic',
    addDate: false,
    addWatermark: false,
    addBorder: true,
    fontFamily: 'Arial',
    imagePosition: 'start',
    photoPositions: {},
    textElements: [],
    imageElements: [] // Thêm support cho image elements
})

const savedTemplates = ref([])

const saveTemplate = (templateName) => {
    //Chụp ảnh element
    const element = document.querySelector('.photo-booth-preview');

    html2canvas(element).then(async canvas => {
        const base64Image = canvas.toDataURL('image/png');
        console.log(base64Image)

        const photo = new photobooth()
        const template = {
            name: templateName,
            image: await photo.upload_base64(base64Image),
            settings: { ...printSettings.value },
            createdAt: new Date().toISOString()
        }
        savedTemplates.value.push(template)
        localStorage.setItem('photoBoothTemplates', JSON.stringify(savedTemplates.value))
        alert(`Template "${templateName}" đã được lưu!`)
        console.log(JSON.stringify(template))
    });


}

const loadTemplate = (template) => {
    printSettings.value = { ...template.settings }
}

const updatePhotos = (updatedSettings) => {
    printSettings.value = { ...updatedSettings }
}

const addText = (textData) => {
    if (!printSettings.value.textElements) {
        printSettings.value.textElements = []
    }
    printSettings.value.textElements.push({
        id: textData.id || Date.now(),
        ...textData
    })
}

const updateText = (textId, updatedData) => {
    if (!printSettings.value.textElements) return

    const index = printSettings.value.textElements.findIndex(el => el.id === textId)
    if (index !== -1) {
        printSettings.value.textElements[index] = {
            ...printSettings.value.textElements[index],
            ...updatedData
        }
    }
}

const deleteText = (textId) => {
    if (!printSettings.value.textElements) return

    printSettings.value.textElements = printSettings.value.textElements.filter(el => el.id !== textId)
}

const addImage = (imageData) => {
    if (!printSettings.value.imageElements) {
        printSettings.value.imageElements = []
    }
    printSettings.value.imageElements.push({
        id: imageData.id || Date.now(),
        ...imageData
    })
}

const updateImage = (imageId, updatedData) => {
    if (!printSettings.value.imageElements) return

    const index = printSettings.value.imageElements.findIndex(el => el.id === imageId)
    if (index !== -1) {
        printSettings.value.imageElements[index] = {
            ...printSettings.value.imageElements[index],
            ...updatedData
        }
    }
}

const deleteImage = (imageId) => {
    if (!printSettings.value.imageElements) return

    printSettings.value.imageElements = printSettings.value.imageElements.filter(el => el.id !== imageId)
}
const goBack = () => emit('back')

onMounted(() => {
    request.get('templates')
        .then(result => {
            const data = result.data
            console.log("templates: ", data)
        })
        .catch(err => {
            console.log("err: ", err)
        })

    const templates = localStorage.getItem('photoBoothTemplates')
    if (templates) {
        try {
            savedTemplates.value = JSON.parse(templates)
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    const photoCount = props.selectedPhotos.length
    if (photoCount > 0) {
        if (photoCount <= 1) printSettings.value.layout = 'single'
        else if (photoCount <= 2) printSettings.value.layout = 'double'
        else if (photoCount <= 3) printSettings.value.layout = 'triple'
        else if (photoCount <= 4) printSettings.value.layout = 'quad'
        else if (photoCount <= 6) printSettings.value.layout = 'six'
        else printSettings.value.layout = 'eight'
        if (photoCount > 4) {
            printSettings.value.paperSize = '4x6'
        }
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

.icon {
    width: 20px;
    height: 20px;
}

/* Responsive */
@media (max-width: 768px) {
    .content {
        flex-direction: column;
        gap: 0.5rem;
    }

    .footer {
        flex-direction: column;
        gap: 1rem;
    }

    .action-buttons {
        width: 100%;
        justify-content: center;
    }
}
</style>