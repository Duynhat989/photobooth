<template>
  <div id="app">
    <div v-if="currentView === 'main'" class="main-screen">
      <div class="container">
        <div class="title-over">
          <h1 class="title">Ứng Dụng Chụp Ảnh</h1>

          <!-- Camera Selection -->
          <div class="camera-selection">
            <h3>Chọn Camera</h3>
            <select v-model="selectedCameraId" @change="updateSelectedCamera" class="camera-select">
              <option value="">-- Chọn camera --</option>
              <option v-for="camera in availableCameras" :key="camera.deviceId" :value="camera.deviceId">
                {{ camera.label || `Camera ${camera.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <!-- Categories Section -->
          <div class="categories-section">
            <div class="section-header">
              <h3>Danh Mục</h3>
              <button @click="showAddModal = true" class="add-btn">
                <Plus class="btn-icon" />
                Thêm
              </button>
            </div>

            <div class="category-list">
              <div v-for="category in categories" :key="category.id" class="category-row"
                :class="{ active: selectedCategoryId === category.id }">
                <div class="category-info" @click="selectCategory(category.id)">
                  <span class="category-name">{{ category.name }}</span>
                </div>
                <div class="category-actions">
                  <button @click="editCategory(category)" class="action-btn edit" title="Sửa">
                    <Edit class="action-icon" />
                  </button>
                  <button @click="deleteCategory(category.id)" class="action-btn delete" title="Xóa">
                    <Trash class="action-icon" />
                  </button>
                </div>
              </div>

              <div v-if="categories.length === 0" class="empty-state">
                <span>Chưa có danh mục nào. Nhấn "Thêm" để tạo danh mục mới.</span>
              </div>
            </div>
          </div>

          <!-- Mode Buttons -->
          <div class="mode-buttons">
            <button @click="goToAutoMode" :disabled="!selectedCameraId || !selectedCategoryId" class="mode-btn">
              <Camera class="icon" />
              <span>Chụp Tự Động</span>
              <small>Auto Mode</small>
            </button>
            <button @click="goToManualMode" :disabled="!selectedCameraId || !selectedCategoryId" class="mode-btn">
              <Settings class="icon" />
              <span>Chụp Thủ Công</span>
              <small>Manual Mode</small>
            </button>
          </div>

          <!-- Save Location -->
          <div class="save-location">
            <div class="save-options">
              <button class="save-btn">
                <Settings class="icon" />
                Cài đặt
              </button>
              <button class="save-btn">
                <Folder class="icon" />
                Kho ảnh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModal">
      <div class="modal" @click.stop>
        <div class="modal-header">
          <h3>{{ showAddModal ? 'Thêm Danh Mục' : 'Sửa Danh Mục' }}</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <input v-model="categoryForm.name" type="text" placeholder="Tên danh mục" class="form-input"
            @keyup.enter="saveCategory" />
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn-cancel">Hủy</button>
          <button @click="saveCategory" :disabled="!categoryForm.name.trim()" class="btn-save">
            {{ showAddModal ? 'Thêm' : 'Cập nhật' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Other Views -->
    <AutoShoot v-else-if="currentView === 'auto'" :selectedCameraId="selectedCameraId"
      :selectedCategoryId="selectedCategoryId" :saveLocation="saveLocation" :customSavePath="customSavePath"
      @back="currentView = 'main'" @photosSelected="handlePhotosSelected" />

    <ManualShoot v-else-if="currentView === 'manual'" :selectedCameraId="selectedCameraId"
      :selectedCategoryId="selectedCategoryId" :saveLocation="saveLocation" :customSavePath="customSavePath"
      @back="currentView = 'main'" @photosSelected="handlePhotosSelected" />

    <SelectPhoto v-else-if="currentView === 'select'" :photos="capturedPhotos" @back="goBack"
      @photosSelected="handleFinalSelection" />

    <PrintPhoto v-else-if="currentView === 'print'" :selectedPhotos="selectedPhotos" :saveLocation="saveLocation"
      :customSavePath="customSavePath" @back="currentView = 'select'" @done="currentView = 'main'" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Camera, Settings, Download, Folder, Plus, Edit, Trash, X } from 'lucide-vue-next'
import AutoShoot from './components/AutoShoot.vue'
import ManualShoot from './components/ManualShoot.vue'
import SelectPhoto from './components/SelectPhoto.vue'
import PrintPhoto from './components/PrintPhoto/PrintPhoto.vue'
import request from '../utils/request'

// Reactive data
const currentView = ref('main')
const capturedPhotos = ref([])
const selectedPhotos = ref([])
const previousView = ref('main')

// Camera
const availableCameras = ref([])
const selectedCameraId = ref('')

// Categories
const categories = ref([])
const selectedCategoryId = ref('')
const showAddModal = ref(false)
const showEditModal = ref(false)
const categoryForm = ref({ id: null, name: '' })

// Save location
const saveLocation = ref('downloads')
const customSavePath = ref('')

// Category API methods
const fetchCategories = async () => {
  try {
    const result = await request.get('categories')
    const data = result.data
    console.log("categories: ", data)
    if (data) {
      categories.value = data
      // Auto-select first category
      if (categories.value.length > 0 && !selectedCategoryId.value) {
        selectedCategoryId.value = categories.value[0].id
        const catego = categories.value.find(c => c.id === selectedCategoryId.value)
        document.title = `${document.title.split('|')[0]} | ${catego.name}`
      }
    }
  } catch (err) {
    console.log("err: ", err)
    alert('Lỗi khi tải danh mục')
  }
}

const saveCategory = async () => {
  if (!categoryForm.value.name.trim()) return

  try {
    let result
    if (showAddModal.value) {
      // Add new category
      result = await request.post('categories', {
        name: categoryForm.value.name
      })
      if (result.data) {
        categories.value.push(result.data)
      } else {
        alert('Thêm thất bại!')
      }
    } else {
      // Update existing category
      result = await request.put(`categories/${categoryForm.value.id}`, {
        name: categoryForm.value.name
      })
      const index = categories.value.findIndex(c => c.id === categoryForm.value.id)
      if (index !== -1) {
        categories.value[index] = result.data
      }
    }
    closeModal()
  } catch (err) {
    console.log("err: ", err)
    alert('Lỗi khi lưu danh mục')
  }
}

const deleteCategory = async (id) => {
  if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return

  try {
    await request.delete(`categories/${id}`)
    categories.value = categories.value.filter(c => c.id !== id)

    // Reset selection if deleted category was selected
    if (selectedCategoryId.value === id) {
      selectedCategoryId.value = categories.value.length > 0 ? categories.value[0].id : ''
    }

  } catch (err) {
    console.log("err: ", err)
    alert('Lỗi khi xóa danh mục')
  }
}

// Category UI methods
const selectCategory = (categoryId) => {
  selectedCategoryId.value = categoryId
  const catego = categories.value.find(c => c.id === categoryId)
  document.title = `${document.title.split('|')[0]} | ${catego.name}`
}

const editCategory = (category) => {
  categoryForm.value = {
    id: category.id,
    name: category.name
  }
  showEditModal.value = true
}

const closeModal = () => {
  showAddModal.value = false
  showEditModal.value = false
  categoryForm.value = { id: null, name: '' }
}

// Camera methods
const getAvailableCameras = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true })
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')

    if (availableCameras.value.length > 0 && !selectedCameraId.value) {
      selectedCameraId.value = availableCameras.value[0].deviceId
    }
  } catch (error) {
    console.error('Error getting cameras:', error)
    alert('Không thể truy cập camera. Vui lòng cấp quyền truy cập camera.')
  }
}

const updateSelectedCamera = () => {
  console.log('Selected camera:', selectedCameraId.value)
}

// Navigation methods
const goToAutoMode = () => {
  if (!selectedCameraId.value) {
    alert('Vui lòng chọn camera trước khi tiếp tục')
    return
  }
  if (!selectedCategoryId.value) {
    alert('Vui lòng chọn danh mục trước khi tiếp tục')
    return
  }
  previousView.value = 'main'
  currentView.value = 'auto'
}

const goToManualMode = () => {
  if (!selectedCameraId.value) {
    alert('Vui lòng chọn camera trước khi tiếp tục')
    return
  }
  if (!selectedCategoryId.value) {
    alert('Vui lòng chọn danh mục trước khi tiếp tục')
    return
  }
  previousView.value = 'main'
  currentView.value = 'manual'
}

const handlePhotosSelected = (photos) => {
  capturedPhotos.value = photos
  previousView.value = currentView.value
  currentView.value = 'select'
}

const handleFinalSelection = (photos) => {
  selectedPhotos.value = photos
  currentView.value = 'print'
}

const goBack = () => {
  currentView.value = previousView.value
}

// Lifecycle
onMounted(() => {
  getAvailableCameras()
  fetchCategories()
})
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  height: 100vh;
}

.main-screen {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  overflow-y: auto;
}

.container {
  text-align: center;
  padding: 2rem;
  border-radius: 20px;
  max-width: 800px;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-weight: 300;
  color: #1e40af;
}

/* Camera Selection */
.camera-selection {
  margin-bottom: 2rem;
}

.camera-selection h3 {
  color: #1e40af;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.camera-select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.camera-select:focus {
  outline: none;
  border-color: #1e40af;
}

/* Categories - Compact Design */
.categories-section {
  margin-bottom: 2rem;
  text-align: left;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h3 {
  color: #1e40af;
  font-size: 1.2rem;
  margin: 0;
}

.add-btn {
  background: #1e40af;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.add-btn:hover {
  background: #1d4ed8;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.category-list {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  max-height: 200px;
  overflow-y: auto;
}

.category-list::-webkit-scrollbar {
  width: 5px;
}

.category-list::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 5px;
}

.category-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem;
  border-bottom: 1px solid #f3f4f6;
  margin: 5px;
}

.category-row:last-child {
  border-bottom: none;
}

.category-info {
  flex: 1;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.category-info:hover {
  background: #f9fafb;
}

.category-row.active {
  background: #f0f4ff;
  border: 1px solid #1e40af;
  border-radius: 8px;
}

.category-name {
  font-weight: 600;
  color: #1f2937;
  display: block;
}

.category-desc {
  font-size: 0.8rem;
  color: #6b7280;
  display: block;
  margin-top: 0.25rem;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.375rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
}

.action-btn.edit:hover {
  background: #dbeafe;
}

.action-btn.delete:hover {
  background: #fef2f2;
}

.action-icon {
  width: 14px;
  height: 14px;
}

.action-btn.edit .action-icon {
  color: #1e40af;
}

.action-btn.delete .action-icon {
  color: #dc2626;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  color: #1e40af;
  font-size: 1.1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.5rem;
  color: #6b7280;
  padding: 0.25rem;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 1rem;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1e40af;
}

.form-textarea {
  resize: vertical;
  font-family: monospace;
  font-size: 0.9rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel,
.btn-save {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f3f4f6;
  color: #374151;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-save {
  background: #1e40af;
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-save:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

/* Mode buttons and other existing styles */
.mode-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.mode-btn {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 2rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 180px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.mode-btn:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border-color: #1e40af;
}

.mode-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.mode-btn .icon {
  width: 48px;
  height: 48px;
  color: #1e40af;
}

.mode-btn span {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1e40af;
}

.mode-btn small {
  font-size: 0.9rem;
  color: #6b7280;
  font-weight: 400;
}

.mode-btn:disabled .icon,
.mode-btn:disabled span {
  color: #9ca3af;
}

.save-location {
  margin: 2rem 0;
}

.save-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.save-btn {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.save-btn:hover {
  border-color: #1e40af;
}

.save-btn .icon {
  width: 20px;
  height: 20px;
}
</style>