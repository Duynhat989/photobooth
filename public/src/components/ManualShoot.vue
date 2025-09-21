<template>
  <div class="manual-shoot">
    <div class="header">
      <button @click="goBack" class="back-btn">
        <ArrowLeft class="icon" />
        Quay lại
      </button>
      <h2>Chụp Thủ Công</h2>
      <div class="photo-counter">
        {{ capturedPhotos.length }} ảnh
      </div>
    </div>

    <div v-if="!showResults" class="capture-screen">
      <div class="camera-container">
        <div class="camera-preview">
          <video ref="video" autoplay muted playsinline></video>
          <canvas ref="canvas" style="display: none;"></canvas>

          <div class="camera-overlay">
            <div class="focus-frame"></div>
          </div>
        </div>

        <div class="camera-controls">
          <button @click="capturePhoto" :disabled="!cameraReady" class="capture-btn">
            <Camera class="icon" />
          </button>

          <button @click="finishCapture" :disabled="capturedPhotos.length === 0" class="finish-btn">
            <Check class="icon" />
            Hoàn tất
          </button>
        </div>
      </div>

      <div class="thumbnails-panel" v-if="capturedPhotos.length > 0">
        <h4>Ảnh đã chụp</h4>
        <div class="thumbnails-grid">
          <div v-for="(photo, index) in capturedPhotos" :key="index" class="thumbnail-item">
            <img :src="photo" alt="Captured photo" />
            <button @click="deletePhoto(index)" class="delete-btn">
              <Trash2 class="icon" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showResults" class="results-screen">
      <div class="results-header">
        <h3>{{ capturedPhotos.length }} ảnh đã chụp</h3>
        <p>Chọn những ảnh bạn muốn giữ lại</p>
      </div>

      <div class="photo-grid">
        <div v-for="(photo, index) in capturedPhotos" :key="index" @click="togglePhotoSelection(index)"
          :class="{ selected: selectedPhotos.includes(index) }" class="photo-item">
          <img :src="photo" alt="Captured photo" />
          <div v-if="selectedPhotos.includes(index)" class="check-mark">
            <Check class="icon" />
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <button @click="selectAll" class="secondary-btn">
          <CheckCircle class="icon" />
          Chọn tất cả
        </button>

        <button @click="selectNone" class="secondary-btn">
          <XCircle class="icon" />
          Bỏ chọn tất cả
        </button>

        <button @click="goBackToCapture" class="secondary-btn">
          <RotateCcw class="icon" />
          Chụp thêm
        </button>

        <button @click="confirmSelection" :disabled="selectedPhotos.length === 0" class="primary-btn">
          <CheckCircle class="icon" />
          Xác nhận ({{ selectedPhotos.length }})
        </button>
      </div>
    </div>

    <div v-if="isCapturing" class="capture-flash"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ArrowLeft, Camera, Check, CheckCircle, XCircle, RotateCcw, Trash2 } from 'lucide-vue-next'
import photobooth from '@/modules/photobooth.module'

// Props
const props = defineProps({
  selectedCameraId: {
    type: String,
    default: null
  },
  saveLocation: {
    type: String,
    default: 'downloads'
  }
})

// Emits
const emit = defineEmits(['photosSelected', 'back'])

// Refs
const video = ref(null)
const canvas = ref(null)

// Reactive data
const cameraReady = ref(false)
const capturedPhotos = ref([])
const selectedPhotos = ref([])
const showResults = ref(false)
const isCapturing = ref(false)
const stream = ref(null)
const initCamera = async () => {
  try {
    const constraints = {
      video: {
        aspectRatio: 3 / 2,
        facingMode: "user"
      }
    }

    // Sử dụng selectedCameraId nếu có, ngược lại dùng camera mặc định
    if (props.selectedCameraId) {
      constraints.video.deviceId = { exact: props.selectedCameraId }
    } else {
      constraints.video.facingMode = 'user'
    }

    stream.value = await navigator.mediaDevices.getUserMedia(constraints)
    video.value.srcObject = stream.value
    cameraReady.value = true
  } catch (error) {
    console.error('Error accessing camera:', error)

    // Nếu không thể sử dụng camera được chỉ định, thử với camera mặc định
    if (props.selectedCameraId) {
      try {
        stream.value = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1200 },
            height: { ideal: 800 },
            facingMode: 'user'
          }
        })
        video.value.srcObject = stream.value
        cameraReady.value = true
        console.warn('Fallback to default camera')
      } catch (fallbackError) {
        console.error('Fallback camera error:', fallbackError)
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
      }
    } else {
      alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
    }
  }
}

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach(track => track.stop())
  }
}

const capturePhoto = () => {
  if (!cameraReady.value) return

  isCapturing.value = true

  const canvasEl = canvas.value
  const videoEl = video.value
  const ctx = canvasEl.getContext('2d')

  // Tính toán kích thước với tỷ lệ 3:2
  const videoWidth = videoEl.videoWidth
  const videoHeight = videoEl.videoHeight

  // Tính toán kích thước crop để đảm bảo tỷ lệ 3:2
  let cropWidth, cropHeight, offsetX, offsetY

  const targetRatio = 3 / 2
  const currentRatio = videoWidth / videoHeight

  if (currentRatio > targetRatio) {
    // Video rộng hơn tỷ lệ mong muốn, crop chiều rộng
    cropHeight = videoHeight
    cropWidth = cropHeight * targetRatio
    offsetX = (videoWidth - cropWidth) / 2
    offsetY = 0
  } else {
    // Video cao hơn tỷ lệ mong muốn, crop chiều cao
    cropWidth = videoWidth
    cropHeight = cropWidth / targetRatio
    offsetX = 0
    offsetY = (videoHeight - cropHeight) / 2
  }

  // Set canvas size với tỷ lệ 3:2
  canvasEl.width = cropWidth
  canvasEl.height = cropHeight

  // Draw cropped video frame to canvas
  ctx.drawImage(
    videoEl,
    offsetX, offsetY, cropWidth, cropHeight,  // source
    0, 0, cropWidth, cropHeight               // destination
  )

  // Convert to data URL
  const photoData = canvasEl.toDataURL('image/jpeg', 0.9)
  capturedPhotos.value.push(photoData)

  // Flash effect
  setTimeout(() => {
    isCapturing.value = false
  }, 200)
}

const deletePhoto = (index) => {
  capturedPhotos.value.splice(index, 1)
  // Remove from selected if it was selected
  const selectedIndex = selectedPhotos.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedPhotos.value.splice(selectedIndex, 1)
  }
  // Adjust other selected indices
  selectedPhotos.value = selectedPhotos.value.map(i => i > index ? i - 1 : i)
}

const finishCapture = () => {
  if (capturedPhotos.value.length === 0) return

  showResults.value = true
  selectedPhotos.value = [...Array(capturedPhotos.value.length).keys()] // Select all by default
}

const togglePhotoSelection = (index) => {
  const selectedIndex = selectedPhotos.value.indexOf(index)
  if (selectedIndex > -1) {
    selectedPhotos.value.splice(selectedIndex, 1)
  } else {
    selectedPhotos.value.push(index)
  }
}

const selectAll = () => {
  selectedPhotos.value = [...Array(capturedPhotos.value.length).keys()]
}

const selectNone = () => {
  selectedPhotos.value = []
}

const goBackToCapture = () => {
  showResults.value = false
}

const confirmSelection = async () => {
    const selectedPhotoData = selectedPhotos.value.map(index => capturedPhotos.value[index])
    console.log(selectedPhotoData)

    const photo = new photobooth()
    const uploadResults = await photo.uploadAll(selectedPhotoData)
    console.log("Upload results:", uploadResults)

    emit('photosSelected', selectedPhotoData)
}


const goBack = () => {
  stopCamera()
  emit('back')
}

// Lifecycle hooks
onMounted(() => {
  initCamera()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<style scoped>
.manual-shoot {
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

.photo-counter {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
}

.capture-screen {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
}

.camera-container {
  flex: 2;
  display: flex;
  gap: 1rem;
}

.camera-preview {
  position: relative;
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-preview video {
  width: 100%;
  height: auto;
  border: 1px solid red;
  object-fit: cover;
}

.camera-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.focus-frame {
  width: 200px;
  height: 133px;
  /* 200 * 2/3 = 133.33 để đảm bảo tỷ lệ 3:2 */
  border: 2px solid white;
  border-radius: 8px;
  opacity: 0.7;
}

.camera-controls {
  padding: 1rem;
  margin: auto;
}

.capture-btn {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #1e40af;
  border: 4px solid white;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
  margin: auto;
  margin-bottom: 20px;
}

.capture-btn:hover:not(:disabled) {
  transform: scale(1.1);
  background: #1d4ed8;
}

.capture-btn:active {
  transform: scale(0.95);
}

.capture-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
}

.capture-btn .icon {
  width: 32px;
  height: 32px;
}

.finish-btn {
  background: white;
  border: 2px solid #1e40af;
  color: #1e40af;
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.finish-btn:hover:not(:disabled) {
  background: #1e40af;
  color: white;
}

.finish-btn:disabled {
  border-color: #9ca3af;
  color: #9ca3af;
  cursor: not-allowed;
}

.thumbnails-panel {
  flex: 1;
  background: #f8fafc;
  border-radius: 12px;
  padding: 1rem;
  overflow: auto;
}

.thumbnails-panel h4 {
  color: #1e40af;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.thumbnails-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 0.5rem;
}

.thumbnail-item {
  position: relative;
  aspect-ratio: 3/2;
  /* Tỷ lệ 3:2 cho thumbnails */
  border-radius: 8px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #dc2626;
  transform: scale(1.1);
}

.delete-btn .icon {
  width: 12px;
  height: 12px;
}

.results-screen {
  flex: 1;
  padding: 2rem;
  overflow: auto;
}

.results-header {
  text-align: center;
  margin-bottom: 2rem;
}

.results-header h3 {
  color: #1e40af;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.results-header p {
  color: #6b7280;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.photo-item {
  position: relative;
  aspect-ratio: 3/2;
  /* Tỷ lệ 3:2 cho ảnh trong grid */
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.2s;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.photo-item:hover {
  transform: scale(1.05);
}

.photo-item.selected {
  border-color: #1e40af;
  box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
}

.photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.secondary-btn,
.primary-btn {
  padding: 1rem 2rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  transition: all 0.2s;
}

.secondary-btn {
  background: white;
  border: 2px solid #6b7280;
  color: #6b7280;
}

.secondary-btn:hover {
  background: #f9fafb;
  border-color: #374151;
  color: #374151;
}

.primary-btn {
  background: #1e40af;
  color: white;
  border: none;
}

.primary-btn:hover:not(:disabled) {
  background: #1d4ed8;
}

.primary-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.capture-flash {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  opacity: 0.8;
  pointer-events: none;
  animation: flash 0.2s ease-out;
}

@keyframes flash {
  0% {
    opacity: 0;
  }

  50% {
    opacity: 0.8;
  }

  100% {
    opacity: 0;
  }
}

.icon {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .capture-screen {
    flex-direction: column;
  }

  .camera-container {
    flex: none;
    height: 60vh;
  }

  .thumbnails-panel {
    flex: none;
    max-height: 30vh;
  }

  .thumbnails-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .action-buttons {
    flex-direction: column;
  }

  .camera-controls {
    gap: 1rem;
  }

  .capture-btn {
    width: 60px;
    height: 60px;
  }

  .capture-btn .icon {
    width: 24px;
    height: 24px;
  }

  .focus-frame {
    width: 150px;
    height: 100px;
    /* 150 * 2/3 = 100 */
  }
}
</style>