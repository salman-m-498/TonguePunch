export const PLAYERSTATES = {
    IDLE: 'IDLE',
    EXTENDING: 'EXTENDING',
    RETRACTING: 'RETRACTING',
    DEATH: 'DEATH'
};

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

export class Tile extends GameObject {
    constructor(x, y, size, type = 'solid') {
        super(x, y);
        this.size = size;
        this.width = size;
        this.height = size;
        this.gapSize = 2; // Reduced gap for better collision feel
        this.type = type; 
    }

    getVertices() {
        const half = this.size / 2;
        // Tiles are usually static, but we'll support rotation just in case
        const localVerts = [
            { x: -half, y: -half },
            { x: half, y: -half },
            { x: half, y: half },
            { x: -half, y: half }
        ];
        // Note: Tile x,y is usually top-left, so we adjust to center for rotation
        const centerX = this.x + half;
        const centerY = this.y + half;
        
        return localVerts.map(v => {
            const cos = Math.cos(this.rotation);
            const sin = Math.sin(this.rotation);
            return {
                x: centerX + v.x * cos - v.y * sin,
                y: centerY + v.x * sin + v.y * cos
            };
        });
    }

    draw(ctx) {
        if (this.type === 'empty') return;
        
        ctx.save();
        ctx.fillStyle = this.type === 'solid' ? '#2e7d32' : '#c62828';
        // Drawing slightly smaller than the collision box for a "grid" look
        ctx.fillRect(this.x + this.gapSize, this.y + this.gapSize, 
                     this.size - this.gapSize * 2, this.size - this.gapSize * 2);
        ctx.restore();
    }
}

export class TileGrid {
    constructor(startX, startY, cols, rows, tileSize) {
        this.tiles = [];
        this.tileSize = tileSize;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tile = new Tile(
                    startX + col * tileSize,
                    startY + row * tileSize,
                    tileSize,
                    'solid'
                );
                this.tiles.push(tile);
            }
        }
    }

    draw(ctx) {
        this.tiles.forEach(tile => tile.draw(ctx));
    }

    getSolidTiles() {
        return this.tiles.filter(t => t.type === 'solid');
    }
}


export class Frog extends GameObject {
    constructor(x, y) {
        super(x, y);
        this.size = 50;
        this.width = this.size;
        this.height = this.size;
        this.minRot = (Math.PI / 180) * -70;
        this.maxRot = (Math.PI / 180) * 70;
        this.rotDirection = 1;
        this.canRotate = true;
        this.speed = 2.5;
    }

    getVertices() {
        const half = this.size / 2;
        const localVerts = [
            { x: -half, y: -half }, { x: half, y: -half },
            { x: half, y: half }, { x: -half, y: half }
        ];
        return localVerts.map(v => this.rotatePoint(v.x, v.y));
    }

    update(deltaSeconds) {
        if (!this.canRotate) return;

        this.rotation += this.rotDirection * this.speed * deltaSeconds;

        if (this.rotation >= this.maxRot) {
            this.rotation = this.maxRot;
            this.rotDirection = -1;
        } else if (this.rotation <= this.minRot) {
            this.rotation = this.minRot;
            this.rotDirection = 1;
        }
    }

    draw(ctx, images) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (images.player && images.player.complete) {
            ctx.drawImage(images.player, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            // Placeholder: Triangle pointing "up" (where tongue goes)
            ctx.fillStyle = '#4caf50';
            ctx.beginPath();
            ctx.moveTo(0, -this.size / 2);
            ctx.lineTo(this.size / 2, this.size / 2);
            ctx.lineTo(-this.size / 2, this.size / 2);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    }
}

export class Tongue extends GameObject {
    constructor(frog) {
        super(frog.x, frog.y);
        this.frog = frog;
        this.width = 8;
        this.length = 0;
        this.extendSpeed = 400;
        this.retractSpeed = 600;
        this.maxLength = 350;
        this.state = PLAYERSTATES.IDLE;
    }

    getVertices() {
        if (this.length <= 0) return [];
        const half = this.width / 2;
        // The tongue extends "up" from the frog's mouth (negative Y)
        const localVerts = [
            { x: -half, y: 0 },
            { x: half, y: 0 },
            { x: half, y: -this.length },
            { x: -half, y: -this.length }
        ];
        return localVerts.map(v => this.rotatePoint(v.x, v.y));
    }

    // Override to cover the full extension range
    getBroadBounds() {
        // Since the tongue rotates around (x,y) and extends by 'length',
        // we need a box that covers the full potential reach radius.
        const radius = this.length + this.width; // Add width for safety
        return {
            left: this.x - radius,
            right: this.x + radius,
            top: this.y - radius,
            bottom: this.y + radius
        };
    }

    update(deltaSeconds, spacePressed) {
        this.x = this.frog.x;
        this.y = this.frog.y;
        this.rotation = this.frog.rotation;

        if (spacePressed && this.state === PLAYERSTATES.IDLE) {
            this.state = PLAYERSTATES.EXTENDING;
        }

        switch (this.state) {
            case PLAYERSTATES.EXTENDING:
                this.frog.canRotate = false; // Lock frog
                this.length += this.extendSpeed * deltaSeconds;
                this.height = this.length; // Update height for collision detection
                if (this.length >= this.maxLength) {
                    this.length = this.maxLength;
                    this.height = this.length;
                    this.state = PLAYERSTATES.RETRACTING;
                }
                break;
                
            case PLAYERSTATES.RETRACTING:
                this.length -= this.retractSpeed * deltaSeconds;
                this.height = this.length; // Update height for collision detection
                if (this.length <= 0) {
                    this.length = 0;
                    this.height = 0;
                    this.state = PLAYERSTATES.IDLE;
                    this.frog.canRotate = true; // Unlock frog
                }
                break;
        }
    }

    draw(ctx) {
        if (this.length <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Tongue line
        ctx.fillStyle = '#ff80ab';
        ctx.fillRect(-this.width / 2, -this.length, this.width, this.length);
        
        // Tongue Tip
        ctx.fillStyle = '#ff4081';
        ctx.fillRect(-this.width, -this.length - 5, this.width * 2, 10);
        
        ctx.restore();
    }

    onCollision(tile) {
        console.log("Tongue collided with tile at:", tile.x, tile.y);
        tile.type = 'empty'; // Example effect: remove tile
        this.state = PLAYERSTATES.RETRACTING;
    }
}