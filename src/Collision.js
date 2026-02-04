// I AM NOT SMART ENOUGH TO UNDERSTAND THIS MATH STUFF SO I COPIED IT FROM ONLINE SOURCES
// Source: https://www.sevenson.com.au/programming/sat/

export class CollisionUtils{
    static checkSAT(objA, objB) {
        const polyA = objA.getVertices();
        const polyB = objB.getVertices();

        // Get all axes to test
        const axes = [...this.#getNormals(polyA), ...this.#getNormals(polyB)];

        // Test all axes for gap
        for(let axis of axes) {
            const projection1 = this.#project(polyA, axis);
            const projection2 = this.#project(polyB, axis);

            if (projection1.max < projection2.min || projection2.max < projection1.min) {
                return false; // Gap found, no collision
            }
        }
        return true; // No gaps found, collision detected
    }

    // Project shape onto axis and find dot products
    static #project(vertices, axis) {
        let min = (vertices[0].x * axis.x + vertices[0].y * axis.y);
        let max = min;

        for (let i = 1; i < vertices.length; i++) {
            const dot = (vertices[i].x * axis.x + vertices[i].y * axis.y);
            if (dot < min) min = dot;
            if (dot > max) max = dot;
        }
        return { min, max };
    }

    // Find perpendicular vectors for each edge
    static #getNormals(vertices) {
        const normals = [];
        for (let i = 0; i < vertices.length; i++) {
            const p1 = vertices[i];
            const p2 = vertices[(i + 1) % vertices.length];
            // Normal = (-dy, dx)
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            const normal = { x: -edge.y, y: edge.x };
            // Normalize the normal vector
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            normals.push({ x: normal.x / length, y: normal.y / length });
        }
        return normals;
    }
}