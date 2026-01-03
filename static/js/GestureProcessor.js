// GESTURE PROCESSOR - Sistema de detección de gestos con MediaPipe
// Optimizado: Detección simple - Levantar mano derecha/izquierda
export class GestureProcessor {
    constructor() {
        console.log('🔄 Iniciando GestureProcessor...');
        
        // === ELEMENTOS DOM ===
        this.videoElement = document.getElementById('input-video');
        this.canvasElement = document.getElementById('output-canvas');
        
        if (!this.videoElement || !this.canvasElement) {
            console.error('❌ Elementos requeridos no encontrados');
            return;
        }
        
        this.canvasCtx = this.canvasElement.getContext('2d');

        // === ESTADO GENERAL ===
        this.mediaStarted = false;
        this.camera = null;
        this.gestureState = 'NORMAL';
        this.cameraEnabled = true;

        // === TIMING Y COOLDOWN ===
        this.lastGestureTime = 0;
        this.cooldown = 800; // Cooldown para puños
        this.lastSlideChangeTime = 0;
        this.slideChangeCooldown = 1000; // Tiempo de espera entre cambios (1 segundo)
        this.lastHandState = null; // Rastrear estado anterior
        this.handStateFrames = 0; // Contador de frames
        this.requiredFrames = 5; // Requiere 5 frames consecutivos

        // === SUAVIZADO INTELIGENTE ===
        this.positionHistory = [];
        this.maxHistoryLength = 3;
        this.smoothingFactor = 0.6;

        // === DETECCIÓN DE PUÑO MEJORADA ===
        this.fistConfidenceThreshold = 0.75;
        this.fistCenterTolerance = 0.15;
        this.fistHorizontalTolerance = 0.10;
        this.fistConsecutiveFrames = 0;
        this.fistFramesRequired = 3;

        // === ELEMENTOS UI ===
        this.handDetectedEl = document.getElementById('hand-detected');
        this.fingersUpEl = document.getElementById('fingers-up');
        this.fistStatusEl = document.getElementById('fist-status');
        this.gestureTypeEl = document.getElementById('gesture-type');
        this.cameraEnabledStatusEl = document.getElementById('camera-enabled-status');
        this.gestureStatusEl = document.getElementById('gesture-status');

        console.log('✅ GestureProcessor inicializado');
        
        // Inicializar MediaPipe
        this.initMediaPipe();
        this.initListeners();
        
        // INICIAR CÁMARA AUTOMÁTICAMENTE
        setTimeout(() => {
            if (!this.mediaStarted) {
                this.startCamera();
            }
        }, 1000);
    }

    // ========== INICIALIZACIONES ==========
    
    initListeners() {
        document.addEventListener('start-camera', () => {
            console.log('📹 Evento start-camera recibido');
            this.startCamera();
        });
        
        document.addEventListener('camera-state-changed', (e) => {
            this.cameraEnabled = e.detail.active;
            console.log(`📹 Estado cámara: ${this.cameraEnabled ? 'ON' : 'OFF'}`);
        });
    }

    initMediaPipe() {
        try {
            console.log('📹 Inicializando MediaPipe Hands...');
            
            if (typeof Hands === 'undefined') {
                console.error('❌ Hands no está disponible - MediaPipe no cargó correctamente');
                alert('Error: MediaPipe Hands no cargó. Recarga la página.');
                return;
            }
            
            this.hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                }
            });

            this.hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            this.hands.onResults((results) => this.onResults(results));
            
            console.log('✅ MediaPipe Hands inicializado correctamente');
        } catch (e) {
            console.error('❌ Error al inicializar MediaPipe:', e);
            alert('Error al inicializar MediaPipe: ' + e.message);
        }
    }

    // ========== INICIO DE CÁMARA ==========
    
    async startCamera() {
        if (!this.videoElement || !this.canvasElement || !this.canvasCtx) {
            console.error('❌ Elementos de video/canvas no disponibles');
            return;
        }

        if (this.mediaStarted) {
            console.log('⚠️ Cámara ya iniciada');
            return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('❌ getUserMedia no está disponible en este navegador');
            alert('Tu navegador no soporta acceso a cámara');
            return;
        }

        try {
            console.log('📹 Solicitando permisos de cámara...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });
            
            console.log('✅ Permisos de cámara otorgados');
            this.videoElement.srcObject = stream;
            
            this.videoElement.play().catch(err => {
                console.error('❌ Error al reproducir video:', err);
            });

            return new Promise((resolve) => {
                this.videoElement.onloadedmetadata = async () => {
                    console.log('✅ Video metadata cargado');
                    
                    try {
                        if (!window.Camera) {
                            console.error('❌ Camera (control_utils) no está cargado');
                            alert('Error: Camera library no cargó');
                            return;
                        }

                        console.log('📹 Creando Camera de MediaPipe...');
                        this.camera = new Camera(this.videoElement, {
                            onFrame: async () => {
                                try {
                                    await this.hands.send({ image: this.videoElement });
                                } catch (e) {
                                    // Silencioso
                                }
                            },
                            width: 640,
                            height: 480
                        });

                        console.log('📹 Iniciando flujo de cámara...');
                        await this.camera.start();
                        this.mediaStarted = true;
                        console.log('✅ CÁMARA INICIADA CORRECTAMENTE');
                        resolve();
                        
                    } catch (e) {
                        console.error('❌ Error con Camera de MediaPipe:', e);
                        this.camera = null;
                    }
                };

                setTimeout(() => {
                    if (!this.mediaStarted) {
                        console.error('❌ TIMEOUT: Cámara no se inició en 5 segundos');
                    }
                    resolve();
                }, 5000);
            });

        } catch (e) {
            console.error('❌ Error al solicitar cámara:', e.name);
            
            if (e.name === 'NotAllowedError') {
                alert('❌ Debes permitir acceso a la cámara para usar gestos');
            } else if (e.name === 'NotFoundError') {
                alert('❌ No se encontró cámara en tu dispositivo');
            } else {
                alert('❌ Error al acceder a la cámara');
            }
        }
    }

    // ========== DETECCIÓN DE GESTOS ==========
    
    onResults(results) {
        if (!this.canvasCtx || !this.canvasElement) {
            console.error('❌ Canvas context no disponible');
            return;
        }

        this.canvasCtx.save();
        this.canvasCtx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        if (results.image) {
            try {
                this.canvasCtx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
            } catch (e) {
                console.error('❌ Error al dibujar imagen:', e);
            }
        } else {
            this.canvasCtx.fillStyle = '#000000';
            this.canvasCtx.fillRect(0, 0, this.canvasElement.width, this.canvasElement.height);
            this.canvasCtx.fillStyle = '#FF0000';
            this.canvasCtx.font = '20px Arial';
            this.canvasCtx.fillText('❌ Sin imagen de MediaPipe', 10, 30);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const handedness = results.multiHandedness ? results.multiHandedness[0] : null;

            try {
                drawConnectors(this.canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
                drawLandmarks(this.canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 });
            } catch (e) {
                console.error('❌ Error al dibujar landmarks:', e);
            }

            this.detectGestures(landmarks, handedness);
        } else {
            this.resetGestureState();
        }

        this.canvasCtx.restore();
    }

    resetGestureState() {
        if (this.handDetectedEl) this.handDetectedEl.textContent = '❌ No detectada';
        if (this.fingersUpEl) this.fingersUpEl.textContent = '0';
        if (this.fistStatusEl) {
            this.fistStatusEl.textContent = '- N/A -';
            this.fistStatusEl.className = 'text-gray-400';
        }
        if (this.gestureTypeEl) {
            this.gestureTypeEl.textContent = 'Ninguno';
            this.gestureTypeEl.className = 'text-gray-400';
        }
        this.handStateFrames = 0;
        this.lastHandState = null;
        this.fistConsecutiveFrames = 0;
    }

    // Suavizar posición
    smoothPosition(currentX) {
        this.positionHistory.push(currentX);
        if (this.positionHistory.length > this.maxHistoryLength) {
            this.positionHistory.shift();
        }

        let smoothedX = 0;
        let totalWeight = 0;
        for (let i = 0; i < this.positionHistory.length; i++) {
            const weight = Math.pow(this.smoothingFactor, this.positionHistory.length - i - 1);
            smoothedX += this.positionHistory[i] * weight;
            totalWeight += weight;
        }
        return smoothedX / totalWeight;
    }

    detectGestures(landmarks, handedness) {
        const currentTime = Date.now();
        const handLabel = handedness.label; // 'Left' (DERECHA) o 'Right' (IZQUIERDA)
        const fingersUp = this.countFingersUp(landmarks);
        const fistAnalysis = this.analyzeFist(landmarks);
        const isRealFist = fistAnalysis.isFist;
        const timeSinceLast = currentTime - this.lastGestureTime;

        // === ACTUALIZAR DISPLAY ===
        this.updateDisplay(handLabel, fingersUp, isRealFist, fistAnalysis);

        // === MÁQUINA DE ESTADOS ===
        
        // ESTADO 1: PUÑOS (máxima prioridad)
        if (isRealFist) {
            this.fistConsecutiveFrames++;
            if (this.fistConsecutiveFrames >= this.fistFramesRequired && timeSinceLast >= this.cooldown) {
                this.handleFistGesture(handLabel, currentTime);
                this.handStateFrames = 0;
                this.lastHandState = null;
                this.fistConsecutiveFrames = 0;
            }
        } else {
            this.fistConsecutiveFrames = 0;
        }

        // ESTADO 2: MANO ABIERTA - SIMPLE LIFT DETECTION
        if (this.gestureState === 'NORMAL' && !isRealFist && fingersUp > 0) {
            this.handleHandLift(handLabel, currentTime);
        }
        // ESTADO 3: ESPERANDO REACTIVACIÓN (en modo PAUSED)
        else if (this.gestureState === 'PAUSED' && !isRealFist && fingersUp > 0) {
            this.handStateFrames = 0;
            this.lastHandState = null;
            if (this.gestureTypeEl) {
                this.gestureTypeEl.textContent = '👊 Puño DERECHO para reactivar';
                this.gestureTypeEl.className = 'text-yellow-400 text-xs font-bold';
            }
        }
    }

    handleFistGesture(handLabel, currentTime) {
        // Puño IZQUIERDO (Right) - PAUSAR
        if (handLabel === 'Right' && this.gestureState === 'NORMAL') {
            console.log('⏸️ PUÑO IZQUIERDO - Pausando');
            this.gestureState = 'PAUSED';
            if (this.gestureTypeEl) {
                this.gestureTypeEl.textContent = '⏸️ PAUSADO';
                this.gestureTypeEl.className = 'text-orange-400 font-bold';
            }
            this.lastGestureTime = currentTime;
            this.showGestureNotification('⏸️ PAUSADO');
        }
        // Puño DERECHO (Left) - REACTIVAR
        else if (handLabel === 'Left' && this.gestureState === 'PAUSED') {
            console.log('▶️ PUÑO DERECHO - Reactivando');
            this.gestureState = 'NORMAL';
            if (this.gestureTypeEl) {
                this.gestureTypeEl.textContent = '▶️ REACTIVADO';
                this.gestureTypeEl.className = 'text-green-400 font-bold';
            }
            this.lastGestureTime = currentTime;
            this.showGestureNotification('▶️ REACTIVADO');
        }
    }

    handleHandLift(handLabel, currentTime) {
        // Detectar si la mano cambió de estado (de cerrada a abierta)
        const currentState = handLabel;
        
        // Si es la misma mano, incrementar contador
        if (this.lastHandState === currentState) {
            this.handStateFrames++;
        } else {
            // Cambió de mano, resetear
            this.handStateFrames = 1;
            this.lastHandState = currentState;
        }

        // Si alcanzó los frames requeridos, disparar gesto
        if (this.handStateFrames >= this.requiredFrames) {
            const timeSinceLastSlideChange = currentTime - this.lastSlideChangeTime;
            
            // Validar cooldown
            if (timeSinceLastSlideChange >= this.slideChangeCooldown) {
                if (handLabel === 'Left') {
                    // MANO DERECHA - SIGUIENTE
                    console.log('➡️ SIGUIENTE (Mano Derecha levantada)');
                    if (this.gestureTypeEl) {
                        this.gestureTypeEl.textContent = '➡️ SIGUIENTE';
                        this.gestureTypeEl.className = 'text-blue-300 font-bold';
                    }
                    this.triggerGesture('➡️ SIGUIENTE', 'gesture-next');
                } else if (handLabel === 'Right') {
                    // MANO IZQUIERDA - ANTERIOR
                    console.log('⬅️ ANTERIOR (Mano Izquierda levantada)');
                    if (this.gestureTypeEl) {
                        this.gestureTypeEl.textContent = '⬅️ ANTERIOR';
                        this.gestureTypeEl.className = 'text-orange-300 font-bold';
                    }
                    this.triggerGesture('⬅️ ANTERIOR', 'gesture-prev');
                }
                
                // Resetear para evitar múltiples disparos
                this.handStateFrames = 0;
                this.lastHandState = null;
            }
        }

        // Mostrar feedback
        if (this.gestureTypeEl) {
            const direction = handLabel === 'Left' ? '➡️' : '⬅️';
            this.gestureTypeEl.textContent = `${direction} Mano levantada (${this.handStateFrames}/${this.requiredFrames})`;
            this.gestureTypeEl.className = 'text-cyan-400 text-xs';
        }
    }

    updateDisplay(handLabel, fingersUp, isRealFist, fistAnalysis) {
        if (this.handDetectedEl) {
            this.handDetectedEl.textContent = handLabel === 'Left' ? '🙌 MANO DERECHA' : '🙌 MANO IZQUIERDA';
        }
        if (this.fingersUpEl) {
            this.fingersUpEl.textContent = fingersUp;
        }
        if (this.fistStatusEl) {
            let fistText = '🖐️ MANO ABIERTA';
            let fistClass = 'text-green-400 font-bold';
            
            if (isRealFist) {
                fistText = '✊ PUÑO CERRADO';
                fistClass = 'text-red-400 font-bold';
            } else if (fistAnalysis.closingFist) {
                fistText = '👊 Cerrando puño...';
                fistClass = 'text-yellow-400 font-bold';
            }
            
            this.fistStatusEl.textContent = fistText;
            this.fistStatusEl.className = fistClass;
        }
        if (this.cameraEnabledStatusEl) {
            const stateText = this.gestureState === 'NORMAL' ? '✅' : '⏸️';
            if (this.cameraEnabled) {
                this.cameraEnabledStatusEl.textContent = `🟢 ${stateText} ON`;
                this.cameraEnabledStatusEl.className = 'text-green-300 font-bold';
            } else {
                this.cameraEnabledStatusEl.textContent = '🔴 OFF';
                this.cameraEnabledStatusEl.className = 'text-red-400 font-bold';
            }
        }
    }

    // ========== UTILIDADES ==========
    
    countFingersUp(landmarks) {
        let count = 0;

        // PULGAR: punta está afuera
        const thumbTip = landmarks[4];
        const thumbMCP = landmarks[2];
        if (thumbTip.x > thumbMCP.x + 0.05) {
            count++;
        }

        // ÍNDICE: punta arriba de PIP
        const indexTip = landmarks[8];
        const indexPIP = landmarks[6];
        if (indexTip.y < indexPIP.y - 0.03) {
            count++;
        }
        
        // MEDIO: punta arriba de PIP
        const middleTip = landmarks[12];
        const middlePIP = landmarks[10];
        if (middleTip.y < middlePIP.y - 0.03) {
            count++;
        }
        
        // ANULAR: punta arriba de PIP
        const ringTip = landmarks[16];
        const ringPIP = landmarks[14];
        if (ringTip.y < ringPIP.y - 0.03) {
            count++;
        }
        
        // MEÑIQUE: punta arriba de PIP
        const pinkyTip = landmarks[20];
        const pinkyPIP = landmarks[18];
        if (pinkyTip.y < pinkyPIP.y - 0.03) {
            count++;
        }

        return count;
    }

    // Análisis de puño: debe estar centrado y horizontal
    analyzeFist(landmarks) {
        const fingersUp = this.countFingersUp(landmarks);
        
        // Si hay dedos levantados, no es puño
        if (fingersUp > 0) {
            return { isFist: false, closingFist: false, confidence: 0 };
        }
        
        // Validación: distancia entre puntas de dedos y palma
        const palmCenter = landmarks[9];
        const fingerTips = [4, 8, 12, 16, 20];
        let fingersNearPalm = 0;
        
        for (let tipIdx of fingerTips) {
            const tip = landmarks[tipIdx];
            const distance = Math.sqrt(
                Math.pow(tip.x - palmCenter.x, 2) +
                Math.pow(tip.y - palmCenter.y, 2)
            );
            if (distance < 0.12) {
                fingersNearPalm++;
            }
        }
        
        // Validar que el puño esté CENTRADO
        let isCentered = true;
        for (let tipIdx of fingerTips) {
            const tip = landmarks[tipIdx];
            const distFromCenter = Math.sqrt(
                Math.pow(tip.x - palmCenter.x, 2) +
                Math.pow(tip.y - palmCenter.y, 2)
            );
            if (distFromCenter > 0.15) {
                isCentered = false;
                break;
            }
        }
        
        // Validar que el puño esté HORIZONTAL
        const fingerYPositions = fingerTips.map(idx => landmarks[idx].y);
        const minY = Math.min(...fingerYPositions);
        const maxY = Math.max(...fingerYPositions);
        const isHorizontal = (maxY - minY) < this.fistHorizontalTolerance;
        
        // Es PUÑO REAL si: 0 dedos levantados + 4+ dedos compactos + centrado + horizontal
        const isFist = fingersNearPalm >= 4 && isCentered && isHorizontal;
        
        // Detectar puño en formación
        const closingFist = fingersNearPalm >= 2 && fingersNearPalm < 4 && isCentered;
        
        return { isFist, closingFist, confidence: fingersNearPalm / 5 };
    }

    triggerGesture(gestureName, eventName) {
        const currentTime = Date.now();
        this.lastSlideChangeTime = currentTime;
        console.log(`✅ ${gestureName}`);
        document.dispatchEvent(new Event(eventName));
        this.showGestureNotification(gestureName);
    }

    showGestureNotification(gestureName) {
        const notification = document.createElement('div');
        notification.textContent = gestureName;
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px 30px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            z-index: 9999;
            animation: fadeInOut 1s ease-in-out;
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 1000);
    }
}

// === ESTILOS GLOBALES ===
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.5); }
        50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(1); }
    }
`;
document.head.appendChild(style);

// === INICIALIZACIÓN ===
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gestureProcessor = new GestureProcessor();
    });
} else {
    window.gestureProcessor = new GestureProcessor();
}
