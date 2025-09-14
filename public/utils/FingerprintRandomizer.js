class FingerprintRandomizer {
    constructor() {
        // Timezone IANA chuẩn (chọn lọc phổ biến)
        this.timezones = [
            // Mỹ
            "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
            "America/Phoenix", "America/Anchorage", "Pacific/Honolulu",
            // Châu Âu
            "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Rome", "Europe/Madrid",
            "Europe/Moscow", "Europe/Warsaw", "Europe/Istanbul",
            // Châu Á
            "Asia/Ho_Chi_Minh", "Asia/Bangkok", "Asia/Singapore", "Asia/Hong_Kong", "Asia/Tokyo",
            "Asia/Seoul", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai",
            // Châu Úc
            "Australia/Sydney", "Australia/Melbourne", "Australia/Perth",
            // Châu Phi & Nam Mỹ
            "Africa/Cairo", "Africa/Johannesburg", "America/Sao_Paulo", "America/Argentina/Buenos_Aires"
        ];

        // Fonts phổ biến trên các hệ điều hành
        this.fontsList = [
            // Windows
            ["Arial", "Verdana", "Tahoma", "Segoe UI", "Calibri"],
            ["Times New Roman", "Georgia", "Courier New", "Consolas"],
            // macOS
            ["Helvetica", "Geneva", "Lucida Grande", "Monaco"],
            ["San Francisco", "Gill Sans", "Palatino", "Optima"],
            // Linux
            ["Ubuntu", "Noto Sans", "Droid Sans", "DejaVu Sans"],
            ["Fira Sans", "Source Sans Pro", "PT Sans", "Cantarell"]
        ];

        // Độ phân giải màn hình phổ biến (Desktop & Laptop & Mobile)
        this.screenSizes = [
            // Desktop phổ biến
            { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040, colorDepth: 24, pixelDepth: 24 },
            { width: 2560, height: 1440, availWidth: 2560, availHeight: 1400, colorDepth: 24, pixelDepth: 24 },
            { width: 3840, height: 2160, availWidth: 3840, availHeight: 2120, colorDepth: 30, pixelDepth: 30 },
            // Laptop
            { width: 1366, height: 768, availWidth: 1366, availHeight: 738, colorDepth: 24, pixelDepth: 24 },
            { width: 1440, height: 900, availWidth: 1440, availHeight: 860, colorDepth: 24, pixelDepth: 24 },
            { width: 1600, height: 900, availWidth: 1600, availHeight: 860, colorDepth: 24, pixelDepth: 24 },
            { width: 1536, height: 864, availWidth: 1536, availHeight: 824, colorDepth: 24, pixelDepth: 24 }
        ];

        // Dung lượng RAM thực tế (Laptop, PC)
        this.ramOptions = [2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 128];

        // Card đồ họa thực tế
        this.webglVendors = [
            // NVIDIA
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce GTX 1050 Ti" },
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce GTX 1660 Super" },
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce RTX 2060" },
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce RTX 3060" },
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce RTX 3080" },
            { vendor: "NVIDIA Corporation", renderer: "NVIDIA GeForce RTX 4090" },
            // Intel
            { vendor: "Intel Inc.", renderer: "Intel(R) HD Graphics 520" },
            { vendor: "Intel Inc.", renderer: "Intel(R) UHD Graphics 620" },
            { vendor: "Intel Inc.", renderer: "Intel(R) Iris(TM) Plus Graphics 640" },
            { vendor: "Intel Inc.", renderer: "Intel(R) Iris Xe Graphics" },
            // AMD
            { vendor: "ATI Technologies Inc.", renderer: "AMD Radeon RX 580" },
            { vendor: "AMD", renderer: "AMD Radeon RX 5700 XT" },
            { vendor: "AMD", renderer: "AMD Radeon RX 6800 XT" },
            { vendor: "AMD", renderer: "AMD Radeon Pro 5600M" }
        ];
    }


    randomFromArray(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    randomMAC() {
        const hex = "0123456789ABCDEF";
        let mac = [];
        for (let i = 0; i < 6; i++) {
            mac.push(hex[Math.floor(Math.random() * 16)] + hex[Math.floor(Math.random() * 16)]);
        }
        return mac.join(":");
    }

    randomLocation() {
        // random gần như toàn cầu
        const lat = (Math.random() * 180 - 90).toFixed(4);   // -90 -> 90
        const lon = (Math.random() * 360 - 180).toFixed(4); // -180 -> 180
        return { latitude: parseFloat(lat), longitude: parseFloat(lon), accuracy: 30 };
    }

    generate() {
        const tz = this.randomFromArray(this.timezones);
        const fonts = this.randomFromArray(this.fontsList);
        const screen = this.randomFromArray(this.screenSizes);
        const ram = this.randomFromArray(this.ramOptions);
        const webgl = this.randomFromArray(this.webglVendors);

        return {
            timezone: tz,
            ...this.randomLocation(),
            fonts: fonts,
            screen: screen,
            ram: ram,
            mac: this.randomMAC(),
            webglVendor: webgl.vendor,
            webglRenderer: webgl.renderer
        };
    }
}

export default FingerprintRandomizer
// --- Cách dùng ---