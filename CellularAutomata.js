import * as THREE from "three";

const dummy = new THREE.Object3D();
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshNormalMaterial();

class Cell {
    constructor(state = 0, maxLife = 5) {
        this.state = state;
        this.prevState = state;
        this.life = state === 1 ? maxLife : 0;
        this.maxLife = maxLife;
        this.visible = true;
        this.update();
    }

    update() {
        // decrease life if you are dead
        if (this.state === 0) {
            this.life = Math.max(0, this.life - 1);

            // if you are dead and have no life, hide yourself
            if (this.life == 0) {
                this.visible = false;
            }
        }
    }

    getState() {
        if (this.life > 0) {
            return this.state;
        }

        return 0;
    }

    setState(state) {
        this.prevState = this.state;
        this.state = state;

        if (state === 1 && this.life === 0 && this.prevState === 0) {
            this.life = this.maxLife;
            this.visible = true;
        }
    }
}

export default class CellularAutomata {
    constructor(width = 20, height = 20, depth = 20) {
        this.width = width;
        this.height = height;
        this.depth = depth;
        this.state = this.initializeState(true);
    }

    traverseState(cb) {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                for (let z = 0; z < this.depth; z++) {
                    const cell = this.state[x][y][z];
                    cb(cell, x, y, z);
                }
            }
        }
    }

    offsetCoordinates(x, y, z) {
        const offsetX = (this.width - 1) / 2;
        const offsetY = (this.height - 1) / 2;
        const offsetZ = (this.depth - 1) / 2;

        return [offsetX - x, offsetY - y, offsetZ - z];
    }

    addCellsTo(scene) {
        let i = 0;

        const mesh = new THREE.InstancedMesh(
            boxGeometry,
            boxMaterial,
            this.width * this.height * this.depth
        );
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

        this.traverseState((_, x, y, z) => {
            dummy.position.set(...this.offsetCoordinates(x, y, z));
            dummy.updateMatrix();
            mesh.setMatrixAt(i++, dummy.matrix);
        });

        mesh.instanceMatrix.needsUpdate = true;
        this.mesh = mesh;
        scene.add(mesh);
    }

    getNeighbors(x, y, z) {
        let neighbors = 0;

        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                for (let k = -1; k <= 1; k++) {
                    const nX = ((i < 0 ? i + this.width : i) + x) % this.width,
                        nY = ((j < 0 ? j + this.height : j) + y) % this.height,
                        nZ = ((k < 0 ? k + this.depth : k) + z) % this.depth;

                    neighbors += this.state[nX][nY][nZ].prevState; //();
                }
            }
        }

        // remove current cell from neighbors
        neighbors -= this.state[x][y][z].prevState; //();

        return neighbors;
    }

    update() {
        let i = 0;

        this.traverseState((cell, x, y, z) => {
            const neighbors = this.getNeighbors(x, y, z);

            // The first 4 indicates that a state 1 cell survives if it has 4 neighbor cells.
            if (cell.getState() === 1 && neighbors === 4) {
                cell.setState(1);
            }

            // The second 4 indicates that a cell is born in an empty location if it has 4 neighbors.
            if (cell.getState() === 0 && neighbors === 4) {
                cell.setState(1);
            }

            // Otherwise, die
            else {
                cell.setState(0);
            }

            // The 5 means each cell has 5 total states it can be in (state 4 for newly born which then fades to state 1 and then state 0 for no cell)

            cell.update();

            // update visibility by setting scale
            dummy.position.set(...this.offsetCoordinates(x, y, z));
            if (cell.visible) {
                dummy.scale.set(1, 1, 1);
            } else {
                dummy.scale.set(0, 0, 0);
            }

            dummy.updateMatrix();
            this.mesh.setMatrixAt(i++, dummy.matrix);
        });

        this.mesh.instanceMatrix.needsUpdate = true;
    }

    initializeState(useRandomStates = true) {
        const createArray = (length) => new Array(length).fill(0);
        const randomState = () =>
            useRandomStates ? (Math.random() > 0.95 ? 1 : 0) : 0;

        return createArray(this.width).map(() =>
            createArray(this.height).map(() =>
                createArray(this.depth).map(() => new Cell(randomState()))
            )
        );
    }
}
