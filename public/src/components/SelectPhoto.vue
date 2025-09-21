<template>
  <div class="select-photo">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="icon" />
        Quay lại
      </button>
      <h2>Chọn ảnh để in</h2>
      <div class="selection-info">
        {{ selectedPhotos.length }}/{{ photos.length }}
      </div>
    </div>

    <div class="content">
      <div class="selection-controls">
        <div class="control-group">
          <h3>Thao tác nhanh</h3>
          <div class="quick-actions">
            <button @click="selectAll" class="action-btn">
              <CheckCircle class="icon" />
              Chọn tất cả
            </button>
            <button @click="selectNone" class="action-btn">
              <XCircle class="icon" />
              Bỏ chọn tất cả
            </button>
            <button @click="selectBest" class="action-btn">
              <Star class="icon" />
              Chọn ảnh tốt nhất
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>Chọn theo số lượng</h3>
          <div class="preset-buttons">
            <button 
              v-for="count in [1, 2, 3, 4, 6, 8]" 
              :key="count"
              @click="selectByCount(count)"
              :class="{ active: selectedPhotos.length === count }"
              class="preset-btn"
            >
              {{ count }} ảnh
            </button>
          </div>
        </div>

        <div class="control-group">
          <h3>Xem trước</h3>
          <div class="view-options">
            <button 
              @click="viewMode = 'grid'" 
              :class="{ active: viewMode === 'grid' }"
              class="view-btn"
            >
              <Grid3X3 class="icon" />
              Lưới
            </button>
            <button 
              @click="viewMode = 'list'" 
              :class="{ active: viewMode === 'list' }"
              class="view-btn"
            >
              <List class="icon" />
              Danh sách
            </button>
          </div>
        </div>
      </div>

      <div class="photo-display">
        <div 
          :class="['photo-container', `view-${viewMode}`]"
          v-if="photos.length > 0"
        >
          <div 
            v-for="(photo, index) in photos" 
            :key="index"
            @click="togglePhoto(index)"
            :class="{ 
              selected: selectedPhotos.includes(index),
              'view-grid': viewMode === 'grid',
              'view-list': viewMode === 'list'
            }"
            class="photo-item"
          >
            <div class="photo-wrapper">
              <img :src="photo" :alt="`Photo ${index + 1}`" />
              
              <div class="photo-overlay">
                <div v-if="selectedPhotos.includes(index)" class="check-mark">
                  <Check class="icon" />
                </div>
                <div class="photo-number">{{ index + 1 }}</div>
              </div>

              <div class="photo-actions" v-if="viewMode === 'list'">
                <button 
                  @click.stop="previewPhoto(index)" 
                  class="preview-btn"
                  title="Xem chi tiết"
                >
                  <Eye class="icon" />
                </button>
                <button 
                  @click.stop="downloadPhoto(index)" 
                  class="download-btn"
                  title="Tải xuống"
                >
                  <Download class="icon" />
                </button>
              </div>
            </div>

            <div v-if="viewMode === 'list'" class="photo-info">
              <p class="photo-title">Ảnh {{ index + 1 }}</p>
              <p class="photo-status">
                {{ selectedPhotos.includes(index) ? 'Đã chọn' : 'Chưa chọn' }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <ImageOff class="empty-icon" />
          <h3>Không có ảnh nào</h3>
          <p>Vui lòng quay lại và chụp một số ảnh trước</p>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="selection-summary">
        <span v-if="selectedPhotos.length === 0" class="no-selection">
          Chưa chọn ảnh nào
        </span>
        <span v-else class="selection-count">
          Đã chọn {{ selectedPhotos.length }} ảnh
        </span>
      </div>
      
      <div class="action-buttons">
        <button 
          @click="confirmSelection" 
          :disabled="selectedPhotos.length === 0"
          class="confirm-btn"
        >
          <Printer class="icon" />
          Tiếp tục in ảnh
        </button>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="previewIndex !== null" class="modal-overlay" @click="closePreview">
      <div class="preview-modal" @click.stop>
        <div class="modal-header">
          <h3>Ảnh {{ previewIndex + 1 }}</h3>
          <button @click="closePreview" class="close-btn">
            <X class="icon" />
          </button>
        </div>
        <div class="modal-body">
          <img :src="photos[previewIndex]" alt="Preview" />
        </div>
        <div class="modal-footer">
          <button @click="togglePhoto(previewIndex)" class="modal-action-btn">
            {{ selectedPhotos.includes(previewIndex) ? 'Bỏ chọn' : 'Chọn ảnh' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Star, 
  Grid3X3, 
  List, 
  Check, 
  Eye, 
  Download, 
  ImageOff, 
  Printer, 
  X 
} from 'lucide-vue-next'

// Props
const props = defineProps({
  photos: {
    type: Array,
    default: () => []
  }
})

// Emits
const emit = defineEmits(['photosSelected', 'back'])

// Reactive data
const selectedPhotos = ref([])
const viewMode = ref('grid')
const previewIndex = ref(null)

// Methods
const togglePhoto = (index) => {
  const selectedIndex = selectedPhotos.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedPhotos.value.splice(selectedIndex, 1)
  } else {
    selectedPhotos.value.push(index)
  }
}

const selectAll = () => {
  selectedPhotos.value = [...Array(props.photos.length).keys()]
}

const selectNone = () => {
  selectedPhotos.value = []
}

const selectBest = () => {
  // Simple algorithm to select "best" photos - for demo purposes
  // In real app, this could use image quality metrics
  const bestIndices = []
  const step = Math.max(1, Math.floor(props.photos.length / 3))
  
  for (let i = 0; i < props.photos.length && bestIndices.length < 3; i += step) {
    bestIndices.push(i)
  }
  
  selectedPhotos.value = bestIndices
}

const selectByCount = (count) => {
  if (count > props.photos.length) {
    selectAll()
  } else {
    // Select first N photos or spread them evenly
    const step = Math.max(1, Math.floor(props.photos.length / count))
    const indices = []
    
    for (let i = 0; i < count; i++) {
      const index = Math.min(i * step, props.photos.length - 1)
      if (!indices.includes(index)) {
        indices.push(index)
      }
    }
    
    selectedPhotos.value = indices
  }
}

const previewPhoto = (index) => {
  previewIndex.value = index
}

const closePreview = () => {
  previewIndex.value = null
}

const downloadPhoto = (index) => {
  const link = document.createElement('a')
  link.href = props.photos[index]
  link.download = `photo-${index + 1}.jpg`
  link.click()
}

const confirmSelection = () => {
  if (selectedPhotos.value.length === 0) return
  
  const selectedPhotoData = selectedPhotos.value.map(index => props.photos[index])
  emit('photosSelected', selectedPhotoData)
}

const goBack = () => {
  emit('back')
}
</script>

<style scoped>
.select-photo {
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

.selection-info {
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

.selection-controls {
  width: 300px;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
}

.control-group {
  margin-bottom: 2rem;
}

.control-group:last-child {
  margin-bottom: 0;
}

.control-group h3 {
  color: #1e40af;
  font-size: 1rem;
  margin-bottom: 1rem;
  font-weight: 600;
}

.quick-actions, .view-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.action-btn, .view-btn {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.action-btn:hover, .view-btn:hover {
  background: #f9fafb;
  border-color: #1e40af;
}

.view-btn.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.preset-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.preset-btn {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.85rem;
}

.preset-btn:hover {
  border-color: #1e40af;
}

.preset-btn.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.photo-display {
  flex: 1;
  overflow: hidden;
}

.photo-container {
  overflow-y: auto;
  padding: 0.5rem;
}

.photo-container.view-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.photo-container.view-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-item {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.2s;
  background: white;
  border: 3px solid transparent;
}

.photo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.photo-item.selected {
  border-color: #1e40af;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
}

.photo-item.view-grid {
  aspect-ratio: 4/3;
}

.photo-item.view-list {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
}

.photo-wrapper {
  position: relative;
  flex-shrink: 0;
}

.photo-item.view-grid .photo-wrapper {
  width: 100%;
  height: 100%;
}

.photo-item.view-list .photo-wrapper {
  width: 120px;
  height: 90px;
  border-radius: 6px;
  overflow: hidden;
}

.photo-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-item:hover .photo-overlay,
.photo-item.selected .photo-overlay {
  opacity: 1;
}

.check-mark {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #1e40af;
  color: white;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.photo-number {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 12px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 600;
}

.photo-actions {
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
}

.preview-btn, .download-btn {
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

.preview-btn:hover, .download-btn:hover {
  background: #f9fafb;
  border-color: #1e40af;
}

.photo-info {
  flex: 1;
}

.photo-title {
  font-weight: 600;
  color: #1e40af;
  margin-bottom: 0.25rem;
}

.photo-status {
  color: #6b7280;
  font-size: 0.9rem;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #6b7280;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.footer {
  background: #f8fafc;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #e5e7eb;
}

.no-selection {
  color: #6b7280;
  font-style: italic;
}

.selection-count {
  color: #1e40af;
  font-weight: 600;
}

.confirm-btn {
  background: #1e40af;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
}

.confirm-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.confirm-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
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

.preview-modal {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: #f9fafb;
}

.modal-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  overflow: hidden;
}

.modal-body img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: center;
}

.modal-action-btn {
  background: #1e40af;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-action-btn:hover {
  background: #1d4ed8;
}

.icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .content {
    flex-direction: column;
  }
  
  .selection-controls {
    width: 100%;
    padding: 1rem;
  }
  
  .control-group {
    margin-bottom: 1rem;
  }
  
  .quick-actions, .view-options {
    flex-direction: row;
    gap: 0.5rem;
  }
  
  .action-btn, .view-btn {
    flex: 1;
    justify-content: center;
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .photo-container.view-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.5rem;
  }
  
  .photo-item.view-list {
    flex-direction: column;
    text-align: center;
    gap: 0.5rem;
  }
  
  .photo-item.view-list .photo-wrapper {
    width: 100%;
    height: 120px;
  }
  
  .footer {
    flex-direction: column;
    gap: 1rem;
  }
  
  .confirm-btn {
    width: 100%;
    justify-content: center;
  }
  
  .preview-modal {
    margin: 1rem;
  }
}
</style>