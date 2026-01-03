export class SlideManager {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        this.currentIndex = 0;
        this.totalSlides = this.slides.length;

        this.uiOverlay = document.getElementById('ui-overlay');
        this.prevBtn = document.getElementById('prev-btn');
        this.nextBtn = document.getElementById('next-btn');
        this.currentSlideEl = document.getElementById('current-slide');
        this.fullscreenBtn = document.getElementById('fullscreen-btn');
        this.container = document.getElementById('presentation-container');
        this.pipCamera = document.getElementById('pip-camera');
        this.toggleCameraBtn = document.getElementById('toggle-camera-btn');
        this.cameraToggleBtn = document.getElementById('camera-toggle-btn');
        this.tutorialModal = document.getElementById('tutorial-modal');
        this.startBtn = document.getElementById('start-btn');

        this.uiTimeout = null;
        this.uiHideDelay = 3000;

        this.initListeners();
        this.initAutoHide();
    }

    initListeners() {
        this.prevBtn.addEventListener('click', () => this.prevSlide());
        this.nextBtn.addEventListener('click', () => this.nextSlide());
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
        this.toggleCameraBtn.addEventListener('click', () => this.togglePiP());
        this.cameraToggleBtn.addEventListener('click', () => this.toggleCamera());

        this.startBtn.addEventListener('click', () => {
            this.tutorialModal.classList.add('hidden');
            document.dispatchEvent(new Event('start-camera'));
        });

        // GESTOS
        document.addEventListener('gesture-next', () => {
            console.log('[GESTO] Siguiente');
            this.nextSlide();
        });
        document.addEventListener('gesture-prev', () => {
            console.log('[GESTO] Anterior');
            this.prevSlide();
        });

        // CAMERA STATE CHANGES (from gesture or button)
        document.addEventListener('camera-state-changed', (event) => {
            const isActive = event.detail.active;
            console.log(`[CÁMARA] Estado: ${isActive ? 'ON' : 'OFF'}`);
            
            if (!isActive) {
                // Detener la cámara de gestos
                if (window.gestureProcessor) {
                    window.gestureProcessor.stop();
                }
            } else {
                // Reactivar la cámara de gestos
                if (window.gestureProcessor) {
                    window.gestureProcessor.start();
                }
            }
        });
    }

    initAutoHide() {
        document.addEventListener('mousemove', () => {
            this.showUI();
            this.resetHideTimer();
        });

        document.addEventListener('touchstart', () => {
            this.showUI();
            this.resetHideTimer();
        });

        this.uiOverlay.addEventListener('mouseenter', () => clearTimeout(this.uiTimeout));
        this.uiOverlay.addEventListener('mouseleave', () => this.resetHideTimer());

        this.resetHideTimer();
    }

    showUI() {
        this.uiOverlay.style.opacity = '1';
        this.uiOverlay.style.transform = 'translate(-50%, 0)';
    }

    hideUI() {
        this.uiOverlay.style.opacity = '0';
        this.uiOverlay.style.transform = 'translate(-50%, 20px)';
    }

    resetHideTimer() {
        clearTimeout(this.uiTimeout);
        this.uiTimeout = setTimeout(() => this.hideUI(), this.uiHideDelay);
    }

    updateSlides() {
        this.slides.forEach((slide, index) => {
            if (index === this.currentIndex) {
                slide.classList.remove('opacity-0');
                slide.classList.add('opacity-100');
            } else {
                slide.classList.remove('opacity-100');
                slide.classList.add('opacity-0');
            }
        });
        this.currentSlideEl.innerText = this.currentIndex + 1;

        const tooltipCurrent = document.getElementById('current-slide-tooltip');
        if (tooltipCurrent) tooltipCurrent.innerText = this.currentIndex + 1;
    }

    nextSlide() {
        if (this.currentIndex < this.totalSlides - 1) {
            this.currentIndex++;
            this.updateSlides();
        }
    }

    prevSlide() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateSlides();
        }
    }

    toggleFullscreen() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement);

        const elem = this.container;

        if (!isCurrentlyFullscreen) {
            let fullscreenPromise;
            if (elem.requestFullscreen) fullscreenPromise = elem.requestFullscreen();
            else if (elem.webkitRequestFullscreen) fullscreenPromise = elem.webkitRequestFullscreen();
            else if (elem.mozRequestFullScreen) fullscreenPromise = elem.mozRequestFullScreen();
            else if (elem.msRequestFullscreen) fullscreenPromise = elem.msRequestFullscreen();

            if (fullscreenPromise && fullscreenPromise.then) {
                fullscreenPromise.then(() => {
                    const icon = this.fullscreenBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-expand');
                        icon.classList.add('fa-compress');
                    }
                }).catch(err => console.error('Fullscreen error:', err));
            }
        } else {
            let exitPromise;
            if (document.exitFullscreen) exitPromise = document.exitFullscreen();
            else if (document.webkitExitFullscreen) exitPromise = document.webkitExitFullscreen();
            else if (document.mozCancelFullScreen) exitPromise = document.mozCancelFullScreen();
            else if (document.msExitFullscreen) exitPromise = document.msExitFullscreen();

            if (exitPromise && exitPromise.then) {
                exitPromise.then(() => {
                    const icon = this.fullscreenBtn.querySelector('i');
                    if (icon) {
                        icon.classList.remove('fa-compress');
                        icon.classList.add('fa-expand');
                    }
                }).catch(err => console.error('Exit fullscreen error:', err));
            }
        }
    }

    togglePiP() {
        this.pipCamera.classList.toggle('hidden');
    }

    toggleCamera() {
        const icon = this.cameraToggleBtn.querySelector('i');
        const tooltip = this.cameraToggleBtn.querySelector('span');
        const isActive = icon.classList.contains('fa-video');

        if (isActive) {
            icon.classList.remove('fa-video');
            icon.classList.add('fa-video-slash');
            tooltip.textContent = 'Gestos OFF';
            this.cameraToggleBtn.classList.add('bg-red-600/50');
            document.dispatchEvent(new CustomEvent('camera-state-changed', { detail: { active: false } }));
        } else {
            icon.classList.remove('fa-video-slash');
            icon.classList.add('fa-video');
            tooltip.textContent = 'Gestos ON';
            this.cameraToggleBtn.classList.remove('bg-red-600/50');
            document.dispatchEvent(new CustomEvent('camera-state-changed', { detail: { active: true } }));
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.slideManager = new SlideManager();
    });
} else {
    window.slideManager = new SlideManager();
}
