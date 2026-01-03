// Gesture Debugging Script
// Add comprehensive logging for gesture detection

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║         GESTURE DEBUG - Sistema inicializado              ║');
console.log('╚════════════════════════════════════════════════════════════╝');

// Log all events dispatched
const originalDispatchEvent = EventTarget.prototype.dispatchEvent;
EventTarget.prototype.dispatchEvent = function(event) {
    if (event.type.startsWith('gesture-')) {
        console.log(`🎯 [EVENT DISPATCH] ${event.type}`);
    }
    return originalDispatchEvent.call(this, event);
};

// Wait for DOM and log when scripts initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║              DOM READY - Esperando módulos                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    
    setTimeout(() => {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║              STATUS DESPUÉS DE 1 SEGUNDO                   ║');
        console.log('╚════════════════════════════════════════════════════════════╝');
        
        if (window.gestureProcessor) {
            console.log('✅ GestureProcessor está disponible');
            console.log('   - Camera habilitada:', window.gestureProcessor.cameraEnabled);
            console.log('   - Cooldown:', window.gestureProcessor.cooldown, 'ms');
        } else {
            console.log('❌ GestureProcessor NO está disponible');
        }
        
        if (window.slideManager) {
            console.log('✅ SlideManager está disponible');
            console.log('   - Diapositiva actual:', window.slideManager.currentIndex + 1);
            console.log('   - Total diapositivas:', window.slideManager.totalSlides);
        } else {
            console.log('❌ SlideManager NO está disponible');
        }
    }, 1000);
});

// Log gesture events
document.addEventListener('gesture-next', () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         ✅ GESTO DETECTADO: SIGUIENTE (Right Swipe)        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
});

document.addEventListener('gesture-prev', () => {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║         ✅ GESTO DETECTADO: ANTERIOR (Left Swipe)          ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
});

// Log camera state changes
document.addEventListener('camera-state-changed', (e) => {
    console.log(`🎥 Estado de cámara cambiado: ${e.detail.active ? 'ACTIVADA' : 'DESACTIVADA'}`);
});

// Test function for manual testing
window.testGesture = {
    next: () => {
        console.log('🧪 [TEST] Despachando gesto SIGUIENTE...');
        document.dispatchEvent(new Event('gesture-next'));
    },
    prev: () => {
        console.log('🧪 [TEST] Despachando gesto ANTERIOR...');
        document.dispatchEvent(new Event('gesture-prev'));
    }
};

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║  Pruebas manuales disponibles:                             ║');
console.log('║  - window.testGesture.next()   -> Simula gesto SIGUIENTE  ║');
console.log('║  - window.testGesture.prev()   -> Simula gesto ANTERIOR   ║');
console.log('╚════════════════════════════════════════════════════════════╝');
