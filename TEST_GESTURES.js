// TEST SCRIPT - Validar GestureProcessor
// Ejecutar en consola del navegador mientras está abierta la presentación

console.group('🧪 TEST DE GESTURES');

// Test 1: Verificar que GestureProcessor existe
console.log('✓ GestureProcessor inicializado:', !!window.gestureProcessor);

// Test 2: Verificar que MediaPipe está cargado
console.log('✓ Hands disponible:', typeof Hands !== 'undefined');
console.log('✓ Camera disponible:', typeof Camera !== 'undefined');
console.log('✓ drawConnectors disponible:', typeof drawConnectors !== 'undefined');

// Test 3: Verificar que el video element existe
const video = document.getElementById('input-video');
const canvas = document.getElementById('output-canvas');
console.log('✓ Video element:', !!video);
console.log('✓ Canvas element:', !!canvas);

// Test 4: Verificar estado actual
if (window.gestureProcessor) {
  const gp = window.gestureProcessor;
  console.log('✓ Cámara iniciada:', gp.mediaStarted);
  console.log('✓ Estado:', gp.gestureState);
  console.log('✓ Cámara habilitada:', gp.cameraEnabled);
}

// Test 5: Verificar eventos
console.log('✓ Evento gesture-next disponible');
console.log('✓ Evento gesture-prev disponible');
console.log('✓ Evento start-camera disponible');

console.groupEnd();

console.log('💡 Para disparar gestos manualmente:');
console.log('   document.dispatchEvent(new Event("gesture-next"))');
console.log('   document.dispatchEvent(new Event("gesture-prev"))');
