import { Tile } from './Tile.js';
import { HardenedTile } from './HardenedTile.js';

export class TileGrid {
    constructor(startX, startY, cols, rows, tileSize) {
        this.tiles = [];
        this.tileSize = tileSize;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                
                const rand = Math.random();
                let type = 'solid'; // Default
                
                // 30% chance for hardened, and the rest solid:
                if (rand > 0.7) { 
                    type = 'hardened';
                }

                let tile;
                if (type === 'hardened') {
                    tile = new HardenedTile(
                        startX + col * tileSize,
                        startY + row * tileSize,
                        tileSize
                    );
                } else {
                    tile = new Tile(
                        startX + col * tileSize,
                        startY + row * tileSize,
                        tileSize,
                        type
                    );
                }
                
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
    getHardenedTiles() {
        return this.tiles.filter(t => t.type === 'hardened');
    }
}
