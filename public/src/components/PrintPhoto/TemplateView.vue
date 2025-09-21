<template>
    <div class="template">
        <div class="template-content">
            <!-- Header với nút back và search -->
            <div class="header">
                <button @click="goBack" class="back-btn">
                    <ArrowLeft class="icon" />
                    Quay lại
                </button>
                
                <div class="search-container">
                    <Search class="search-icon" />
                    <input 
                        v-model="searchQuery" 
                        type="text" 
                        placeholder="Tìm kiếm template..." 
                        class="search-input"
                    />
                    <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
                        <X class="icon-small" />
                    </button>
                </div>
            </div>

            <!-- Danh sách templates -->
            <div class="list" v-if="filteredTemplates.length > 0">
                <div 
                    class="template-item" 
                    v-for="template in filteredTemplates" 
                    :key="template.id"
                >
                    <div class="template-card">
                        <div class="delete-btn" @click="deleteTemplate(template)">
                            <Trash size="16" />
                        </div>
                        
                        <div class="image-container" @click="showImagePreview(template)">
                            <img :src="template.image" :alt="template.name" />
                            <div class="image-overlay">
                                <Eye class="preview-icon" />
                                <span>Xem trước</span>
                            </div>
                        </div>
                        
                        <div class="template-info">
                            <h4 class="template-name">{{ template.name }}</h4>
                            <div class="template-details">
                                <div class="detail-item">
                                    <FileImage class="detail-icon" />
                                    <span>{{ template.settings.paperSize }}</span>
                                </div>
                                <div class="detail-item">
                                    <Grid class="detail-icon" />
                                    <span>{{ template.settings.layout }} ảnh</span>
                                </div>
                            </div>
                            
                            <button @click="loadTemplate(template)" class="apply-btn">
                                <Check class="icon-small" />
                                Áp dụng
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div v-else class="empty-state">
                <ImageOff class="empty-icon" />
                <h3>{{ searchQuery ? 'Không tìm thấy template' : 'Chưa có template nào' }}</h3>
                <p>{{ searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy tạo template đầu tiên của bạn' }}</p>
            </div>
        </div>

        <!-- Modal xem ảnh full screen -->
        <div v-if="previewImage" class="image-modal" @click="closePreview">
            <div class="modal-content" @click.stop>
                <button @click="closePreview" class="close-modal-btn">
                    <X class="icon" />
                </button>
                
                <div class="preview-container">
                    <img :src="previewImage.image" :alt="previewImage.name" />
                </div>
                
                <div class="modal-footer">
                    <div class="preview-info">
                        <h3>{{ previewImage.name }}</h3>
                        <div class="preview-details">
                            <span class="detail-badge">{{ previewImage.settings.paperSize }}</span>
                            <span class="detail-badge">{{ previewImage.settings.layout }} ảnh</span>
                        </div>
                    </div>
                    
                    <button @click="applyFromPreview" class="modal-apply-btn">
                        <Check class="icon-small" />
                        Áp dụng Template
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
    ArrowLeft, 
    Search, 
    X, 
    Trash, 
    Eye, 
    Check, 
    FileImage, 
    Grid, 
    ImageOff 
} from 'lucide-vue-next'

// Define emits
const emit = defineEmits(['loadTemplate', 'deleteTemplate', 'back'])

// Reactive data
const propTemplate = ref([])
const searchQuery = ref('')
const previewImage = ref(null)

// Computed properties
const filteredTemplates = computed(() => {
    if (!searchQuery.value) {
        return propTemplate.value
    }
    
    const query = searchQuery.value.toLowerCase().trim()
    return propTemplate.value.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.settings.paperSize.toLowerCase().includes(query) ||
        template.settings.layout.toString().includes(query)
    )
})

// Methods
const goBack = () => {
    emit('back')
}

const loadTemplate = (template) => {
    emit("loadTemplate", template)
}

const deleteTemplate = (template) => {
    if (confirm('Bạn có chắc muốn xóa template này?')) {
        const updatedTemplates = propTemplate.value.filter(t => t.id !== template.id)
        localStorage.setItem('photoBoothTemplates', JSON.stringify(updatedTemplates))
        propTemplate.value = updatedTemplates
        emit('deleteTemplate', template)
    }
}

const showImagePreview = (template) => {
    previewImage.value = template
}

const closePreview = () => {
    previewImage.value = null
}

const applyFromPreview = () => {
    if (previewImage.value) {
        loadTemplate(previewImage.value)
        closePreview()
    }
}

const clearSearch = () => {
    searchQuery.value = ''
}

// Lifecycle
onMounted(() => {
    const templates = localStorage.getItem('photoBoothTemplates')
    if (templates) {
        try {
            propTemplate.value = JSON.parse(templates)
        } catch (error) {
            console.error('Error loading templates:', error)
            propTemplate.value = []
        }
    }
})
</script>

<style scoped>
.template {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    padding: 20px;
}

.template-content {
    width: 90%;
    max-width: 1200px;
    height: 85vh;
    background: #f8f9fa;
    border-radius: 20px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

/* Header Styles */
.header {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    padding: 20px 30px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.back-btn {
    background: #6366f1;
    border: none;
    color: white;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 12px 20px;
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
}

.back-btn:hover {
    transform: translateY(-2px);
    background: #4f46e5;
    box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.search-container {
    position: relative;
    max-width: 400px;
    width: 100%;
}

.search-input {
    width: 100%;
    padding: 12px 45px 12px 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    transition: all 0.3s ease;
    outline: none;
}

.search-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-icon {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    width: 18px;
    height: 18px;
}

.clear-btn {
    position: absolute;
    right: 45px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
    transition: all 0.2s ease;
}

.clear-btn:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #666;
}

/* List Styles */
.list {
    flex: 1;
    padding: 30px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 25px;
    align-content: start;
}

.list::-webkit-scrollbar {
    width: 8px;
}

.list::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
}

.list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

.list::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

.template-item {
    height: fit-content;
}

.template-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
}

.template-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.delete-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease;
    color: #e74c3c;
}

.delete-btn:hover {
    background: #e74c3c;
    color: white;
    transform: scale(1.1);
}

.image-container {
    position: relative;
    height: 200px;
    overflow: hidden;
    cursor: pointer;
    background: #f0f0f0;
}

.image-container img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: all 0.3s ease;
}

.image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: all 0.3s ease;
    gap: 8px;
}

.image-container:hover .image-overlay {
    opacity: 1;
}

.image-container:hover img {
    transform: scale(1.05);
}

.preview-icon {
    width: 32px;
    height: 32px;
}

.template-info {
    padding: 20px;
}

.template-name {
    font-size: 18px;
    font-weight: 700;
    color: #2c3e50;
    margin: 0 0 15px 0;
    line-height: 1.3;
}

.template-details {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #7f8c8d;
    font-size: 13px;
    font-weight: 500;
}

.detail-icon {
    width: 16px;
    height: 16px;
}

.apply-btn {
    width: 100%;
    background: #6366f1;
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.apply-btn:hover {
    transform: translateY(-2px);
    background: #4f46e5;
    box-shadow: 0 8px 25px rgba(99, 102, 241, 0.3);
}

/* Empty State */
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    padding: 40px;
}

.empty-icon {
    width: 80px;
    height: 80px;
    opacity: 0.6;
    margin-bottom: 20px;
}

.empty-state h3 {
    font-size: 24px;
    margin-bottom: 10px;
    font-weight: 600;
}

.empty-state p {
    font-size: 16px;
    opacity: 0.8;
    max-width: 400px;
    line-height: 1.5;
}

/* Modal Styles */
.image-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
}

.modal-content {
    background: white;
    border-radius: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
}

.close-modal-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: all 0.3s ease;
}

.close-modal-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
}

.preview-container {
    max-height: 70vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f8f9fa;
}

.preview-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.modal-footer {
    padding: 25px;
    background: #6366f1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: white;
}

.preview-info h3 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 10px;
}

.preview-details {
    display: flex;
    gap: 10px;
}

.detail-badge {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 12px;
    border-radius: 15px;
    font-size: 12px;
    font-weight: 500;
}

.modal-apply-btn {
    background: rgba(255, 255, 255, 0.2);
    border: 2px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
}

.modal-apply-btn:hover {
    background: white;
    color: #6366f1;
    transform: translateY(-2px);
}

/* Icons */
.icon {
    width: 20px;
    height: 20px;
}

.icon-small {
    width: 16px;
    height: 16px;
}

/* Responsive */
@media (max-width: 768px) {
    .template {
        padding: 10px;
    }
    
    .template-content {
        width: 100%;
        height: 95vh;
    }
    
    .header {
        flex-direction: column;
        gap: 15px;
        padding: 15px 20px;
    }
    
    .search-container {
        max-width: 100%;
    }
    
    .list {
        grid-template-columns: 1fr;
        padding: 20px;
        gap: 20px;
    }
    
    .modal-footer {
        flex-direction: column;
        gap: 15px;
        text-align: center;
    }
}
</style>