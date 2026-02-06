export class GameObject {
    constructor(x, y, rotation = 0) {
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.width = 0;
        this.height = 0;
    }

    // Helper to get corners for SAT
    getVertices() { return []; }

    // Optimization: A simple circle/box that contains the whole object regardless of rotation
    getBroadBounds() {
        const diagonal = Math.sqrt(this.width ** 2 + this.height ** 2);
        const half = diagonal / 2;
        return {
            left: this.x - half,
            right: this.x + half,
            top: this.y - half,
            bottom: this.y + half
        };
    }

    rotatePoint(px, py) {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return {
            x: this.x + px * cos - py * sin,
            y: this.y + px * sin + py * cos
        };
    }
}
