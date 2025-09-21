<template>
    <div class="auto-shoot">
        <div class="header">
            <button @click="goBack" class="back-btn">
                <ArrowLeft class="icon" />
                Quay lại
            </button>
        </div>

        <div v-if="!isCapturing && !showResults" class="setup-screen">
            <div class="camera-preview">
                <video ref="videoRef" autoplay muted playsinline></video>
            </div>

            <div class="controls">
                <h3>Chọn số lượng ảnh</h3>
                <div class="count-buttons">
                    <button @click="selectCount(4)" :class="{ active: selectedCount === 4 }" class="count-btn">
                        4 ảnh
                    </button>
                    <button @click="selectCount(6)" :class="{ active: selectedCount === 6 }" class="count-btn">
                        6 ảnh
                    </button>
                    <button @click="selectCount(10)" :class="{ active: selectedCount === 10 }" class="count-btn">
                        10 ảnh
                    </button>
                    <button @click="selectCount(12)" :class="{ active: selectedCount === 12 }" class="count-btn">
                        12 ảnh
                    </button>
                </div>

                <button @click="startCapture" :disabled="!selectedCount || !cameraReady" class="start-btn">
                    <Camera class="icon" />
                    Bắt đầu chụp
                </button>
            </div>
        </div>

        <div v-if="isCapturing" class="capture-screen">
            <div class="capture">
                <div class="capture-preview">
                    <video ref="captureVideoRef" autoplay muted></video>
                    <canvas ref="canvasRef" style="display: none;"></canvas>
                </div>
                <div class="dely" :style="countdown == 0 ? `background: #ffffff9c;` : ``">
                    <div class="countdown" v-if="countdown > 0">{{ countdown }}</div>
                </div>
            </div>
            <div class="capture-info">
                <div class="capture-info__content">
                    <div class="progress-info">
                        <p class="count">{{ capturedCount }}/{{ selectedCount }}</p>
                        <p>
                            <Megaphone size="13" /> {{ txtCountDown }}
                        </p>
                    </div>
                    <div class="listPhotos">
                        <div class="photo" v-for="value in capturedPhotos">
                            <img :src="value" alt="">
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="showResults" class="results-screen">
            <div class="results-header">
                <h3>{{ capturedPhotos.length }} ảnh đã chụp</h3>
            </div>

            <div class="photo-grid">
                <div v-for="(photo, index) in capturedPhotos" :key="index" @click="togglePhoto(index)" :class="{
                    selected: selectedPhotos.includes(index),
                    disabled: selectedPhotos.length >= capturedCount && !selectedPhotos.includes(index)
                }" class="photo-item">
                    <img :src="photo" alt="Captured photo" />
                    <div v-if="selectedPhotos.includes(index)" class="check-mark">
                        <Check class="icon" />
                    </div>
                </div>
            </div>

            <div class="action-buttons">
                <button @click="retakePhotos" class="secondary-btn">
                    <RotateCcw class="icon" />
                    Chụp lại
                </button>
                <button @click="confirmSelection" :disabled="selectedPhotos.length !== capturedCount"
                    class="primary-btn">
                    <CheckCircle class="icon" />
                    Xác nhận ({{ selectedPhotos.length }}/{{ capturedCount }})
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft, Camera, Check, CheckCircle, RotateCcw, Megaphone } from 'lucide-vue-next'
const props = defineProps({
    selectedCameraId: {
        type: String,
        default: null
    },
    saveLocation: {
        type: String,
        default: 'downloads'
    },
    customSavePath: {
        type: String,
        default: ''
    }
})

// Define emits
const emit = defineEmits(['photosSelected', 'back'])
import clickSound from '@/assets/camera-shutter-314056.mp3';
import photobooth from '@/modules/photobooth.module';
// Template refs
const videoRef = ref(null)
const captureVideoRef = ref(null)
const canvasRef = ref(null)

// Reactive data
const selectedCount = ref(null)
const isCapturing = ref(false)
const showResults = ref(false)
const cameraReady = ref(false)
const capturedPhotos = ref([])
const capturedCount = ref(0)
const countdown = ref(0)
const selectedPhotos = ref([])
const stream = ref(null)

const txtCountDown = ref('')

// Methods
const initCamera = async () => {
    try {
        const constraints = {
            video: {
                aspectRatio: 3 / 2,
                facingMode: "user"
            }
        }

        // Sử dụng selectedCameraId nếu có, ngược lại dùng camera mặc định
        console.log(props.selectedCameraId)
        if (props.selectedCameraId) {
            constraints.video.deviceId = { exact: props.selectedCameraId }
        }
        stream.value = await navigator.mediaDevices.getUserMedia(constraints)
        await nextTick()
        if (videoRef.value) {
            videoRef.value.srcObject = stream.value
            cameraReady.value = true
        }
    } catch (error) {
        console.error('Error accessing camera:', error)
        alert('Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.')
    }
}
const stopCamera = () => {
    if (stream.value) {
        stream.value.getTracks().forEach(track => track.stop())
    }
}

const selectCount = (count) => {
    selectedCount.value = count
}

const startCapture = async () => {
    isCapturing.value = true
    capturedPhotos.value = []
    capturedCount.value = 0
    countdown.value = 10
    requestFullscreen()
    // Wait for DOM update
    await nextTick()

    // Setup capture video
    if (captureVideoRef.value && stream.value) {
        captureVideoRef.value.srcObject = stream.value
    }

    txtCountDown.value = '10s chuẩn bị...'
    const countdownInterval = setInterval(() => {
        countdown.value--
        if (countdown.value === 0) {
            clearInterval(countdownInterval)
            startPhotoSequence()
        }
    }, 1000)
}
let captureInterval
const startPhotoSequence = () => {
    const canvasEl = canvasRef.value
    const videoEl = captureVideoRef.value

    if (!canvasEl || !videoEl) {
        console.error('Canvas or video element not found')
        return
    }

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

    function playShutterSound() {
        const audio = new Audio(clickSound);
        audio.play().catch(err => {
            console.error('Không thể phát âm thanh:', err);
        });
    }
    countdown.value = 10
    captureInterval = setInterval(() => {
        countdown.value--
        txtCountDown.value = `Đếm ngược ${countdown.value}`
        if (countdown.value == 0) {
            if (capturedCount.value < selectedCount.value) {
                // Capture photo
                ctx.drawImage(
                    videoEl,
                    offsetX, offsetY, cropWidth, cropHeight,  // source
                    0, 0, cropWidth, cropHeight               // destination
                )
                const photoData = canvasEl.toDataURL('image/jpeg', 0.8)
                capturedPhotos.value.push(photoData)
                capturedCount.value++
                playShutterSound()
                setTimeout(() => {
                    countdown.value = 11;
                }, 300);
                if (capturedCount.value >= selectedCount.value) {
                    clearInterval(captureInterval)
                    isCapturing.value = false
                    showResults.value = true
                    parerChoose()
                }
            } else {
                clearInterval(captureInterval)
                isCapturing.value = false
                showResults.value = true
                parerChoose()
            }
        }
    }, 1000)
}

const togglePhoto = (index) => {
    if (capturedCount.value === null) return

    const photoIndex = selectedPhotos.value.indexOf(index)
    if (photoIndex > -1) {
        selectedPhotos.value.splice(photoIndex, 1)
    } else if (selectedPhotos.value.length < capturedCount.value) {
        selectedPhotos.value.push(index)
    }
}
const parerChoose = async () => {
    for (let index = 0; index < capturedPhotos.value.length; index++) {
        selectedPhotos.value.push(index)
    }
    exitFullscreenNew()
}
const retakePhotos = () => {
    showResults.value = false
    isCapturing.value = false
    capturedPhotos.value = []
    capturedCount.value = 0
    selectedPhotos.value = []
    capturedCount.value = null
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
    exitFullscreenNew()
    stopCamera()
    emit('back')
}

// Lifecycle hooks
onMounted(() => {
    initCamera()
})

onUnmounted(() => {
    stopCamera()
    try { if (captureInterval) clearInterval(captureInterval) } catch (error) { }
})

const requestFullscreen = () => {
    try {
        document.documentElement.requestFullscreen()
    } catch (error) { }
}

const exitFullscreenNew = () => {
    if (document.fullscreenElement) {
        document.exitFullscreen()
            .catch(err => console.error('Lỗi thoát fullscreen:', err));
    }
};

</script>

<style scoped>
.auto-shoot {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: white;
}

.header {
    color: var(--pre-color);
    padding: 1rem;
    display: flex;
    align-items: center;
    gap: 1rem;
    position: fixed;
    width: 100%;
    z-index: 999;
    cursor: pointer;
    justify-content: end;
}

.back-btn {
    background: none;
    border: none;
    color: var(--pre-color);
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

.icon {
    width: 20px;
    height: 20px;
}

.setup-screen {
    flex: 1;
    display: flex;
    gap: 2rem;
    padding: 2rem;
}

.camera-preview {
    flex: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
}

.camera-preview video {
    width: 100%;
    height: auto;
    object-fit: cover;
    border: 1px solid red;
}

.controls {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2rem;
}

.controls h3 {
    color: #1e40af;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.count-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.count-btn {
    padding: 1rem 2rem;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 1.1rem;
}

.count-btn:hover {
    border-color: #1e40af;
}

.count-btn.active {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
}

.start-btn {
    background: #1e40af;
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    transition: all 0.2s;
}

.start-btn:hover:not(:disabled) {
    background: #1d4ed8;
}

.start-btn:disabled {
    background: #9ca3af;
    cursor: not-allowed;
}

.capture-screen {
    display: flex;
    flex-wrap: nowrap;
    width: 100vw;
}

.capture {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
}

.capture-preview {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000000;
    padding: 5px;
}

.capture-preview video {
    width: calc(100vw);
    height: calc(100vh - 10px);
    object-fit: cover;
}

.dely {
    color: rgb(255, 64, 39);
    position: absolute;
    top: 10%;
    width: 100%;
    left: 0;
    height: 80%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.countdown {
    text-align: center;
    font-size: 7rem;
    font-weight: bold;
    margin-bottom: 1rem;
}

.countdown-txt {
    text-align: center;
    font-size: 3rem;
    font-weight: bold;
    margin-bottom: 1rem;
}


.capture-info {
    position: fixed;
    bottom: 10px;
    width: 100vw;
}

.capture-info__content {
    width: 1000px;
    height: 120px;
    margin: auto;
    background: rgba(160, 160, 160, 0.336);
    display: flex;
    border-radius: 10px;
}

.progress-info {
    font-weight: bold;
    border-radius: 15px;
    padding: 10px 15px;
    width: 200px;
}

.progress-info .count {
    font-size: 2.5rem;
    color: #0000009d;
}

.listPhotos {
    overflow-x: scroll;
    padding: 5px;
    display: flex;
    justify-content: start;
    gap: 10px;
}

.listPhotos::-webkit-scrollbar {
    height: 5px;
}

/* Track */
.listPhotos::-webkit-scrollbar-track {
    background: #f1f1f1;
}

/* Handle */
.listPhotos::-webkit-scrollbar-thumb {
    background: #888;
}

/* Handle on hover */
.listPhotos::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.listPhotos .photo {
    width: 100%;
    margin-top: 10px;
}

.listPhotos .photo img {
    width: auto;
    height: 90px;
    border: 1px solid #0044ff;
    border-radius: 5px;
}

.results-screen {
    flex: 1;
    padding: 2rem;
    overflow: auto;
}

.results-header {
    margin-bottom: 2rem;
}

.results-header h3 {
    color: #1e40af;
    font-size: 1.5rem;
    margin-bottom: 1rem;
}

.selection-buttons {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.keep-btn {
    padding: 0.75rem 1.5rem;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.keep-btn:hover {
    border-color: #1e40af;
}

.keep-btn.active {
    background: #1e40af;
    color: white;
    border-color: #1e40af;
}

.photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.photo-item {
    position: relative;
    aspect-ratio: 4/3;
    border-radius: 8px;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid transparent;
    transition: all 0.2s;
}

.photo-item:hover:not(.disabled) {
    transform: scale(1.05);
}

.photo-item.selected {
    border-color: #1e40af;
}

.photo-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
}

.action-buttons {
    display: flex;
    gap: 1rem;
    justify-content: center;
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
</style>