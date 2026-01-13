export class DrawManager {
    constructor(container) {
        this.container = document.getElementById('presentation-container');
        this.canvas = document.getElementById('draw-canvas');
        this.ctx = this.canvas.getContext('2d');

        this.isDrawing = false;
        this.active = false;

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    enable() {
        this.active = true;
        this.canvas.classList.remove('pointer-events-none');

        this.fitToSlide();

        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';

        this.canvas.addEventListener('mousedown', this.startDraw);
        this.canvas.addEventListener('mousemove', this.draw);
        document.addEventListener('mouseup', this.stopDraw);

        this.canvas.addEventListener('touchstart', this.startDraw, { passive: false });
        this.canvas.addEventListener('touchmove', this.draw, { passive: false });
        document.addEventListener('touchend', this.stopDraw);
    }

    disable() {
        this.active = false;
        this.canvas.classList.add('pointer-events-none');

        this.canvas.removeEventListener('mousedown', this.startDraw);
        this.canvas.removeEventListener('mousemove', this.draw);
        document.removeEventListener('mouseup', this.stopDraw);

        this.canvas.removeEventListener('touchstart', this.startDraw);
        this.canvas.removeEventListener('touchmove', this.draw);
        document.removeEventListener('touchend', this.stopDraw);
    }

    startDraw = (e) => {
        if (!this.active) return;
        e.preventDefault();
        this.isDrawing = true;

        const { x, y } = this.getPos(e);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    };

    draw = (e) => {
        if (!this.isDrawing) return;
        e.preventDefault();

        const { x, y } = this.getPos(e);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
    };

    stopDraw = () => {
        this.isDrawing = false;
        this.ctx.closePath();
    };

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const p = e.touches ? e.touches[0] : e;
        return {
            x: p.clientX - rect.left,
            y: p.clientY - rect.top
        };
    }

    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setColor(color) {
    this.ctx.strokeStyle = color;
    }

    setSize(size) {
        this.ctx.lineWidth = size;
    }

    fitToSlide() {
        const activeSlide = document.querySelector('.slide.opacity-100');
        if (!activeSlide) return;

        const rect = activeSlide.getBoundingClientRect();
        const parentRect = activeSlide.parentElement.getBoundingClientRect();

        this.canvas.width = rect.width;
        this.canvas.height = rect.height;

        this.canvas.style.left = `${rect.left - parentRect.left}px`;
        this.canvas.style.top = `${rect.top - parentRect.top}px`;
    }


}
