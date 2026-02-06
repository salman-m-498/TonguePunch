import { Tile } from './Tile.js';

export class HardenedTile extends Tile {
    constructor(x, y, size) {
        super(x, y, size, 'hardened');
        this.hp = 2;
        this.canPickup = false; // Cannot be picked up
    }

    onHit(projectile) {
        this.hp -= 1;
        this.reflectProjectile(projectile);
        if (this.hp <= 0) {
            this.type = 'empty';
        }
    }
    reflectProjectile(projectile) {
        const dx = (projectile.x + projectile.size / 2) - (this.x + this.size / 2);
        const dy = (projectile.y + projectile.size / 2) - (this.y + this.size / 2);

        if (Math.abs(dx) > Math.abs(dy)) {
            projectile.velocity.x *= -1;
        } else {
            projectile.velocity.y *= -1;
        }
    }

    draw(ctx) {
        if (this.type === 'empty') return;
        
        ctx.save();
        if (this.hp === 2) ctx.fillStyle = '#5e501b';
        else if (this.hp === 1) ctx.fillStyle = '#8d6e63';
        ctx.fillRect(this.x + this.gapSize, this.y + this.gapSize, 
                     this.size - this.gapSize * 2, this.size - this.gapSize * 2);
        ctx.restore();
    }
}
