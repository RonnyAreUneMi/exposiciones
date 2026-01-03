// Test Script para Verificar Gestos
// Abre la consola del navegador (F12) y ejecuta estos comandos

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║     🧪 TEST DE GESTOS - Copia y pega en la consola       ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

console.log(`
1️⃣  PRUEBA DE INICIALIZACIÓN:
   window.gestureProcessor      ← Debe existir
   window.slideManager          ← Debe existir

2️⃣  SIMULAR GESTO SIGUIENTE (Mano Derecha):
   document.dispatchEvent(new Event('gesture-next'));

3️⃣  SIMULAR GESTO ANTERIOR (Mano Izquierda):
   document.dispatchEvent(new Event('gesture-prev'));

4️⃣  VER ESTADO DEL SISTEMA:
   window.testStatus();

5️⃣  VER DIAPOSITIVA ACTUAL:
   window.slideManager.currentIndex + ' (índice 0-based)'
`);

// Función para ver estado
window.testStatus = function() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 ESTADO DEL SISTEMA');
    console.log('═══════════════════════════════════════════════════════════');
    
    if (window.gestureProcessor) {
        console.log('✅ GestureProcessor: CARGADO');
        console.log('   - Cámara habilitada:', window.gestureProcessor.cameraEnabled);
        console.log('   - Cooldown:', window.gestureProcessor.cooldown, 'ms');
        console.log('   - Historial:', window.gestureProcessor.gestureHistory.length);
    } else {
        console.log('❌ GestureProcessor: NO CARGADO');
    }
    
    if (window.slideManager) {
        console.log('✅ SlideManager: CARGADO');
        console.log('   - Diapositiva actual:', window.slideManager.currentIndex + 1);
        console.log('   - Total:', window.slideManager.totalSlides);
    } else {
        console.log('❌ SlideManager: NO CARGADO');
    }
    
    console.log('═══════════════════════════════════════════════════════════');
};

// Funciones rápidas de prueba
window.test = {
    siguiente: () => {
        console.log('🧪 [TEST] Despachando: gesture-next');
        document.dispatchEvent(new Event('gesture-next'));
    },
    anterior: () => {
        console.log('🧪 [TEST] Despachando: gesture-prev');
        document.dispatchEvent(new Event('gesture-prev'));
    },
    status: () => window.testStatus()
};

console.log('💡 Accesos rápidos disponibles:');
console.log('   window.test.siguiente()');
console.log('   window.test.anterior()');
console.log('   window.test.status()');
