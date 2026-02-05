export const PLAYERSTATES = {
    IDLE: 'IDLE',
    EXTENDING: 'EXTENDING',
    RETRACTING: 'RETRACTING',
    LOADED: 'LOADED',
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
        this.velocity = { x: 0, y: 0 }; 
        this.type = type;
        this.canPickup = true; //
        this.isMoving = false;
    }

    update(deltaSeconds) {
        if (!this.isMoving) return;
        this.x += this.velocity.x * deltaSeconds;
        this.y += this.velocity.y * deltaSeconds;
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
        if (this.type === 'solid') ctx.fillStyle = '#2e7d32';
        else if (this.type === 'held') ctx.fillStyle = '#66bb6a'; // Lighter green
        else ctx.fillStyle = '#c62828'; // Projectile or other

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
        this.width = this.size + 10;
        this.height = this.size;
        this.minRot = (Math.PI / 180) * -70;
        this.maxRot = (Math.PI / 180) * 70;
        this.rotDirection = 1;
        this.canRotate = true;
        this.speed = 2.5;
        this.frameIndex = 0;
        this.animTimer = 0;
        this.animSpeed = 0.2;
        this.animations = {
            [PLAYERSTATES.IDLE]: { frames: ["fwoggie 1.png", "fwoggie 2.png", "fwoggie 3.png"], 
                loop: true },
            [PLAYERSTATES.DEATH]: { frames: ["fwoggie dead.png"], loop: false }
        };
        this.state = PLAYERSTATES.IDLE;
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
        // TODO: Refactor Animation functions into separate Animator class
        // Animation
        this.animTimer += deltaSeconds;
        if (this.animTimer >= this.animSpeed) {
            this.animTimer = 0;
            const anim = this.animations[this.state];
            if (anim) {
                this.frameIndex++;
                if (this.frameIndex >= anim.frames.length) {
                    this.frameIndex = anim.loop ? 0 : anim.frames.length - 1;
                }
            }
        }
        
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

    draw(ctx, images, atlas) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        if (images.frogSpritesheet && atlas) {
        const anim = this.animations[this.state];
        const frameName = anim.frames[this.frameIndex];
        const frameData = atlas.frames[frameName].frame;

        ctx.drawImage(
            images.frogSpritesheet,
            frameData.x, frameData.y, // Source X, Y from JSON
            frameData.w, frameData.h, // Source W, H from JSON
            -this.size / 2, -this.size / 2, // Center on frog position
            this.size, this.size      // Scale to frog size
            );
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
        this.attachedTile = null;
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

    // Helper to find the world-space tip of the tongue
    getTipPosition() {
        return this.rotatePoint(0, -this.length);
    }

    update(deltaSeconds, spacePressed) {
        this.x = this.frog.x;
        this.y = this.frog.y;
        this.rotation = this.frog.rotation;

        if (spacePressed) {
            if (this.state === PLAYERSTATES.IDLE) {
                this.state = PLAYERSTATES.EXTENDING;
            } else if (this.state === PLAYERSTATES.LOADED) {
                this.shootTile();
                return;
            }
        }

        switch (this.state) {
            case PLAYERSTATES.LOADED:
                if (this.attachedTile) {
                     // Keep tile at mouth
                     const mouthPos = this.rotatePoint(0, -20); // Slightly in front
                     this.attachedTile.x = mouthPos.x - this.attachedTile.size/2;
                     this.attachedTile.y = mouthPos.y - this.attachedTile.size/2;
                } else {
                     this.state = PLAYERSTATES.IDLE;
                }
                break;

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

                // If we have a tile, make it follow the tip of the tongue
                if (this.attachedTile) {
                    const tipPos = this.getTipPosition(); // Helper to find the end of the tongue
                    this.attachedTile.x = tipPos.x - this.attachedTile.size / 2;
                    this.attachedTile.y = tipPos.y - this.attachedTile.size / 2;
                }

                this.height = this.length; // Update height for collision detection
                if (this.length <= 0) {
                    this.length = 0;
                    this.height = 0;
                    // If we brought a tile back, stay in IDLE but keep the tile at the Frog's mouth
                    if (this.attachedTile) {
                        this.state = PLAYERSTATES.LOADED; 
                    } else {
                        this.state = PLAYERSTATES.IDLE;
                    }
                    this.frog.canRotate = true; // Unlock frog
                }
                break;
        }
    }

    shootTile() {
        if (!this.attachedTile) return;
        
        const shootSpeed = 600;
        // The tongue extends "up" from the frog (negative Y local space)
        // We use the same direction for shooting
        const dir = this.rotatePoint(0, -1);
        const dx = dir.x - this.x;
        const dy = dir.y - this.y;
        const len = Math.hypot(dx, dy);
        
        this.attachedTile.velocity.x = (dx / len) * shootSpeed;
        this.attachedTile.velocity.y = (dy / len) * shootSpeed;
        this.attachedTile.isMoving = true;
        this.attachedTile.type = 'projectile';
        
        this.attachedTile = null;
        this.state = PLAYERSTATES.IDLE;
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
        if (tile.canPickup) {
            console.log("Picked up tile!");
            this.attachedTile = tile;
            tile.type = 'held';
        }
        this.state = PLAYERSTATES.RETRACTING;
    }
}