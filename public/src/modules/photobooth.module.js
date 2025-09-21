import request from "../../utils/request"
const baseUrl = import.meta.env.VITE_API_URL
class photobooth {
    constructor() { }
    
    upload_base64(base64) {
        return new Promise((resolve, reject) => {
            request.post('/upload-base64', { base64 })
                .then(result => resolve(`${baseUrl}${result.data.path}`))
                .catch(err => reject(err))
        })
    }

    // Hàm upload nhiều ảnh base64
    async uploadAll(base64Array) {
        try {
            // Chạy tất cả request song song
            const results = await Promise.all(
                base64Array.map(async (base64) => {
                    const data = await this.upload_base64(base64)
                    return data
                })
            )
            return results
        } catch (err) {
            return err
        }
    }

}

export default photobooth
