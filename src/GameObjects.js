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
    }

    getVertices() {
        // Override in subclasses
        return [];
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
        this.gapSize = 7;
        this.type = type; // 'solid', 'empty', 'hazard'
    }

    getVertices() {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const hw = this.width / 2;
    const hh = this.height / 2;

    // The 4 corners relative to center
    const corners = [
        { x: -hw, y: -hh }, { x: hw, y: -hh },
        { x: hw, y: hh }, { x: -hw, y: hh }
    ];

    // Rotate and translate corners to world space
    return corners.map(p => {
        return {
            x: cx + p.x * Math.cos(this.rot) - p.y * Math.sin(this.rot),
            y: cy + p.x * Math.sin(this.rot) + p.y * Math.cos(this.rot)
        };
    });
}

    draw(ctx) {
        switch (this.type) {
            case 'solid':
                ctx.fillStyle = 'green';
                break;
            case 'hazard':
                ctx.fillStyle = 'red';
                break;
            default:
                return; // Don't draw empty tiles
        }
        ctx.fillRect(this.x, this.y, this.size - this.gapSize, this.size - this.gapSize);
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
        this.minRot = Math.PI / 180 * -70;
        this.maxRot = Math.PI / 180 * 70;
        this.rotDirection = 1;
        this.canRotate = true;
        this.speed = 2;
    }

    getVertices() {
        const half = this.size / 2;
        const localVerts = [
            { x: -half, y: -half },
            { x: half, y: -half },
            { x: half, y: half },
            { x: -half, y: half }
        ];
        return localVerts.map(v => this.rotatePoint(v.x, v.y));
    }

    update(deltaSeconds, canRotate) {
        this.rotate(deltaSeconds, canRotate);
    }

    rotate(deltaSeconds){
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
            ctx.fillStyle = 'red';
            ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        }

        ctx.restore();
    }
}

export class Tongue extends GameObject {
    constructor(frog) {
        super(frog.x, frog.y);
        this.frog = frog;
        this.width = 5;
        this.length = 0;
        this.extendSpeed = 170;
        this.retractSpeed = 250;
        this.maxLength = 200;
        this.state = PLAYERSTATES.IDLE;
    }

    getVertices() {
        if (this.length === 0) return [];

        const half = this.width / 2;
        const localVerts = [
            { x: -half, y: 0 },
            { x: half, y: 0 },
            { x: half, y: -this.length },
            { x: -half, y: -this.length }
        ];
        return localVerts.map(v => this.rotatePoint(v.x, v.y));
    }

    update(deltaSeconds, spacePressed) {
        // Sync position and rotation with frog
        this.x = this.frog.x;
        this.y = this.frog.y;
        this.rotation = this.frog.rotation;

        if (spacePressed && this.state === PLAYERSTATES.IDLE) {
            this.state = PLAYERSTATES.EXTENDING;
        }

        switch (this.state) {
            case PLAYERSTATES.EXTENDING:
                this.frog.canRotate = false;
                this.length += this.extendSpeed * deltaSeconds;
                if (this.length >= this.maxLength) {
                    this.length = this.maxLength;
                    this.state = PLAYERSTATES.RETRACTING;
                    this.frog.canRotate = true;
                }
                break;
            case PLAYERSTATES.RETRACTING:
                this.length -= this.retractSpeed * deltaSeconds;
                if (this.length <= 0) {
                    this.length = 0;
                    this.state = PLAYERSTATES.IDLE;
                    this.frog.canRotate = true;
                }
                break;
        }
    }

    draw(ctx) {
        if (this.length === 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.fillStyle = 'pink';
        ctx.fillRect(-this.width / 2, -this.length, this.width, this.length);
        ctx.restore();
    }
}