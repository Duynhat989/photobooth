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
              <option 
                v-for="camera in availableCameras" 
                :key="camera.deviceId" 
                :value="camera.deviceId"
              >
                {{ camera.label || `Camera ${camera.deviceId.slice(0, 8)}...` }}
              </option>
            </select>
          </div>

          <!-- Save Location Selection -->
          <div class="save-location">
            <h3>Nơi Lưu Ảnh</h3>
            <div class="save-options">
              <button 
                @click="setSaveLocation('downloads')"
                :class="{ active: saveLocation === 'downloads' }"
                class="save-btn"
              >
                <Download class="icon" />
                Thư mục Downloads
              </button>
              <button 
                @click="setSaveLocation('custom')"
                :class="{ active: saveLocation === 'custom' }"
                class="save-btn"
              >
                <Folder class="icon" />
                Chọn thư mục khác
              </button>
            </div>
            <div v-if="customSavePath" class="custom-path">
              <p>Đường dẫn: {{ customSavePath }}</p>
            </div>
          </div>

          <div class="mode-buttons">
            <button 
              @click="goToAutoMode" 
              :disabled="!selectedCameraId"
              class="mode-btn"
            >
              <Camera class="icon" />
              <span>Chụp Tự Động</span>
              <small>Auto Mode</small>
            </button>
            <button 
              @click="goToManualMode" 
              :disabled="!selectedCameraId"
              class="mode-btn"
            >
              <Settings class="icon" />
              <span>Chụp Thủ Công</span>
              <small>Manual Mode</small>
            </button>
          </div>
        </div>
      </div>
    </div>

    <AutoShoot 
      v-else-if="currentView === 'auto'" 
      :selectedCameraId="selectedCameraId"
      :saveLocation="saveLocation"
      :customSavePath="customSavePath"
      @back="currentView = 'main'"
      @photosSelected="handlePhotosSelected"
    />
    
    <ManualShoot 
      v-else-if="currentView === 'manual'" 
      :selectedCameraId="selectedCameraId"
      :saveLocation="saveLocation"
      :customSavePath="customSavePath"
      @back="currentView = 'main'"
      @photosSelected="handlePhotosSelected"
    />

    <SelectPhoto 
      v-else-if="currentView === 'select'" 
      :photos="capturedPhotos"
      @back="goBack"
      @photosSelected="handleFinalSelection"
    />

    <PrintPhoto 
      v-else-if="currentView === 'print'" 
      :selectedPhotos="selectedPhotos"
      :saveLocation="saveLocation"
      :customSavePath="customSavePath"
      @back="currentView = 'select'"
      @done="currentView = 'main'"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Camera, Settings, Download, Folder } from 'lucide-vue-next'
import AutoShoot from './components/AutoShoot.vue'
import ManualShoot from './components/ManualShoot.vue'
import SelectPhoto from './components/SelectPhoto.vue'
import PrintPhoto from './components/PrintPhoto.vue'

// Reactive data
const currentView = ref('main')
const capturedPhotos = ref([])
const selectedPhotos = ref([])
const previousView = ref('main')

// Camera selection
const availableCameras = ref([])
const selectedCameraId = ref('')

// Save location
const saveLocation = ref('downloads') // 'downloads' or 'custom'
const customSavePath = ref('')

// Methods
const getAvailableCameras = async () => {
  try {
    // Request permission first
    await navigator.mediaDevices.getUserMedia({ video: true })
    
    const devices = await navigator.mediaDevices.enumerateDevices()
    availableCameras.value = devices.filter(device => device.kind === 'videoinput')
    
    // Auto-select first camera if available
    if (availableCameras.value.length > 0 && !selectedCameraId.value) {
      selectedCameraId.value = availableCameras.value[0].deviceId
    }
  } catch (error) {
    console.error('Error getting cameras:', error)
    alert('Không thể truy cập camera. Vui lòng cấp quyền truy cập camera.')
  }
}

const updateSelectedCamera = () => {
  // Camera selection changed
  console.log('Selected camera:', selectedCameraId.value)
}

const setSaveLocation = async (location) => {
  saveLocation.value = location
  
  if (location === 'custom') {
    try {
      // Use File System Access API if available (modern browsers)
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker()
        customSavePath.value = dirHandle.name
      } else {
        // Fallback for browsers that don't support File System Access API
        const input = document.createElement('input')
        input.type = 'file'
        input.webkitdirectory = true
        input.onchange = (e) => {
          if (e.target.files.length > 0) {
            const path = e.target.files[0].webkitRelativePath.split('/')[0]
            customSavePath.value = path
          }
        }
        input.click()
      }
    } catch (error) {
      console.log('User cancelled directory selection')
      saveLocation.value = 'downloads'
    }
  } else {
    customSavePath.value = ''
  }
}

const goToAutoMode = () => {
  if (!selectedCameraId.value) {
    alert('Vui lòng chọn camera trước khi tiếp tục')
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

// Lifecycle hooks
onMounted(() => {
  getAvailableCameras()
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
}

.container {
  text-align: center;
  padding: 2rem;
  border-radius: 20px;
  max-width: 600px;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-weight: 300;
  color: #1e40af;
}

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

.save-location {
  margin-bottom: 2rem;
}

.save-location h3 {
  color: #1e40af;
  margin-bottom: 1rem;
  font-size: 1.2rem;
}

.save-options {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.save-btn {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.save-btn:hover {
  border-color: #1e40af;
}

.save-btn.active {
  background: #1e40af;
  color: white;
  border-color: #1e40af;
}

.save-btn .icon {
  width: 20px;
  height: 20px;
}

.custom-path {
  background: #f3f4f6;
  padding: 0.75rem;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #6b7280;
}

.mode-buttons {
  display: flex;
  gap: 2rem;
  justify-content: center;
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

.mode-btn:active:not(:disabled) {
  transform: translateY(-2px);
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
</style>