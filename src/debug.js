// Debug helper
export function debugCollisions(tongue, tileGrid) {
    console.log('=== Collision Debug ===');
    console.log('Tongue state:', tongue.state);
    console.log('Tongue length:', tongue.length);
    const solidTiles = tileGrid.getSolidTiles();
    console.log('Solid tiles count:', solidTiles.length);
    console.log('Total tiles:', tileGrid.tiles.length);
    console.log('Empty tiles:', tileGrid.tiles.filter(t => t.type === 'empty').length);
}
